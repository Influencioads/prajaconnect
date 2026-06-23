import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export type SyncEntityType = 'household' | 'response' | 'grievance' | 'citizen_update' | 'task_update';

async function initSchema(database: SQLite.SQLiteDatabase) {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id TEXT UNIQUE NOT NULL,
      entity_type TEXT NOT NULL,
      payload TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      error TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      synced_at TEXT
    );
    CREATE TABLE IF NOT EXISTS local_surveys (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      name_te TEXT,
      type TEXT,
      status TEXT,
      payload TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS local_households (
      client_id TEXT PRIMARY KEY,
      server_id TEXT,
      survey_id TEXT,
      head_name TEXT NOT NULL,
      payload TEXT NOT NULL,
      synced INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS local_responses (
      client_id TEXT PRIMARY KEY,
      server_id TEXT,
      survey_id TEXT NOT NULL,
      household_client_id TEXT,
      payload TEXT NOT NULL,
      synced INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
  // Idempotent migrations for columns added after the original schema shipped.
  for (const stmt of [
    'ALTER TABLE sync_queue ADD COLUMN error TEXT',
    'ALTER TABLE sync_queue ADD COLUMN attempts INTEGER DEFAULT 0',
    'ALTER TABLE sync_queue ADD COLUMN next_attempt_at TEXT',
  ]) {
    try {
      await database.execAsync(stmt);
    } catch {
      /* column may already exist */
    }
  }
}

// Retry policy: up to MAX_SYNC_ATTEMPTS with exponential backoff, then park as 'failed'.
export const MAX_SYNC_ATTEMPTS = 5;
export const SYNC_BATCH_LIMIT = 200;
function backoffSeconds(attempts: number) {
  return Math.min(30 * 2 ** attempts, 3600); // 30s, 60s, 120s … capped at 1h
}

export async function getDb() {
  if (!db) {
    db = await SQLite.openDatabaseAsync('praja_d2d.db');
    await initSchema(db);
  }
  return db;
}

export async function enqueueSync(clientId: string, entityType: SyncEntityType | string, payload: object) {
  const database = await getDb();
  await database.runAsync(
    'INSERT OR REPLACE INTO sync_queue (client_id, entity_type, payload, status, error) VALUES (?, ?, ?, ?, NULL)',
    clientId,
    entityType,
    JSON.stringify(payload),
    'pending',
  );
}

export async function enqueueGrievanceSync(clientId: string, payload: object) {
  return enqueueSync(clientId, 'grievance', payload);
}

export async function enqueueCitizenUpdateSync(clientId: string, payload: object) {
  return enqueueSync(clientId, 'citizen_update', payload);
}

export async function enqueueTaskUpdateSync(clientId: string, payload: object) {
  return enqueueSync(clientId, 'task_update', payload);
}

export async function getPendingSyncCount() {
  const database = await getDb();
  const row = await database.getFirstAsync<{ c: number }>(
    "SELECT COUNT(*) as c FROM sync_queue WHERE status = 'pending'",
  );
  return row?.c ?? 0;
}

// Only return items that are due (backoff window elapsed) and cap the batch
// so a large backlog can't build one enormous request.
export async function getPendingSyncItems(limit = SYNC_BATCH_LIMIT) {
  const database = await getDb();
  return database.getAllAsync<{ client_id: string; entity_type: string; payload: string }>(
    `SELECT client_id, entity_type, payload FROM sync_queue
     WHERE status = 'pending' AND (next_attempt_at IS NULL OR next_attempt_at <= datetime('now'))
     ORDER BY id ASC LIMIT ?`,
    limit,
  );
}

export async function markSynced(clientIds: string[]) {
  if (!clientIds.length) return;
  const database = await getDb();
  for (const id of clientIds) {
    await database.runAsync(
      "UPDATE sync_queue SET status = 'synced', synced_at = datetime('now'), error = NULL WHERE client_id = ?",
      id,
    );
  }
}

export async function markFailed(clientIds: string[], error?: string) {
  if (!clientIds.length) return;
  const database = await getDb();
  for (const id of clientIds) {
    await database.runAsync(
      "UPDATE sync_queue SET status = 'failed', error = ? WHERE client_id = ?",
      error ?? 'Sync failed',
      id,
    );
  }
}

// Transient/network failure: increment attempts and schedule a backed-off retry,
// keeping status 'pending' until attempts are exhausted, then park as 'failed'.
export async function markRetry(clientIds: string[], error?: string) {
  if (!clientIds.length) return;
  const database = await getDb();
  for (const id of clientIds) {
    const row = await database.getFirstAsync<{ attempts: number }>(
      'SELECT attempts FROM sync_queue WHERE client_id = ?',
      id,
    );
    const attempts = (row?.attempts ?? 0) + 1;
    if (attempts >= MAX_SYNC_ATTEMPTS) {
      await database.runAsync(
        "UPDATE sync_queue SET status = 'failed', attempts = ?, error = ? WHERE client_id = ?",
        attempts,
        error ?? 'Sync failed after retries',
        id,
      );
    } else {
      await database.runAsync(
        `UPDATE sync_queue SET status = 'pending', attempts = ?, error = ?,
         next_attempt_at = datetime('now', '+' || ? || ' seconds') WHERE client_id = ?`,
        attempts,
        error ?? 'Will retry',
        backoffSeconds(attempts),
        id,
      );
    }
  }
}

export async function markConflict(clientIds: string[], error?: string) {
  if (!clientIds.length) return;
  const database = await getDb();
  for (const id of clientIds) {
    await database.runAsync(
      "UPDATE sync_queue SET status = 'conflict', error = ? WHERE client_id = ?",
      error ?? 'Sync conflict',
      id,
    );
  }
}

export async function getFailedSyncItems() {
  const database = await getDb();
  return database.getAllAsync<{ client_id: string; entity_type: string; payload: string; error: string | null }>(
    "SELECT client_id, entity_type, payload, error FROM sync_queue WHERE status IN ('failed', 'conflict') ORDER BY id DESC",
  );
}

export async function saveLocalResponse(clientId: string, surveyId: string, householdClientId: string | null, payload: object) {
  const database = await getDb();
  await database.runAsync(
    'INSERT OR REPLACE INTO local_responses (client_id, survey_id, household_client_id, payload, synced) VALUES (?, ?, ?, ?, 0)',
    clientId,
    surveyId,
    householdClientId,
    JSON.stringify(payload),
  );
  await enqueueSync(clientId, 'response', payload);
}

export async function saveLocalHousehold(clientId: string, surveyId: string, payload: object) {
  const database = await getDb();
  await database.runAsync(
    'INSERT OR REPLACE INTO local_households (client_id, survey_id, head_name, payload, synced) VALUES (?, ?, ?, ?, 0)',
    clientId,
    surveyId,
    (payload as { headName?: string }).headName ?? 'Household',
    JSON.stringify(payload),
  );
}

export async function cacheSurveys(surveys: { id: string; name: string; nameTe?: string; type?: string; status?: string; payload: object }[]) {
  const database = await getDb();
  for (const s of surveys) {
    await database.runAsync(
      'INSERT OR REPLACE INTO local_surveys (id, name, name_te, type, status, payload) VALUES (?, ?, ?, ?, ?, ?)',
      s.id,
      s.name,
      s.nameTe ?? null,
      s.type ?? null,
      s.status ?? null,
      JSON.stringify(s.payload),
    );
  }
}

export async function getCachedSurveys() {
  const database = await getDb();
  const rows = await database.getAllAsync<{ id: string; name: string; name_te: string | null; payload: string }>(
    'SELECT id, name, name_te, payload FROM local_surveys',
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    nameTe: r.name_te,
    payload: JSON.parse(r.payload),
  }));
}

export async function getTodayCompletedCount() {
  const database = await getDb();
  const row = await database.getFirstAsync<{ c: number }>(
    "SELECT COUNT(*) as c FROM local_responses WHERE date(created_at) = date('now')",
  );
  return row?.c ?? 0;
}
