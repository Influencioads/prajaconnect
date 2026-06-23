import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getPendingSyncItems,
  markSynced,
  markFailed,
  markRetry,
  markConflict,
  getPendingSyncCount,
} from './db';
import { syncD2DBatch } from './d2d';
import { api } from './api';

const DEVICE_ID_KEY = 'praja_device_id';

type IngestResult = {
  id: string;
  entityType: string;
  status: string;
  error?: string;
};

export async function getDeviceId() {
  let id = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = `device-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export async function flushSyncQueue(): Promise<{
  synced: number;
  failed: number;
  conflicts: number;
  errors: string[];
}> {
  const state = await NetInfo.fetch();
  if (!state.isConnected) return { synced: 0, failed: 0, conflicts: 0, errors: ['Device is offline'] };

  const pending = await getPendingSyncItems();
  if (!pending.length) return { synced: 0, failed: 0, conflicts: 0, errors: [] };

  const deviceId = await getDeviceId();
  const households: Record<string, unknown>[] = [];
  const responses: Record<string, unknown>[] = [];
  const generalItems: Array<{ entityType: string; payload: Record<string, unknown> }> = [];
  const d2dClientIds: string[] = [];
  const generalClientIds: string[] = [];
  const errors: string[] = [];

  for (const item of pending) {
    const payload = JSON.parse(item.payload) as Record<string, unknown>;
    if (item.entity_type === 'household') {
      households.push({ ...payload, clientId: item.client_id });
      d2dClientIds.push(item.client_id);
    } else if (item.entity_type === 'response') {
      responses.push({ ...payload, clientId: item.client_id });
      d2dClientIds.push(item.client_id);
    } else {
      generalClientIds.push(item.client_id);
      generalItems.push({ entityType: item.entity_type, payload: { ...payload, clientId: item.client_id } });
    }
  }

  let synced = 0;
  let failed = 0;
  let conflicts = 0;

  if (households.length || responses.length) {
    try {
      await syncD2DBatch({ deviceId, households, responses });
      await markSynced(d2dClientIds);
      synced += d2dClientIds.length;
    } catch (e) {
      // Whole-batch failure is almost always transient (network) — schedule a retry.
      const msg = e instanceof Error ? e.message : 'D2D sync failed';
      errors.push(msg);
      await markRetry(d2dClientIds, msg);
      failed += d2dClientIds.length;
    }
  }

  if (generalItems.length) {
    try {
      const { data } = await api.post<{ results: IngestResult[] }>('/offline-sync/ingest', {
        deviceId,
        items: generalItems,
      });
      const results = data.results ?? [];
      const syncedIds: string[] = [];
      const failedIds: string[] = [];
      const conflictIds: string[] = [];

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const clientId = generalClientIds[i];
        if (!clientId) continue;
        if (result.status === 'Synced') {
          syncedIds.push(clientId);
        } else if (result.status === 'Conflict') {
          conflictIds.push(clientId);
          if (result.error) errors.push(result.error);
        } else {
          failedIds.push(clientId);
          if (result.error) errors.push(result.error);
        }
      }

      await markSynced(syncedIds);
      await markConflict(conflictIds);
      await markFailed(failedIds);
      synced += syncedIds.length;
      failed += failedIds.length;
      conflicts += conflictIds.length;
    } catch (e) {
      // Whole-request failure is transient (network) — schedule a retry rather than
      // permanently failing. Per-item server rejections below still use markFailed.
      const msg = e instanceof Error ? e.message : 'General sync failed';
      errors.push(msg);
      await markRetry(generalClientIds, msg);
      failed += generalClientIds.length;
    }
  }

  return { synced, failed, conflicts, errors };
}

export function startSyncListener(onUpdate?: (pending: number) => void) {
  const unsub = NetInfo.addEventListener(async (state) => {
    if (state.isConnected) {
      await flushSyncQueue();
    }
    if (onUpdate) onUpdate(await getPendingSyncCount());
  });
  return unsub;
}

export async function getSyncStatus() {
  const pending = await getPendingSyncCount();
  const state = await NetInfo.fetch();
  return { pending, online: !!state.isConnected };
}
