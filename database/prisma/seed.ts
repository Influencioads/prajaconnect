import {
  PrismaClient,
  UserRole,
  AccessLevel,
  OfficialLevel,
  CadreStatus,
  Gender,
  GrievanceChannel,
  GrievancePriority,
  GrievanceStatus,
  GrievanceSlaViolationType,
  GrievanceSlaViolationStatus,
  BeneficiaryStatus,
  SchemeStatus,
  ProjectStatus,
  EventType,
  EventStatus,
  SurveyStatus,
  NotificationType,
  WhatsAppDirection,
  WhatsAppStatus,
  CommitteeCategory,
  NetworkStatus,
  NetworkEntityType,
  JournalistType,
  ActivityType,
  ActivityStatus,
  ActivityDirection,
  ActivityPriority,
  CampaignType,
  CampaignStatus,
  ParticipantStatus,
  AssetCategory,
  D2DSurveyType,
  D2DSurveyStatus,
  D2DQuestionType,
  D2DSentiment,
  D2DPriority,
  D2DResponseStatus,
  TempGrievanceSource,
  TempGrievanceStatus,
  TempGrievancePriority,
  DuplicateRisk,
  ElectionStatus,
  ElectionExpenseStatus,
  PaymentMode,
  CampaignWorkType,
  CampaignWorkStatus,
  ElectionVehicleType,
  ElectionVehicleStatus,
  OutreachChannel,
  VoterStance,
  CampaignTeamType,
  ElectionMaterialType,
  BoothStrength,
  PollingDayStatus,
  ElectionWorkPriority,
  VoterPreference,
  VoterIntelligenceSource,
  VoterDuplicateStatus,
  AttendanceCorrectionStatus,
  MediaResponseStatus,
  PromiseWorkStatus,
  CrisisSeverity,
  CrisisIssueStatus,
  AppointmentStatus,
  OfflineSyncStatus,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}
function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}
function daysAhead(n: number): Date {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000);
}

// ============================================================
// Settings
// ============================================================
async function seedSettings() {
  const settings: [string, string, string][] = [
    ['app_name', 'Praja Connect CRM', 'general'],
    ['support_email', 'support@praja.in', 'general'],
    ['party', 'TDP', 'org'],
    ['state', 'Andhra Pradesh', 'org'],
    ['default_constituency', 'Mangalagiri', 'org'],
    // Branding (live theming + logo)
    ['party_full_name', 'Telugu Desam Party', 'branding'],
    ['primary_color', '#003366', 'branding'],
    ['secondary_color', '#FFD600', 'branding'],
    ['accent_color', '#FFD600', 'branding'],
    ['logo_url', '', 'branding'],
    // Localization
    ['default_language', 'en', 'localization'],
    ['timezone', 'Asia/Kolkata', 'localization'],
    ['date_format', 'DD/MM/YYYY', 'localization'],
    // Notification channels
    ['notify_sms', 'true', 'notifications'],
    ['notify_whatsapp', 'true', 'notifications'],
    ['notify_email', 'true', 'notifications'],
    // AI PR Management
    ['pr_response_sla_hours', '24', 'pr'],
    ['pr_leader_names', 'Chandrababu Naidu,Nara Lokesh', 'pr'],
    ['pr_party_keywords', 'TDP,Telugu Desam Party,Andhra Pradesh,Mangalagiri', 'pr'],
    ['pr_cron_enabled', 'true', 'pr'],
    // Grievance SLA
    ['temp_grievance_validation_sla_hours', '48', 'grievances'],
    ['grievance_sla_cron_enabled', 'true', 'grievances'],
  ];
  for (const [key, value, category] of settings) {
    await prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value, category } });
  }
}

// ============================================================
// Roles + permissions
// ============================================================
const MODULES = [
  ['dashboard', 'Dashboard'],
  ['cadre', 'Cadre'],
  ['committees', 'Committees & Network'],
  ['citizens', 'Citizens'],
  ['grievances', 'Grievances'],
  ['officials', 'Officials'],
  ['schemes', 'Schemes'],
  ['whatsapp', 'WhatsApp'],
  ['activities', 'Activities'],
  ['events', 'Events'],
  ['surveys', 'Surveys'],
  ['gis', 'GIS'],
  ['devprojects', 'Development Projects'],
  ['ai', 'AI Command'],
  ['reports', 'Reports'],
  ['notifications', 'Notifications'],
  ['assets', 'Assets'],
  ['d2d', 'D2D Survey'],
  ['tempgrievances', 'Temp Grievances'],
  ['election', 'Election Management'],
  ['admin', 'Admin'],
  ['voterintelligence', 'Voter Intelligence'],
  ['warroom', 'War Room'],
  ['attendance', 'Attendance & GPS'],
  ['fundraising', 'Fundraising'],
  ['compliance', 'Legal Compliance'],
  ['media', 'Media Monitoring'],
  ['manifesto', 'Manifesto Tracker'],
  ['crisis', 'Crisis Management'],
  ['documents', 'Documents'],
  ['callcenter', 'Call Center'],
  ['dataquality', 'Data Quality'],
  ['publicportal', 'Public Portal'],
  ['leaderoffice', 'Leader Office'],
  ['securityaudit', 'Security Audit'],
  ['offlinesync', 'Offline Sync'],
];

const ROLES: { name: UserRole; label: string; rank: number; description: string }[] = [
  { name: 'SuperAdmin', label: 'Super Admin', rank: 100, description: 'Full platform access' },
  { name: 'StateLeader', label: 'State Leader', rank: 90, description: 'State-wide oversight' },
  { name: 'DistrictLeader', label: 'District Leader', rank: 80, description: 'District oversight' },
  { name: 'ConstituencyIncharge', label: 'Constituency Incharge', rank: 70, description: 'Constituency operations' },
  { name: 'MandalCoordinator', label: 'Mandal Coordinator', rank: 60, description: 'Mandal coordination' },
  { name: 'BoothCoordinator', label: 'Booth Coordinator', rank: 50, description: 'Booth-level operations' },
  { name: 'GovernmentOfficial', label: 'Government Official', rank: 45, description: 'Departmental official' },
  { name: 'Volunteer', label: 'Volunteer', rank: 40, description: 'Field volunteer' },
  { name: 'Citizen', label: 'Citizen', rank: 10, description: 'Citizen self-service' },
];

function levelFor(role: UserRole, module: string): AccessLevel {
  if (role === 'SuperAdmin') return AccessLevel.full;
  const leaderFull = ['StateLeader', 'DistrictLeader', 'ConstituencyIncharge'];
  const coordinators = ['MandalCoordinator', 'BoothCoordinator'];
  if (leaderFull.includes(role)) {
    if (module === 'admin') return role === 'StateLeader' ? AccessLevel.edit : AccessLevel.view;
    return AccessLevel.full;
  }
  if (coordinators.includes(role)) {
    if (['cadre', 'committees', 'citizens', 'grievances', 'tempgrievances', 'events', 'surveys', 'activities', 'assets', 'd2d', 'election', 'voterintelligence', 'attendance', 'fundraising', 'callcenter', 'leaderoffice'].includes(module)) return AccessLevel.edit;
    if (['dashboard', 'schemes', 'officials', 'whatsapp', 'gis', 'devprojects', 'reports', 'notifications', 'ai', 'warroom', 'compliance', 'media', 'manifesto', 'crisis', 'documents', 'dataquality'].includes(module))
      return AccessLevel.view;
    return AccessLevel.none;
  }
  if (role === 'Volunteer') {
    if (['citizens', 'grievances', 'tempgrievances', 'activities', 'd2d', 'election', 'voterintelligence', 'attendance'].includes(module)) return AccessLevel.edit;
    if (['dashboard', 'cadre', 'committees', 'schemes', 'events', 'notifications', 'assets'].includes(module)) return AccessLevel.view;
    return AccessLevel.none;
  }
  if (role === 'GovernmentOfficial') {
    if (['grievances', 'tempgrievances'].includes(module)) return AccessLevel.edit;
    if (['dashboard', 'officials', 'schemes', 'devprojects', 'reports', 'notifications', 'activities', 'assets'].includes(module)) return AccessLevel.view;
    return AccessLevel.none;
  }
  if (['grievances', 'tempgrievances', 'schemes', 'notifications'].includes(module)) return AccessLevel.view;
  return AccessLevel.none;
}

async function seedRolesAndPermissions() {
  const permIds = new Map<string, string>();
  for (const [module, label] of MODULES) {
    const p = await prisma.permission.upsert({
      where: { module },
      update: { label },
      create: { module, label },
    });
    permIds.set(module, p.id);
  }
  const roleIds = new Map<UserRole, string>();
  for (const r of ROLES) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: { label: r.label, rank: r.rank, description: r.description, isSystem: true },
      create: { name: r.name, label: r.label, rank: r.rank, description: r.description, isSystem: true },
    });
    roleIds.set(r.name, role.id);
    for (const [module] of MODULES) {
      const accessLevel = levelFor(r.name, module);
      const permissionId = permIds.get(module)!;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId } },
        update: { accessLevel },
        create: { roleId: role.id, permissionId, accessLevel },
      });
    }
  }
  return roleIds;
}

// ============================================================
// Geography (Mangalagiri, Guntur, AP)
// ============================================================
async function seedGeo() {
  const state = await prisma.state.upsert({
    where: { code: 'AP' },
    update: {},
    create: { name: 'Andhra Pradesh', code: 'AP' },
  });
  const district = await prisma.district.upsert({
    where: { code: 'GNT' },
    update: {},
    create: { name: 'Guntur', code: 'GNT', stateId: state.id },
  });

  let constituency = await prisma.constituency.findFirst({ where: { name: 'Mangalagiri' } });
  if (!constituency) {
    constituency = await prisma.constituency.create({
      data: { name: 'Mangalagiri', number: 92, type: 'Assembly', districtId: district.id },
    });
  }

  const mandalNames = ['Mangalagiri', 'Tadepalli', 'Duggirala'];
  const mandals = [];
  for (const name of mandalNames) {
    let m = await prisma.mandal.findFirst({ where: { name, constituencyId: constituency.id } });
    if (!m) m = await prisma.mandal.create({ data: { name, constituencyId: constituency.id } });
    mandals.push(m);
  }

  const villages = [];
  const villageData: [string, string, number][] = [
    ['Mangalagiri Town', mandals[0].id, 522503],
    ['Atmakur', mandals[0].id, 522503],
    ['Nidamarru', mandals[0].id, 522503],
    ['Tadepalli', mandals[1].id, 522501],
    ['Undavalli', mandals[1].id, 522501],
    ['Penumaka', mandals[1].id, 522501],
    ['Duggirala', mandals[2].id, 522330],
    ['Kollipara', mandals[2].id, 522304],
  ];
  for (const [name, mandalId, pincode] of villageData) {
    let v = await prisma.village.findFirst({ where: { name, mandalId } });
    if (!v) v = await prisma.village.create({ data: { name, mandalId, pincode: String(pincode) } });
    villages.push(v);
  }

  const booths = [];
  if ((await prisma.booth.count()) === 0) {
    let boothNo = 1;
    for (const v of villages) {
      for (let i = 0; i < 3; i++) {
        const b = await prisma.booth.create({
          data: {
            number: String(boothNo).padStart(3, '0'),
            name: `${v.name} Booth ${i + 1}`,
            voterCount: 800 + ((boothNo * 37) % 600),
            villageId: v.id,
          },
        });
        booths.push(b);
        boothNo++;
      }
    }
  } else {
    booths.push(...(await prisma.booth.findMany()));
  }

  return { state, district, constituency, mandals, villages, booths };
}

// ============================================================
// Users
// ============================================================
async function seedUsers(roleIds: Map<UserRole, string>, geo: Awaited<ReturnType<typeof seedGeo>>) {
  const passwordHash = await bcrypt.hash('Praja@123', 10);
  const demo: {
    name: string;
    email: string;
    mobile: string;
    role: UserRole;
    designation: string;
    constituencyId?: string;
    mandalId?: string;
  }[] = [
    { name: 'System Administrator', email: 'admin@praja.in', mobile: '9000000001', role: 'SuperAdmin', designation: 'Platform Admin' },
    { name: 'Naidu Garu', email: 'state@praja.in', mobile: '9000000002', role: 'StateLeader', designation: 'State President' },
    { name: 'Ravi Kumar', email: 'district@praja.in', mobile: '9000000003', role: 'DistrictLeader', designation: 'Guntur District President' },
    { name: 'Lokesh Reddy', email: 'leader@praja.in', mobile: '9000000004', role: 'ConstituencyIncharge', designation: 'Mangalagiri MLA', constituencyId: geo.constituency.id },
    { name: 'Suresh Babu', email: 'mandal@praja.in', mobile: '9000000005', role: 'MandalCoordinator', designation: 'Mandal Coordinator', constituencyId: geo.constituency.id, mandalId: geo.mandals[0].id },
    { name: 'Anil Teja', email: 'booth@praja.in', mobile: '9000000006', role: 'BoothCoordinator', designation: 'Booth Coordinator', constituencyId: geo.constituency.id, mandalId: geo.mandals[0].id },
    { name: 'Lakshmi Devi', email: 'volunteer@praja.in', mobile: '9000000007', role: 'Volunteer', designation: 'Field Volunteer', constituencyId: geo.constituency.id, mandalId: geo.mandals[0].id },
    { name: 'Tahsildar Rao', email: 'official@praja.in', mobile: '9000000008', role: 'GovernmentOfficial', designation: 'Revenue Officer' },
    { name: 'Citizen Demo', email: 'citizen@praja.in', mobile: '9000000009', role: 'Citizen', designation: 'Citizen' },
  ];
  for (const u of demo) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        mobile: u.mobile,
        designation: u.designation,
        roleId: roleIds.get(u.role)!,
        constituencyId: u.constituencyId ?? null,
        mandalId: u.mandalId ?? null,
      },
      create: {
        name: u.name,
        email: u.email,
        mobile: u.mobile,
        passwordHash,
        designation: u.designation,
        roleId: roleIds.get(u.role)!,
        constituencyId: u.constituencyId ?? null,
        mandalId: u.mandalId ?? null,
      },
    });
  }
}

// ============================================================
// Departments + officials
// ============================================================
async function seedDepartmentsAndOfficials() {
  const deptData: [string, string, number][] = [
    ['Revenue', 'Administration', 48],
    ['Municipal / Panchayat Raj', 'Civic', 72],
    ['Water & Sewerage', 'Civic', 48],
    ['Electricity (APEPDCL)', 'Utilities', 24],
    ['Roads & Buildings', 'Infrastructure', 120],
    ['Health & Medical', 'Welfare', 24],
    ['Education', 'Welfare', 96],
    ['Police', 'Law & Order', 12],
  ];
  const depts = new Map<string, string>();
  for (const [name, category, slaHours] of deptData) {
    const d = await prisma.department.upsert({
      where: { name },
      update: { category, slaHours },
      create: { name, category, slaHours },
    });
    depts.set(name, d.id);
  }

  if ((await prisma.governmentOfficial.count()) === 0) {
    const officials: {
      name: string;
      designation: string;
      level: OfficialLevel;
      dept: string;
      mobile: string;
      escalationOrder: number;
    }[] = [
      { name: 'K. Srinivasa Rao', designation: 'Tahsildar', level: 'Mandal', dept: 'Revenue', mobile: '9876500001', escalationOrder: 1 },
      { name: 'P. Anand', designation: 'RDO', level: 'Constituency', dept: 'Revenue', mobile: '9876500002', escalationOrder: 2 },
      { name: 'M. Lakshmi', designation: 'Municipal Commissioner', level: 'Constituency', dept: 'Municipal / Panchayat Raj', mobile: '9876500003', escalationOrder: 1 },
      { name: 'S. Reddy', designation: 'AE Water Works', level: 'Mandal', dept: 'Water & Sewerage', mobile: '9876500004', escalationOrder: 1 },
      { name: 'T. Kumar', designation: 'Assistant Engineer', level: 'Mandal', dept: 'Electricity (APEPDCL)', mobile: '9876500005', escalationOrder: 1 },
      { name: 'V. Prasad', designation: 'DE Electricity', level: 'District', dept: 'Electricity (APEPDCL)', mobile: '9876500006', escalationOrder: 2 },
      { name: 'R. Naidu', designation: 'EE Roads & Buildings', level: 'District', dept: 'Roads & Buildings', mobile: '9876500007', escalationOrder: 1 },
      { name: 'Dr. G. Sita', designation: 'Medical Officer', level: 'Mandal', dept: 'Health & Medical', mobile: '9876500008', escalationOrder: 1 },
      { name: 'B. Ramesh', designation: 'MEO', level: 'Mandal', dept: 'Education', mobile: '9876500009', escalationOrder: 1 },
      { name: 'CI Mangalagiri', designation: 'Circle Inspector', level: 'Constituency', dept: 'Police', mobile: '9876500010', escalationOrder: 1 },
    ];
    for (const o of officials) {
      await prisma.governmentOfficial.create({
        data: {
          name: o.name,
          designation: o.designation,
          level: o.level,
          mobile: o.mobile,
          escalationOrder: o.escalationOrder,
          office: 'Mangalagiri',
          jurisdiction: 'Mangalagiri Constituency',
          departmentId: depts.get(o.dept)!,
        },
      });
    }
  }
  return depts;
}

// ============================================================
// Cadre hierarchy
// ============================================================
async function seedCadres(geo: Awaited<ReturnType<typeof seedGeo>>) {
  if ((await prisma.cadre.count()) > 0) return;

  const incharge = await prisma.cadre.create({
    data: {
      name: 'Lokesh Reddy', mobile: '9000000004', designation: 'Constituency Incharge',
      level: 'Constituency', status: 'Active', performance: 95,
      constituencyId: geo.constituency.id,
    },
  });

  const mandalNames = ['Mangalagiri', 'Tadepalli', 'Duggirala'];
  for (let mi = 0; mi < geo.mandals.length; mi++) {
    const mandal = geo.mandals[mi];
    const coord = await prisma.cadre.create({
      data: {
        name: `${pick(['Suresh', 'Ramana', 'Venkat'], mi)} ${pick(['Babu', 'Rao', 'Naidu'], mi)}`,
        mobile: `90000100${mi}0`,
        designation: `${mandalNames[mi]} Mandal Coordinator`,
        level: 'Mandal', status: 'Active', performance: 80 + mi * 3,
        constituencyId: geo.constituency.id, mandalId: mandal.id, parentId: incharge.id,
      },
    });

    const mandalBooths = geo.booths.filter((b) =>
      geo.villages.filter((v) => v.mandalId === mandal.id).some((v) => v.id === b.villageId),
    );
    for (let bi = 0; bi < Math.min(4, mandalBooths.length); bi++) {
      const booth = mandalBooths[bi];
      await prisma.cadre.create({
        data: {
          name: `${pick(['Anil', 'Kiran', 'Mahesh', 'Naveen', 'Praveen'], mi * 4 + bi)} ${pick(['Kumar', 'Teja', 'Varma'], bi)}`,
          mobile: `9000020${mi}${bi}0`,
          designation: 'Booth Coordinator',
          level: 'Booth',
          status: pick<CadreStatus>(['Active', 'Active', 'OnLeave'], bi),
          performance: 60 + ((mi * 4 + bi) * 7) % 35,
          constituencyId: geo.constituency.id, mandalId: mandal.id, boothId: booth.id, parentId: coord.id,
        },
      });
    }
  }
}

// ============================================================
// Citizens + families
// ============================================================
const FIRST = ['Ramesh', 'Suresh', 'Lakshmi', 'Padma', 'Venkata', 'Sita', 'Anjali', 'Ravi', 'Krishna', 'Sai', 'Bhavani', 'Naga', 'Srinivas', 'Devi', 'Mohan', 'Geetha'];
const LAST = ['Reddy', 'Naidu', 'Rao', 'Sharma', 'Chowdary', 'Varma', 'Prasad', 'Kumar'];

async function seedCitizens(geo: Awaited<ReturnType<typeof seedGeo>>) {
  if ((await prisma.citizen.count()) > 0) return;

  let n = 0;
  for (const village of geo.villages) {
    const villageBooths = geo.booths.filter((b) => b.villageId === village.id);
    const mandalId = village.mandalId;
    for (let f = 0; f < 4; f++) {
      const booth = pick(villageBooths, f);
      const headLast = pick(LAST, n);
      const family = await prisma.family.create({
        data: {
          headName: `${pick(FIRST, n)} ${headLast}`,
          address: `${f + 1}-${10 + f}, ${village.name}`,
          rationCard: `AP${(100000 + n).toString()}`,
          villageId: village.id,
          boothId: booth.id,
        },
      });

      const members = 2 + (n % 3);
      for (let m = 0; m < members; m++) {
        const gender = pick<Gender>(['Male', 'Female', 'Male'], n + m);
        const age = 18 + ((n * 7 + m * 11) % 60);
        await prisma.citizen.create({
          data: {
            name: `${pick(FIRST, n + m + 3)} ${headLast}`,
            mobile: `98${String(76000000 + n * 13 + m).slice(0, 8)}`,
            gender,
            age,
            voterId: `MGL${(1000000 + n * 17 + m).toString()}`,
            occupation: pick(['Farmer', 'Daily Wage', 'Teacher', 'Shopkeeper', 'Student', 'Govt Employee', 'Homemaker'], n + m),
            category: pick(['OC', 'BC', 'SC', 'ST', 'Minority'], n + m),
            address: family.address,
            isFamilyHead: m === 0,
            familyId: family.id,
            villageId: village.id,
            boothId: booth.id,
            mandalId,
            constituencyId: geo.constituency.id,
          },
        });
      }
      n++;
    }
  }
}

// ============================================================
// Grievances
// ============================================================
async function seedGrievances(geo: Awaited<ReturnType<typeof seedGeo>>, depts: Map<string, string>) {
  if ((await prisma.grievance.count()) > 0) return;

  const citizens = await prisma.citizen.findMany({ take: 40 });
  const officials = await prisma.governmentOfficial.findMany();
  const cadres = await prisma.cadre.findMany({ where: { level: 'Booth' } });

  const templates: { title: string; cat: string; dept: string; desc: string }[] = [
    { title: 'Street light not working', cat: 'Civic', dept: 'Electricity (APEPDCL)', desc: 'Street lights have been off for a week causing safety concerns.' },
    { title: 'Drinking water shortage', cat: 'Water', dept: 'Water & Sewerage', desc: 'Irregular water supply in our colony for the past 10 days.' },
    { title: 'Pothole on main road', cat: 'Roads', dept: 'Roads & Buildings', desc: 'Large potholes causing accidents near the village center.' },
    { title: 'Ration card correction', cat: 'Revenue', dept: 'Revenue', desc: 'Name spelling incorrect on ration card, needs correction.' },
    { title: 'Garbage not collected', cat: 'Sanitation', dept: 'Municipal / Panchayat Raj', desc: 'Garbage piling up, no collection since last week.' },
    { title: 'Power fluctuation', cat: 'Electricity', dept: 'Electricity (APEPDCL)', desc: 'Frequent voltage fluctuations damaging appliances.' },
    { title: 'School building repair', cat: 'Education', dept: 'Education', desc: 'Government school roof leaking during rains.' },
    { title: 'PHC medicine shortage', cat: 'Health', dept: 'Health & Medical', desc: 'Primary health center out of essential medicines.' },
  ];
  const statuses: GrievanceStatus[] = ['Open', 'Assigned', 'InProgress', 'Escalated', 'Resolved', 'Closed'];
  const priorities: GrievancePriority[] = ['High', 'Medium', 'Low'];
  const channels: GrievanceChannel[] = ['WhatsApp', 'Voice', 'Field', 'Web', 'Mobile'];

  for (let i = 0; i < 60; i++) {
    const t = pick(templates, i);
    const citizen = pick(citizens, i);
    const status = pick(statuses, i);
    const createdAt = daysAgo((i * 3) % 45);
    const deptId = depts.get(t.dept)!;
    const official = officials.find((o) => o.departmentId === deptId) ?? pick(officials, i);
    const assigned = status !== 'Open';
    const resolved = status === 'Resolved' || status === 'Closed';

    const g = await prisma.grievance.create({
      data: {
        code: `GRV-${(1000 + i).toString()}`,
        title: t.title,
        description: t.desc,
        category: t.cat,
        channel: pick(channels, i),
        priority: pick(priorities, i),
        status,
        citizenId: citizen.id,
        reportedByName: citizen.name,
        reportedByMobile: citizen.mobile,
        departmentId: deptId,
        assignedOfficialId: assigned ? official?.id : null,
        assignedCadreId: assigned ? pick(cadres, i)?.id : null,
        villageId: citizen.villageId,
        mandalId: citizen.mandalId,
        constituencyId: geo.constituency.id,
        address: citizen.address,
        latitude: 16.43 + (i % 10) * 0.01,
        longitude: 80.55 + (i % 10) * 0.01,
        slaDueAt: resolved
          ? daysAhead(3)
          : i % 5 === 0
            ? daysAgo(2 + (i % 5))
            : daysAhead(3 - (i % 5)),
        resolvedAt: resolved ? daysAgo((i * 3) % 45 - 2 < 0 ? 1 : (i * 3) % 45 - 2) : null,
        satisfactionRating: resolved ? 3 + (i % 3) : null,
        feedback: resolved ? pick(['Issue resolved promptly', 'Satisfied with response', 'Took time but resolved'], i) : null,
        createdAt,
        updates: {
          create: [
            { action: 'Created', toStatus: 'Open', note: 'Grievance registered', byName: citizen.name, createdAt },
            ...(assigned
              ? [{ action: 'Assigned', fromStatus: 'Open' as GrievanceStatus, toStatus: 'Assigned' as GrievanceStatus, note: `Assigned to ${official?.name ?? 'official'}`, byName: 'Coordinator', createdAt: daysAgo(((i * 3) % 45) - 1 < 0 ? 0 : ((i * 3) % 45) - 1) }]
              : []),
            ...(resolved
              ? [{ action: 'Resolved', fromStatus: 'InProgress' as GrievanceStatus, toStatus: 'Resolved' as GrievanceStatus, note: 'Issue addressed and verified', byName: official?.name ?? 'Official', createdAt: daysAgo(1) }]
              : []),
          ],
        },
      },
    });
    void g;
  }
}

async function seedTemporaryGrievances() {
  if ((await prisma.temporaryGrievance.count()) > 0) return;

  const citizens = await prisma.citizen.findMany({ take: 20 });
  const users = await prisma.user.findMany({ take: 5 });
  const volunteer = users.find((u) => u.email === 'volunteer@praja.in') ?? users[0];
  const coordinator = users.find((u) => u.email === 'coordinator@praja.in') ?? users[1];

  const sources: TempGrievanceSource[] = [
    'Call', 'WhatsApp', 'D2DSurvey', 'Email', 'SMS', 'FieldVisit', 'CampaignCall', 'Manual',
  ];
  const statuses: TempGrievanceStatus[] = [
    'New', 'PendingValidation', 'MoreInfoRequired', 'Validated', 'Converted', 'Duplicate', 'Rejected', 'Archived',
  ];
  const priorities: TempGrievancePriority[] = ['Low', 'Medium', 'High', 'Critical'];
  const issues = [
    { cat: 'Water', summary: 'No drinking water supply', desc: 'Water tanker not coming for 5 days in our street.' },
    { cat: 'Roads', summary: 'Potholes on village road', desc: 'Main road has deep potholes causing accidents.' },
    { cat: 'Electricity', summary: 'Power outage', desc: 'Frequent power cuts without notice.' },
    { cat: 'Sanitation', summary: 'Garbage not collected', desc: 'Garbage piling up near school.' },
    { cat: 'Health', summary: 'PHC medicine shortage', desc: 'No medicines at primary health center.' },
  ];

  for (let i = 0; i < 20; i++) {
    const citizen = pick(citizens, i);
    const issue = pick(issues, i);
    const status = pick(statuses, i);
    const source = pick(sources, i);
    const priority = pick(priorities, i);
    const riskScore = i % 4 === 0 ? 75 : i % 3 === 0 ? 45 : 10;
    const risk: DuplicateRisk = riskScore >= 70 ? 'High' : riskScore >= 40 ? 'Medium' : 'Low';

    await prisma.temporaryGrievance.create({
      data: {
        tempTicketId: `TMP-${1001 + i}`,
        source,
        sourceReferenceId: `ref-${i}`,
        citizenId: citizen.id,
        citizenName: citizen.name,
        mobileNumber: citizen.mobile,
        mandalId: citizen.mandalId,
        villageId: citizen.villageId,
        boothId: citizen.boothId,
        issueCategory: issue.cat,
        issueSummary: issue.summary,
        issueDescription: issue.desc,
        originalMessage: `Citizen reported: ${issue.desc}`,
        priority,
        validationStatus: status,
        validationDueAt: ['New', 'PendingValidation', 'MoreInfoRequired'].includes(status)
          ? i % 4 === 0
            ? daysAgo(3 + (i % 3))
            : daysAhead(1)
          : null,
        duplicateRiskScore: riskScore,
        duplicateRisk: risk,
        assignedValidatorId: status === 'PendingValidation' || status === 'Validated' ? coordinator?.id : null,
        createdById: volunteer?.id,
        validationChecklist: {
          citizenNameConfirmed: i % 2 === 0,
          mobileConfirmed: i % 3 === 0,
          locationConfirmed: i % 4 === 0,
          categoryConfirmed: false,
          descriptionVerified: false,
          departmentIdentified: false,
          prioritySelected: true,
          duplicateChecked: i % 5 === 0,
          mediaReviewed: false,
          consentReceived: false,
        },
        validationLogs: {
          create: [
            {
              validationAction: 'Created',
              newStatus: 'New',
              remarks: `Auto-created from ${source}`,
              createdById: volunteer?.id,
            },
            ...(status !== 'New'
              ? [{
                  validationAction: 'StatusChange',
                  oldStatus: 'New' as TempGrievanceStatus,
                  newStatus: status,
                  remarks: 'Moved to validation queue',
                  createdById: coordinator?.id,
                }]
              : []),
          ],
        },
        notes: i % 3 === 0
          ? { create: [{ note: 'Follow up with citizen for exact location.', createdById: coordinator?.id }] }
          : undefined,
        createdAt: daysAgo(i % 14),
      },
    });
  }
}

// ============================================================
// Schemes + beneficiaries
// ============================================================
async function seedSchemes() {
  if ((await prisma.scheme.count()) > 0) return;
  const schemes: { name: string; code: string; cat: string; dept: string; amount: number; desc: string; eligibility: any }[] = [
    { name: 'Pension Kanuka', code: 'PENSION', cat: 'Social Security', dept: 'Welfare', amount: 3000, desc: 'Monthly pension for elderly, widows and disabled.', eligibility: { minAge: 60, incomeBelow: 120000 } },
    { name: 'Amma Vodi', code: 'AMMAVODI', cat: 'Education', dept: 'Education', amount: 15000, desc: 'Financial assistance to mothers for childrens education.', eligibility: { hasSchoolChild: true, incomeBelow: 120000 } },
    { name: 'Rythu Bharosa', code: 'RYTHU', cat: 'Agriculture', dept: 'Agriculture', amount: 13500, desc: 'Investment support for farmer families.', eligibility: { occupation: 'Farmer' } },
    { name: 'Aarogyasri', code: 'AAROGYA', cat: 'Health', dept: 'Health & Medical', amount: 500000, desc: 'Cashless health insurance coverage.', eligibility: { incomeBelow: 500000 } },
    { name: 'Housing Scheme', code: 'HOUSING', cat: 'Housing', dept: 'Housing', amount: 180000, desc: 'Pucca house construction assistance.', eligibility: { ownsHouse: false } },
  ];
  for (const s of schemes) {
    await prisma.scheme.create({
      data: {
        name: s.name, code: s.code, category: s.cat, department: s.dept,
        benefitAmount: s.amount, description: s.desc, eligibility: s.eligibility,
        status: SchemeStatus.Active, startDate: daysAgo(365),
      },
    });
  }

  const allSchemes = await prisma.scheme.findMany();
  const citizens = await prisma.citizen.findMany({ take: 50 });
  const statuses: BeneficiaryStatus[] = ['Enrolled', 'Pending', 'Rejected', 'Disbursed'];
  let bi = 0;
  for (const citizen of citizens) {
    const count = 1 + (bi % 2);
    for (let k = 0; k < count; k++) {
      const scheme = pick(allSchemes, bi + k);
      try {
        await prisma.beneficiary.create({
          data: {
            schemeId: scheme.id,
            citizenId: citizen.id,
            status: pick(statuses, bi + k),
            appliedAt: daysAgo((bi * 5) % 200),
            approvedAt: (bi + k) % 2 === 0 ? daysAgo((bi * 3) % 100) : null,
            disbursedAmount: (bi + k) % 4 === 3 ? scheme.benefitAmount : null,
            disbursedAt: (bi + k) % 4 === 3 ? daysAgo((bi * 2) % 60) : null,
          },
        });
      } catch {
        // unique (scheme, citizen) collision — skip
      }
    }
    bi++;
  }
}

// ============================================================
// Events + attendees
// ============================================================
async function seedEvents(geo: Awaited<ReturnType<typeof seedGeo>>) {
  if ((await prisma.event.count()) > 0) return;
  const organizers = await prisma.cadre.findMany({ where: { level: { in: ['Constituency', 'Mandal'] } } });
  const events: { title: string; type: EventType; status: EventStatus; days: number }[] = [
    { title: 'Public Grievance Camp - Mangalagiri', type: 'Camp', status: 'Scheduled', days: 5 },
    { title: 'Mega Membership Drive', type: 'Awareness', status: 'Scheduled', days: 12 },
    { title: 'Booth Committee Review Meeting', type: 'Meeting', status: 'Scheduled', days: 2 },
    { title: 'Rythu Bharosa Awareness Rally', type: 'Rally', status: 'Completed', days: -10 },
    { title: 'Health Check-up Camp - Tadepalli', type: 'Camp', status: 'Completed', days: -20 },
    { title: 'Women Self-Help Group Meeting', type: 'Meeting', status: 'Ongoing', days: 0 },
  ];
  const citizens = await prisma.citizen.findMany({ take: 30 });
  let idx = 0;
  for (const e of events) {
    const start = e.days >= 0 ? daysAhead(e.days) : daysAgo(-e.days);
    const ev = await prisma.event.create({
      data: {
        title: e.title,
        type: e.type,
        status: e.status,
        description: `${e.title} organized for the constituency.`,
        startAt: start,
        endAt: new Date(start.getTime() + 4 * 60 * 60 * 1000),
        venue: pick(['Community Hall', 'Party Office', 'Town Center', 'School Ground'], idx),
        mandalId: pick(geo.mandals, idx).id,
        constituencyId: geo.constituency.id,
        organizerId: pick(organizers, idx)?.id,
        expectedAttendees: 100 + idx * 50,
        qrToken: `EVT-${(1000 + idx).toString()}`,
      },
    });
    if (e.status === 'Completed') {
      for (let a = 0; a < 8; a++) {
        const c = pick(citizens, idx * 8 + a);
        await prisma.eventAttendee.create({
          data: {
            eventId: ev.id,
            citizenId: c.id,
            name: c.name,
            mobile: c.mobile,
            checkedInAt: start,
            method: pick(['QR', 'Manual'], a),
          },
        });
      }
    }
    idx++;
  }
}

// ============================================================
// Surveys
// ============================================================
async function seedSurveys() {
  if ((await prisma.survey.count()) > 0) return;
  const survey = await prisma.survey.create({
    data: {
      title: 'Constituency Development Priorities 2026',
      description: 'Help us understand the top priorities for development funds.',
      status: SurveyStatus.Active,
      startAt: daysAgo(10),
      endAt: daysAhead(20),
      questions: [
        { id: 'q1', type: 'single', text: 'Top priority for your area?', options: ['Roads', 'Water', 'Healthcare', 'Education', 'Employment'] },
        { id: 'q2', type: 'rating', text: 'Rate current civic services (1-5)' },
        { id: 'q3', type: 'text', text: 'Any specific suggestion?' },
      ],
    },
  });
  const citizens = await prisma.citizen.findMany({ take: 25 });
  let i = 0;
  for (const c of citizens) {
    await prisma.surveyResponse.create({
      data: {
        surveyId: survey.id,
        citizenId: c.id,
        respondentName: c.name,
        respondentMobile: c.mobile,
        answers: {
          q1: pick(['Roads', 'Water', 'Healthcare', 'Education', 'Employment'], i),
          q2: 1 + (i % 5),
          q3: pick(['More street lights', 'Better drainage', 'Bus frequency', ''], i),
        },
      },
    });
    i++;
  }

  await prisma.survey.create({
    data: {
      title: 'Volunteer Feedback - Field Operations',
      description: 'Internal survey for booth-level volunteers.',
      status: SurveyStatus.Draft,
      questions: [{ id: 'q1', type: 'text', text: 'Challenges faced in the field?' }],
    },
  });
}

// ============================================================
// Development projects
// ============================================================
async function seedProjects(geo: Awaited<ReturnType<typeof seedGeo>>, depts: Map<string, string>) {
  if ((await prisma.developmentProject.count()) > 0) return;
  const projects: { name: string; cat: string; dept: string; status: ProjectStatus; budget: number; spent: number; progress: number }[] = [
    { name: 'CC Roads - Atmakur Village', cat: 'Roads', dept: 'Roads & Buildings', status: 'InProgress', budget: 4500000, spent: 2700000, progress: 60 },
    { name: 'Overhead Water Tank - Tadepalli', cat: 'Water', dept: 'Water & Sewerage', status: 'Planning', budget: 8000000, spent: 500000, progress: 10 },
    { name: 'PHC Upgradation - Mangalagiri', cat: 'Health', dept: 'Health & Medical', status: 'InProgress', budget: 12000000, spent: 7000000, progress: 55 },
    { name: 'School Building - Duggirala', cat: 'Education', dept: 'Education', status: 'Completed', budget: 6000000, spent: 5900000, progress: 100 },
    { name: 'Drainage System - Undavalli', cat: 'Sanitation', dept: 'Municipal / Panchayat Raj', status: 'Delayed', budget: 3500000, spent: 1200000, progress: 35 },
    { name: 'Street Lighting - Penumaka', cat: 'Electricity', dept: 'Electricity (APEPDCL)', status: 'InProgress', budget: 1500000, spent: 900000, progress: 65 },
  ];
  let i = 0;
  for (const p of projects) {
    await prisma.developmentProject.create({
      data: {
        name: p.name, category: p.cat, status: p.status,
        budget: p.budget, spent: p.spent, progressPct: p.progress,
        description: `${p.name} under ${p.dept}.`,
        startDate: daysAgo(120 - i * 10),
        expectedEndDate: daysAhead(60 - i * 5),
        completedAt: p.status === 'Completed' ? daysAgo(15) : null,
        contractor: pick(['SVR Constructions', 'Sai Infra', 'AP Build Co', 'Krishna Works'], i),
        mandalId: pick(geo.mandals, i).id,
        constituencyId: geo.constituency.id,
        departmentId: depts.get(p.dept) ?? null,
      },
    });
    i++;
  }
}

// ============================================================
// WhatsApp conversations
// ============================================================
async function seedWhatsApp() {
  if ((await prisma.whatsappConversation.count()) > 0) return;
  const citizens = await prisma.citizen.findMany({ take: 12 });
  let i = 0;
  for (const c of citizens) {
    const conv = await prisma.whatsappConversation.create({
      data: {
        contactName: c.name,
        contactMobile: c.mobile ?? `9000${i}00000`,
        citizenId: c.id,
        unreadCount: i % 3,
        lastMessageAt: daysAgo(i % 7),
        status: 'open',
      },
    });
    await prisma.whatsappMessage.createMany({
      data: [
        { conversationId: conv.id, direction: WhatsAppDirection.Inbound, body: pick(['Namaste, I need help with my pension.', 'Water problem in our street.', 'When is the next camp?'], i), status: WhatsAppStatus.Delivered, createdAt: daysAgo(i % 7) },
        { conversationId: conv.id, direction: WhatsAppDirection.Outbound, body: 'Thank you for reaching out. Our team will assist you shortly.', status: WhatsAppStatus.Read, createdAt: daysAgo(i % 7) },
      ],
    });
    i++;
  }
}

// ============================================================
// Notifications
// ============================================================
async function seedNotifications() {
  if ((await prisma.notification.count()) > 0) return;
  const leader = await prisma.user.findUnique({ where: { email: 'leader@praja.in' } });
  const items: { type: NotificationType; title: string; body: string }[] = [
    { type: 'Alert', title: 'High priority grievances rising', body: '5 new high-priority grievances in the last 24 hours.' },
    { type: 'Info', title: 'Survey reaching target', body: 'Development Priorities survey crossed 25 responses.' },
    { type: 'Warning', title: 'SLA breach risk', body: '3 grievances approaching SLA deadline.' },
    { type: 'Success', title: 'Project completed', body: 'School Building - Duggirala marked complete.' },
  ];
  for (const it of items) {
    await prisma.notification.create({
      data: { userId: leader?.id ?? null, type: it.type, title: it.title, body: it.body },
    });
  }
}

// ============================================================
// Committees & Network
// ============================================================
async function seedCommittees(geo: Awaited<ReturnType<typeof seedGeo>>) {
  if ((await prisma.committeeMember.count()) > 0) return;

  const admin = await prisma.user.findUnique({ where: { email: 'admin@praja.in' } });
  const reportingCadre = await prisma.cadre.findFirst({ where: { level: 'Constituency' } });

  const categories: CommitteeCategory[] = [
    'MandalCommittee',
    'VillageCommittee',
    'CoordinationCommittee',
    'MandalCoordinationCommittee',
  ];

  // Committees per category + members
  let memberIdx = 0;
  const createdMemberIds: { id: string }[] = [];
  for (let ci = 0; ci < categories.length; ci++) {
    const category = categories[ci];
    const mandal = pick(geo.mandals, ci);
    const village = pick(geo.villages.filter((v) => v.mandalId === mandal.id), ci);
    const committee = await prisma.committee.create({
      data: {
        name: `${mandal.name} ${category.replace(/([A-Z])/g, ' $1').trim()}`,
        category,
        description: `${category} for ${mandal.name}`,
        status: 'Active',
        mandalId: mandal.id,
        villageId: village?.id ?? null,
      },
    });

    for (let mi = 0; mi < 4; mi++) {
      const gender = pick<Gender>(['Male', 'Female', 'Male'], memberIdx);
      const member = await prisma.committeeMember.create({
        data: {
          fullName: `${pick(FIRST, memberIdx)} ${pick(LAST, memberIdx)}`,
          mobile: `97${String(60000000 + memberIdx * 17).slice(0, 8)}`,
          whatsapp: `97${String(60000000 + memberIdx * 17).slice(0, 8)}`,
          email: `member${memberIdx}@praja.in`,
          gender,
          age: 28 + ((memberIdx * 5) % 40),
          designation: pick(['President', 'Vice President', 'Secretary', 'Member'], mi),
          categoryType: COMMITTEE_LABEL(category),
          category,
          committeeId: committee.id,
          committeeName: committee.name,
          committeeRole: pick(['President', 'Vice President', 'Secretary', 'Treasurer'], mi),
          partyPosition: pick(['Senior Leader', 'Active Member', 'Booth Incharge'], mi),
          joiningDate: daysAgo(100 + memberIdx * 7),
          attendanceCount: 5 + ((memberIdx * 3) % 20),
          taskCompletionScore: 50 + ((memberIdx * 7) % 50),
          volunteerStrength: 2 + (memberIdx % 8),
          boothResponsibility: `Booth ${String((memberIdx % 10) + 1).padStart(3, '0')}`,
          politicalInfluenceLevel: pick(['High', 'Medium', 'Low'], mi),
          publicReach: 500 + ((memberIdx * 137) % 5000),
          assignedArea: village?.name ?? mandal.name,
          wardNumber: String((memberIdx % 20) + 1),
          boothNumber: String((memberIdx % 10) + 1).padStart(3, '0'),
          address: `${mi + 1}-${20 + mi}, ${village?.name ?? mandal.name}`,
          status: pick<NetworkStatus>(['Active', 'Active', 'Inactive'], mi),
          notes: 'Seeded committee member.',
          mandalId: mandal.id,
          villageId: village?.id ?? null,
          reportingPersonId: reportingCadre?.id ?? null,
          createdById: admin?.id ?? null,
        },
      });
      createdMemberIds.push({ id: member.id });
      memberIdx++;
    }
  }

  // Observers
  for (let i = 0; i < 4; i++) {
    const mandal = pick(geo.mandals, i);
    await prisma.observer.create({
      data: {
        fullName: `${pick(FIRST, i + 2)} ${pick(LAST, i + 1)}`,
        mobile: `96${String(50000000 + i * 23).slice(0, 8)}`,
        whatsapp: `96${String(50000000 + i * 23).slice(0, 8)}`,
        email: `observer${i}@praja.in`,
        gender: pick<Gender>(['Male', 'Female'], i),
        age: 35 + i * 2,
        designation: 'Mandal Observer',
        observationArea: mandal.name,
        assignedMandals: geo.mandals.map((m) => m.name).slice(0, 2).join(', '),
        reportingFrequency: pick(['Daily', 'Weekly', 'Monthly'], i),
        performanceRemarks: pick(['Excellent', 'Good', 'Needs improvement'], i),
        issueEscalationCount: i * 2,
        politicalInfluenceLevel: pick(['High', 'Medium'], i),
        publicReach: 1000 + i * 500,
        assignedArea: mandal.name,
        status: pick<NetworkStatus>(['Active', 'Active', 'Inactive'], i),
        mandalId: mandal.id,
        reportingPersonId: reportingCadre?.id ?? null,
        createdById: admin?.id ?? null,
      },
    });
  }

  // IMP Leaders
  for (let i = 0; i < 4; i++) {
    const mandal = pick(geo.mandals, i);
    await prisma.impLeader.create({
      data: {
        fullName: `${pick(FIRST, i + 5)} ${pick(LAST, i + 3)}`,
        mobile: `95${String(40000000 + i * 29).slice(0, 8)}`,
        email: `impleader${i}@praja.in`,
        gender: pick<Gender>(['Male', 'Female'], i),
        age: 40 + i * 3,
        designation: 'Community Leader',
        influenceArea: pick(['Agriculture', 'Trade', 'Youth', 'Women SHG'], i),
        communityReach: 5000 + i * 2000,
        voterInfluenceScore: 60 + ((i * 11) % 40),
        keySupportGroups: pick(['Farmers Union', 'Traders Association', 'Youth Wing', 'SHG Federation'], i),
        priorityLevel: pick(['High', 'Medium', 'Low'], i),
        politicalInfluenceLevel: pick(['High', 'Medium'], i),
        publicReach: 8000 + i * 1500,
        assignedArea: mandal.name,
        status: pick<NetworkStatus>(['Active', 'Active', 'Inactive'], i),
        mandalId: mandal.id,
        reportingPersonId: reportingCadre?.id ?? null,
        createdById: admin?.id ?? null,
      },
    });
  }

  // Influencers
  const platforms = ['Instagram', 'YouTube', 'Facebook', 'X/Twitter'];
  for (let i = 0; i < 4; i++) {
    await prisma.influencer.create({
      data: {
        fullName: `${pick(FIRST, i + 7)} ${pick(LAST, i + 4)}`,
        mobile: `94${String(30000000 + i * 31).slice(0, 8)}`,
        email: `influencer${i}@praja.in`,
        gender: pick<Gender>(['Male', 'Female'], i),
        age: 22 + i * 2,
        designation: 'Social Media Influencer',
        platform: pick(platforms, i),
        instagramFollowers: 10000 + i * 25000,
        facebookFollowers: 8000 + i * 15000,
        youtubeSubscribers: 5000 + i * 40000,
        twitterFollowers: 3000 + i * 12000,
        engagementRate: 2.5 + i * 1.3,
        contentCategory: pick(['Politics', 'Lifestyle', 'News', 'Comedy'], i),
        politicalAlignment: pick(['Supportive', 'Neutral', 'Supportive'], i),
        collaborationStatus: pick(['Active', 'In Discussion', 'Pending'], i),
        politicalInfluenceLevel: pick(['High', 'Medium'], i),
        publicReach: 20000 + i * 30000,
        assignedArea: pick(geo.mandals, i).name,
        status: pick<NetworkStatus>(['Active', 'Active', 'Inactive'], i),
        mandalId: pick(geo.mandals, i).id,
        createdById: admin?.id ?? null,
      },
    });
  }

  // Press
  const jtypes: JournalistType[] = ['Print', 'TV', 'Digital', 'YouTube'];
  for (let i = 0; i < 4; i++) {
    await prisma.pressContact.create({
      data: {
        fullName: `${pick(FIRST, i + 9)} ${pick(LAST, i + 5)}`,
        mobile: `93${String(20000000 + i * 37).slice(0, 8)}`,
        email: `press${i}@praja.in`,
        gender: pick<Gender>(['Male', 'Female'], i),
        age: 30 + i * 4,
        designation: 'Journalist',
        mediaHouseName: pick(['Eenadu', 'Sakshi', 'TV9', 'NTV'], i),
        journalistType: pick(jtypes, i),
        beat: pick(['Politics', 'Civic', 'Crime', 'Development'], i),
        districtCoverage: 'Guntur',
        mandalCoverage: geo.mandals.map((m) => m.name).slice(0, 2).join(', '),
        pressId: `PRESS-${(1000 + i).toString()}`,
        relationshipStatus: pick(['Friendly', 'Neutral', 'Strong'], i),
        lastInteractionDate: daysAgo(i * 9),
        politicalInfluenceLevel: pick(['High', 'Medium'], i),
        publicReach: 50000 + i * 100000,
        assignedArea: pick(geo.mandals, i).name,
        status: pick<NetworkStatus>(['Active', 'Active', 'Inactive'], i),
        mandalId: pick(geo.mandals, i).id,
        createdById: admin?.id ?? null,
      },
    });
  }

  // Activity logs for committee members
  let li = 0;
  for (const m of createdMemberIds.slice(0, 8)) {
    await prisma.committeeActivityLog.create({
      data: {
        entityType: NetworkEntityType.CommitteeMember,
        entityId: m.id,
        action: pick(['Created', 'Attended Meeting', 'Task Completed', 'Status Updated'], li),
        note: pick(['Added to committee', 'Present in mandal review', 'Booth survey completed', 'Marked active'], li),
        byUserId: admin?.id ?? null,
        byName: admin?.name ?? 'System Administrator',
        createdAt: daysAgo(li * 3),
      },
    });
    li++;
  }
}

function COMMITTEE_LABEL(category: CommitteeCategory): string {
  return category.replace(/([A-Z])/g, ' $1').trim();
}

// ============================================================
// Activities (unified engagement engine)
// ============================================================
async function seedActivities(geo: Awaited<ReturnType<typeof seedGeo>>) {
  if ((await prisma.activity.count()) > 0) return;

  const users = await prisma.user.findMany({ select: { id: true, name: true } });
  const userByEmail = await prisma.user.findMany({ select: { id: true, name: true, email: true } });
  const leader = userByEmail.find((u) => u.email === 'leader@praja.in') ?? users[0];
  const volunteer = userByEmail.find((u) => u.email === 'volunteer@praja.in') ?? users[0];
  const mandalCoord = userByEmail.find((u) => u.email === 'mandal@praja.in') ?? users[0];
  const citizens = await prisma.citizen.findMany({ take: 40 });
  const cadres = await prisma.cadre.findMany({ take: 20 });
  const officials = await prisma.governmentOfficial.findMany({ take: 10 });
  const grievances = await prisma.grievance.findMany({ take: 20 });
  const events = await prisma.event.findMany({ take: 6 });
  const survey = await prisma.survey.findFirst({ where: { status: 'Active' } });

  // ---- Campaigns ----
  const callCampaign = await prisma.activityCampaign.create({
    data: {
      name: 'Voter Outreach Calling Drive',
      type: CampaignType.CampaignCall,
      status: CampaignStatus.Active,
      description: 'Volunteer calling drive to reach voters ahead of the membership push.',
      script: 'Namaste, I am calling on behalf of your local representative. Could you share your top concern?',
      startAt: daysAgo(7),
      targetCount: 200,
      reachedCount: 120,
      responseCount: 95,
      conversionCount: 60,
      budget: 50000,
      spent: 22000,
      constituencyId: geo.constituency.id,
      mandalId: geo.mandals[0].id,
    },
  });
  const smsCampaign = await prisma.activityCampaign.create({
    data: {
      name: 'Health Camp SMS Blast',
      type: CampaignType.SmsCampaign,
      status: CampaignStatus.Completed,
      description: 'SMS announcement for the upcoming free health camp.',
      startAt: daysAgo(20),
      endAt: daysAgo(18),
      targetCount: 1500,
      reachedCount: 1480,
      responseCount: 320,
      conversionCount: 210,
      budget: 15000,
      spent: 14200,
      constituencyId: geo.constituency.id,
    },
  });

  const callOutcomes = ['Connected', 'NoAnswer', 'Busy', 'Converted', 'CallbackRequested', 'NotInterested'];
  const directions: ActivityDirection[] = [
    ActivityDirection.Inbound,
    ActivityDirection.Outbound,
    ActivityDirection.Missed,
  ];

  let n = 0;
  const makeCode = () => `ACT-${1001 + n++}`;

  // ---- Calls ----
  for (let i = 0; i < 18; i++) {
    const citizen = pick(citizens, i);
    const dir = pick(directions, i);
    const completed = dir !== ActivityDirection.Missed;
    await prisma.activity.create({
      data: {
        code: makeCode(),
        type: ActivityType.Call,
        title: `Call with ${citizen.name}`,
        description: pick(['Discussed pending grievance', 'Welfare scheme query', 'Invited to upcoming camp', 'General feedback'], i),
        status: dir === ActivityDirection.Missed ? ActivityStatus.FollowUp : ActivityStatus.Completed,
        priority: pick([ActivityPriority.High, ActivityPriority.Medium, ActivityPriority.Low], i),
        direction: dir,
        outcome: completed ? pick(callOutcomes, i) : 'NoAnswer',
        durationSec: completed ? 60 + ((i * 47) % 600) : 0,
        startedAt: daysAgo(i % 14),
        completedAt: completed ? daysAgo(i % 14) : null,
        recordingUrl: completed ? `https://recordings.local/call-${1001 + i}.mp3` : null,
        contactName: citizen.name,
        contactMobile: citizen.mobile,
        citizenId: citizen.id,
        assignedToUserId: pick([leader.id, volunteer.id, mandalCoord.id], i),
        createdById: volunteer.id,
        mandalId: citizen.mandalId,
        constituencyId: geo.constituency.id,
        reminderAt: dir === ActivityDirection.Missed ? daysAhead(1) : null,
      },
    });
  }

  // ---- Campaign calls (linked to campaign) ----
  for (let i = 0; i < 12; i++) {
    const citizen = pick(citizens, i + 5);
    await prisma.activity.create({
      data: {
        code: makeCode(),
        type: ActivityType.CampaignCall,
        title: `Outreach call — ${citizen.name}`,
        status: ActivityStatus.Completed,
        priority: ActivityPriority.Medium,
        direction: ActivityDirection.Outbound,
        outcome: pick(['Converted', 'Interested', 'NotInterested', 'CallbackRequested'], i),
        durationSec: 90 + ((i * 33) % 300),
        startedAt: daysAgo(i % 7),
        completedAt: daysAgo(i % 7),
        contactName: citizen.name,
        contactMobile: citizen.mobile,
        citizenId: citizen.id,
        campaignId: callCampaign.id,
        assignedToUserId: volunteer.id,
        createdById: volunteer.id,
        mandalId: geo.mandals[0].id,
        constituencyId: geo.constituency.id,
      },
    });
  }

  // ---- Conference call + participants ----
  const conf = await prisma.activity.create({
    data: {
      code: makeCode(),
      type: ActivityType.ConferenceCall,
      title: 'Constituency Leadership Review Call',
      description: 'Monthly leadership sync on campaign readiness and grievances.',
      status: ActivityStatus.Completed,
      priority: ActivityPriority.High,
      scheduledAt: daysAgo(3),
      startedAt: daysAgo(3),
      durationSec: 3600,
      completedAt: daysAgo(3),
      recordingUrl: 'https://recordings.local/conf-leadership.mp3',
      assignedToUserId: leader.id,
      createdById: leader.id,
      constituencyId: geo.constituency.id,
    },
  });
  for (let i = 0; i < Math.min(5, cadres.length); i++) {
    await prisma.activityParticipant.create({
      data: {
        activityId: conf.id,
        cadreId: cadres[i].id,
        name: cadres[i].name,
        role: cadres[i].designation,
        status: pick([ParticipantStatus.Attended, ParticipantStatus.Attended, ParticipantStatus.Absent], i),
        joinedAt: daysAgo(3),
      },
    });
  }
  await prisma.activityNote.create({
    data: { activityId: conf.id, action: 'Note', note: 'Booth readiness at 78%. Follow up on 3 lagging mandals.', byName: leader.name, byUserId: leader.id },
  });

  // ---- Emails ----
  for (let i = 0; i < 6; i++) {
    await prisma.activity.create({
      data: {
        code: makeCode(),
        type: ActivityType.Email,
        title: pick(['Weekly constituency digest', 'Scheme rollout update', 'Press release draft', 'Volunteer onboarding'], i),
        status: ActivityStatus.Completed,
        direction: ActivityDirection.Outbound,
        completedAt: daysAgo(i * 2),
        metadata: { to: 'team@praja.in', subject: 'Update', openRate: 40 + (i * 7) % 50, clickRate: 5 + (i * 3) % 20 },
        assignedToUserId: leader.id,
        createdById: leader.id,
        constituencyId: geo.constituency.id,
      },
    });
  }

  // ---- Meetings / Visits ----
  for (let i = 0; i < 8; i++) {
    const upcoming = i % 2 === 0;
    await prisma.activity.create({
      data: {
        code: makeCode(),
        type: pick([ActivityType.Meeting, ActivityType.Visit, ActivityType.OfficialMeeting, ActivityType.FieldVisit], i),
        title: pick(['Village development review', 'Tahsildar meeting on land records', 'Booth committee visit', 'Ward inspection'], i),
        description: 'Field engagement and follow-up.',
        status: upcoming ? ActivityStatus.Scheduled : ActivityStatus.Completed,
        priority: pick([ActivityPriority.High, ActivityPriority.Medium], i),
        scheduledAt: upcoming ? daysAhead(i + 1) : daysAgo(i),
        completedAt: upcoming ? null : daysAgo(i),
        locationName: pick(['Mangalagiri Town', 'Tadepalli', 'Undavalli', 'Duggirala'], i),
        latitude: 16.43 + i * 0.01,
        longitude: 80.55 + i * 0.01,
        officialId: i % 3 === 0 && officials.length ? pick(officials, i).id : null,
        assignedToUserId: pick([leader.id, mandalCoord.id], i),
        createdById: leader.id,
        mandalId: pick(geo.mandals, i).id,
        constituencyId: geo.constituency.id,
        reminderAt: upcoming ? daysAhead(i) : null,
      },
    });
  }

  // ---- Tasks ----
  for (let i = 0; i < 10; i++) {
    const done = i % 3 === 0;
    await prisma.activity.create({
      data: {
        code: makeCode(),
        type: ActivityType.Task,
        title: pick(['Prepare booth strength report', 'Collect ration card list', 'Coordinate camp logistics', 'Follow up on water grievance', 'Update voter rolls'], i),
        status: done ? ActivityStatus.Completed : pick([ActivityStatus.Planned, ActivityStatus.InProgress], i),
        priority: pick([ActivityPriority.High, ActivityPriority.Medium, ActivityPriority.Low], i),
        dueAt: daysAhead((i % 7) - 2),
        completedAt: done ? daysAgo(1) : null,
        assignedToUserId: pick([volunteer.id, mandalCoord.id, leader.id], i),
        createdById: leader.id,
        mandalId: pick(geo.mandals, i).id,
        constituencyId: geo.constituency.id,
        reminderAt: done ? null : daysAhead((i % 5)),
      },
    });
  }

  // ---- Grievance follow-ups ----
  for (let i = 0; i < Math.min(6, grievances.length); i++) {
    const g = grievances[i];
    await prisma.activity.create({
      data: {
        code: makeCode(),
        type: ActivityType.GrievanceFollowup,
        title: `Follow-up: ${g.title}`,
        status: ActivityStatus.FollowUp,
        priority: ActivityPriority.High,
        grievanceId: g.id,
        citizenId: g.citizenId,
        assignedToUserId: volunteer.id,
        createdById: leader.id,
        dueAt: daysAhead(i % 4),
        mandalId: g.mandalId,
        constituencyId: geo.constituency.id,
      },
    });
  }

  // ---- Volunteer / Cadre / Booth / Door-to-door / Field ----
  const fieldTypes: ActivityType[] = [
    ActivityType.VolunteerActivity,
    ActivityType.CadreActivity,
    ActivityType.BoothActivity,
    ActivityType.DoorToDoor,
    ActivityType.FieldVisit,
  ];
  for (let i = 0; i < 12; i++) {
    await prisma.activity.create({
      data: {
        code: makeCode(),
        type: pick(fieldTypes, i),
        title: pick(['Door-to-door coverage — Ward 5', 'Booth strength meeting', 'Cadre attendance — morning shift', 'Volunteer survey collection', 'Village inspection'], i),
        status: pick([ActivityStatus.Completed, ActivityStatus.InProgress, ActivityStatus.Scheduled], i),
        priority: ActivityPriority.Medium,
        scheduledAt: daysAgo(i % 10),
        completedAt: i % 2 === 0 ? daysAgo(i % 10) : null,
        cadreId: cadres.length ? pick(cadres, i).id : null,
        assignedToUserId: volunteer.id,
        createdById: mandalCoord.id,
        locationName: pick(['Ward 5', 'Booth 012', 'Atmakur', 'Penumaka'], i),
        mandalId: pick(geo.mandals, i).id,
        constituencyId: geo.constituency.id,
        metadata: { housesCovered: 20 + (i * 5) % 60, feedbackPositive: 60 + (i * 3) % 35 },
      },
    });
  }

  // ---- Event / Survey / Social / Press / Influencer ----
  if (events.length) {
    await prisma.activity.create({
      data: {
        code: makeCode(),
        type: ActivityType.EventActivity,
        title: `Coordination — ${events[0].title}`,
        status: ActivityStatus.Scheduled,
        priority: ActivityPriority.High,
        eventId: events[0].id,
        scheduledAt: daysAhead(2),
        assignedToUserId: leader.id,
        createdById: leader.id,
        constituencyId: geo.constituency.id,
      },
    });
  }
  if (survey) {
    await prisma.activity.create({
      data: {
        code: makeCode(),
        type: ActivityType.SurveyActivity,
        title: `Survey collection — ${survey.title}`,
        status: ActivityStatus.InProgress,
        surveyId: survey.id,
        assignedToUserId: volunteer.id,
        createdById: leader.id,
        constituencyId: geo.constituency.id,
      },
    });
  }
  const miscTypes: { type: ActivityType; title: string }[] = [
    { type: ActivityType.SocialMedia, title: 'Facebook post — development update' },
    { type: ActivityType.PressInteraction, title: 'Press meet on new road project' },
    { type: ActivityType.InfluencerInteraction, title: 'Local influencer collaboration call' },
    { type: ActivityType.VoiceBroadcast, title: 'Voice broadcast — camp reminder' },
  ];
  for (let i = 0; i < miscTypes.length; i++) {
    await prisma.activity.create({
      data: {
        code: makeCode(),
        type: miscTypes[i].type,
        title: miscTypes[i].title,
        status: ActivityStatus.Completed,
        priority: ActivityPriority.Medium,
        completedAt: daysAgo(i + 1),
        campaignId: miscTypes[i].type === ActivityType.VoiceBroadcast ? smsCampaign.id : null,
        assignedToUserId: leader.id,
        createdById: leader.id,
        constituencyId: geo.constituency.id,
        metadata: { reach: 1000 + i * 500, engagement: 5 + i * 2 },
      },
    });
  }

  // ---- Reminders for assigned, not-yet-due follow-ups ----
  const reminderActivities = await prisma.activity.findMany({
    where: { reminderAt: { not: null } },
    select: { id: true, title: true, assignedToUserId: true, reminderAt: true },
    take: 30,
  });
  for (const a of reminderActivities) {
    await prisma.activityReminder.create({
      data: {
        activityId: a.id,
        remindAt: a.reminderAt!,
        note: `Follow-up: ${a.title}`,
        forUserId: a.assignedToUserId,
        sent: false,
      },
    });
  }
}

// ============================================================
// Assets
// ============================================================
let assetCodeSeq = 1;
function assetCode(prefix: string): string {
  return `${prefix}-${String(assetCodeSeq++).padStart(4, '0')}`;
}

async function seedAssets(geo: Awaited<ReturnType<typeof seedGeo>>) {
  if ((await prisma.asset.count()) > 0) return;
  const baseGeo = (i: number) => ({
    mandalId: pick(geo.mandals, i).id,
    villageId: pick(geo.villages, i).id,
    constituencyId: geo.constituency.id,
    latitude: 16.43 + (i % 5) * 0.01,
    longitude: 80.55 + (i % 5) * 0.01,
  });

  const roads = [
    { name: 'Main Bazaar Road', roadType: 'CC Road', lengthKm: 2.4, widthM: 7, condition: 'Good' as const, status: 'Active' as const },
    { name: 'Atmakur Approach Road', roadType: 'BT Road', lengthKm: 5.1, widthM: 6, condition: 'Fair' as const, status: 'Active' as const },
    { name: 'Nidamarru Village Road', roadType: 'Gravel', lengthKm: 1.8, widthM: 4, condition: 'Damaged' as const, status: 'UnderMaintenance' as const },
    { name: 'Riverside Link Road', roadType: 'CC Road', lengthKm: 3.3, widthM: 8, condition: 'Good' as const, status: 'UnderDevelopment' as const },
  ];
  for (let i = 0; i < roads.length; i++) {
    const r = roads[i];
    await prisma.asset.create({
      data: {
        category: 'Roads', name: r.name, code: assetCode('RD'), status: r.status, condition: r.condition,
        contractor: pick(['SVR Constructions', 'Sai Infra', 'AP Build Co'], i),
        ...baseGeo(i),
        road: { create: { roadType: r.roadType, lengthKm: r.lengthKm, widthM: r.widthM, lastRepairDate: daysAgo(60 + i * 30) } },
      },
    });
  }

  const hospitals = [
    { name: 'Government General Hospital', type: 'Government', docs: 24, beds: 200, amb: 4 },
    { name: 'Mangalagiri PHC', type: 'PHC', docs: 6, beds: 30, amb: 1 },
    { name: 'Tadepalli Community Health Centre', type: 'PHC', docs: 9, beds: 50, amb: 2 },
    { name: 'Sai Private Hospital', type: 'Private', docs: 14, beds: 80, amb: 2 },
  ];
  for (let i = 0; i < hospitals.length; i++) {
    const h = hospitals[i];
    await prisma.asset.create({
      data: {
        category: 'Hospitals', name: h.name, code: assetCode('HOS'), status: 'Active',
        ...baseGeo(i),
        hospital: { create: { hospitalType: h.type, doctorsCount: h.docs, bedsCount: h.beds, ambulances: h.amb, emergencyContact: '108', services: 'OPD, Emergency, Maternity' } },
      },
    });
  }

  const schools = [
    { name: 'ZP High School Mangalagiri', type: 'Government', students: 640, teachers: 22, meal: true, score: 78 },
    { name: 'MPP School Atmakur', type: 'Government', students: 210, teachers: 8, meal: true, score: 71 },
    { name: 'Vidya Niketan', type: 'Private', students: 520, teachers: 30, meal: false, score: 85 },
    { name: 'Govt Girls School Tadepalli', type: 'Government', students: 380, teachers: 15, meal: true, score: 74 },
  ];
  for (let i = 0; i < schools.length; i++) {
    const s = schools[i];
    await prisma.asset.create({
      data: {
        category: 'Schools', name: s.name, code: assetCode('SCH'), status: 'Active',
        ...baseGeo(i),
        school: { create: { schoolType: s.type, studentCount: s.students, teacherCount: s.teachers, midDayMeal: s.meal, performanceScore: s.score } },
      },
    });
  }

  const rws = [
    { name: 'Atmakur Borewell #3', type: 'Borewell', functional: true, dist: 'Normal' },
    { name: 'Tadepalli OHSR Tank', type: 'OHSR', functional: true, dist: 'Normal' },
    { name: 'Nidamarru Pipeline Network', type: 'Pipeline', functional: false, dist: 'Disrupted' },
    { name: 'Mangalagiri Water Plant', type: 'WaterPlant', functional: true, dist: 'Normal' },
  ];
  for (let i = 0; i < rws.length; i++) {
    const w = rws[i];
    await prisma.asset.create({
      data: {
        category: 'RwsAssets', name: w.name, code: assetCode('RWS'), status: w.functional ? 'Active' : 'UnderMaintenance',
        ...baseGeo(i),
        rws: { create: { assetType: w.type, functional: w.functional, distributionStatus: w.dist } },
      },
    });
  }

  // A few generic-engine categories (attributes JSON, no detail table).
  const generic: { category: AssetCategory; name: string; prefix: string; attributes: Record<string, unknown> }[] = [
    { category: 'ReligiousPlaces', name: 'Sri Lakshmi Narasimha Temple', prefix: 'REL', attributes: { type: 'Temple', trust: 'Devasthanam', priestContact: '9876500001' } },
    { category: 'DealerShops', name: 'FP Shop No. 12', prefix: 'DLR', attributes: { dealerName: 'Ramesh', licenseNo: 'FPS-12', beneficiaries: 420 } },
    { category: 'BurialGrounds', name: 'Atmakur Burial Ground', prefix: 'BUR', attributes: { landAreaAcres: 2.5, authority: 'Gram Panchayat' } },
    { category: 'Tanks', name: 'Peda Cheruvu Tank', prefix: 'TNK', attributes: { capacityMcft: 12.5, currentLevelPct: 60 } },
    { category: 'GreenAmbassadors', name: 'Green Brigade Mangalagiri', prefix: 'GRN', attributes: { volunteers: 35, treesPlanted: 1200 } },
    { category: 'GovernmentOffices', name: 'Mandal Revenue Office', prefix: 'OFC', attributes: { department: 'Revenue', officer: 'Tahsildar', footfallPerDay: 150 } },
    { category: 'DwcraGroups', name: 'Sakhi SHG Group', prefix: 'SHG', attributes: { members: 12, activeLoans: 3, totalLoanAmount: 450000 } },
    { category: 'Taxes', name: 'Property Tax - Ward 4', prefix: 'TAX', attributes: { taxType: 'Property', demand: 1850000, collected: 1320000 } },
  ];
  for (let i = 0; i < generic.length; i++) {
    const g = generic[i];
    await prisma.asset.create({
      data: {
        category: g.category, name: g.name, code: assetCode(g.prefix), status: 'Active',
        attributes: g.attributes as object,
        ...baseGeo(i),
      },
    });
  }

  // Maintenance logs for a couple of assets to populate timelines.
  const someAssets = await prisma.asset.findMany({ take: 4 });
  for (let i = 0; i < someAssets.length; i++) {
    await prisma.assetMaintenanceLog.create({
      data: {
        assetId: someAssets[i].id,
        type: pick(['Inspection', 'Repair', 'Cleaning'], i),
        note: 'Routine maintenance recorded during field visit.',
        status: 'Completed',
        cost: 5000 + i * 2500,
        performedBy: pick(['Field Team A', 'Field Team B'], i),
        performedAt: daysAgo(10 + i * 5),
      },
    });
  }
}

// ============================================================
// D2D Surveys
// ============================================================
async function seedD2D(geo: Awaited<ReturnType<typeof seedGeo>>) {
  if ((await prisma.d2DSurvey.count()) > 0) return;

  const leader = await prisma.user.findFirst({ where: { email: 'leader@praja.in' } });
  const volunteer = await prisma.user.findFirst({ where: { email: 'volunteer@praja.in' } });
  const cadre = await prisma.cadre.findFirst({ where: { mobile: '9876543210' } });
  const mandal = geo.mandals[0];
  const village = geo.villages[0];
  const booth = geo.booths[0];

  const survey = await prisma.d2DSurvey.create({
    data: {
      name: 'Mangalagiri Household Sentiment Survey 2026',
      nameTe: 'మంగళగిరి గృహ స్థాయి అభిప్రాయ సర్వే 2026',
      type: D2DSurveyType.Household,
      status: D2DSurveyStatus.Active,
      description: 'Door-to-door household survey for political sentiment and citizen issues.',
      startDate: daysAgo(7),
      endDate: daysAhead(30),
      targetHouseholds: 500,
      targetMandalId: mandal.id,
      targetVillageId: village.id,
      targetBoothId: booth.id,
      targetConstituencyId: geo.constituency.id,
      createdById: leader?.id,
    },
  });

  const q1 = await prisma.d2DSurveyQuestion.create({
    data: {
      surveyId: survey.id,
      order: 1,
      type: D2DQuestionType.SingleChoice,
      label: 'How do you rate current civic services?',
      labelTe: 'ప్రస్తుత పౌర సేవలను మీరు ఎలా అంచనా వేస్తారు?',
      required: true,
      options: {
        create: [
          { order: 1, label: 'Excellent', labelTe: 'అద్భుతం', value: 'excellent' },
          { order: 2, label: 'Good', labelTe: 'మంచిది', value: 'good' },
          { order: 3, label: 'Average', labelTe: 'సగటు', value: 'average' },
          { order: 4, label: 'Poor', labelTe: 'బాగోలేదు', value: 'poor' },
        ],
      },
    },
  });

  const q2 = await prisma.d2DSurveyQuestion.create({
    data: {
      surveyId: survey.id,
      order: 2,
      type: D2DQuestionType.YesNo,
      label: 'Are you satisfied with drinking water supply?',
      labelTe: 'తాగునీటి సరఫరాతో మీరు సంతృప్తిగా ఉన్నారా?',
      required: true,
    },
  });

  const q3 = await prisma.d2DSurveyQuestion.create({
    data: {
      surveyId: survey.id,
      order: 3,
      type: D2DQuestionType.Rating,
      label: 'Rate leader popularity (1-5)',
      labelTe: 'నాయకత్వ ప్రజాదరణను రేట్ చేయండి (1-5)',
      required: false,
      config: { min: 1, max: 5 },
    },
  });

  if (volunteer) {
    await prisma.d2DSurveyAssignment.create({
      data: {
        surveyId: survey.id,
        userId: volunteer.id,
        cadreId: cadre?.id,
        mandalId: mandal.id,
        villageId: village.id,
        boothId: booth.id,
        street: 'Ward 1',
        dailyTarget: 15,
      },
    });

    await prisma.d2DVolunteerTarget.create({
      data: {
        surveyId: survey.id,
        userId: volunteer.id,
        cadreId: cadre?.id,
        date: new Date(),
        target: 15,
        completed: 8,
      },
    });
  }

  const sentiments = [D2DSentiment.Supporter, D2DSentiment.Neutral, D2DSentiment.Opponent, D2DSentiment.Undecided];
  const issues = ['Water', 'Roads', 'Drainage', 'Pension', 'Electricity'];

  for (let i = 0; i < 12; i++) {
    const household = await prisma.d2DHousehold.create({
      data: {
        houseNumber: `${100 + i}`,
        headName: `Household Head ${i + 1}`,
        mobile: `9100000${String(i).padStart(3, '0')}`,
        address: `${i + 1} Main Street, ${village.name}`,
        ward: `Ward ${1 + (i % 3)}`,
        street: 'Ward 1',
        mandalId: mandal.id,
        villageId: village.id,
        boothId: booth.id,
        latitude: 16.44 + i * 0.001,
        longitude: 80.56 + i * 0.001,
        surveyedById: volunteer?.id,
        members: {
          create: [
            {
              name: `Member ${i + 1}A`,
              age: 35 + i,
              gender: i % 2 === 0 ? Gender.Male : Gender.Female,
              voterId: `AP${100000 + i}`,
              votingPreference: pick(sentiments, i),
              issues: [pick(issues, i)],
            },
            {
              name: `Member ${i + 1}B`,
              age: 22 + i,
              gender: Gender.Female,
              education: 'Graduate',
              votingPreference: pick(sentiments, i + 1),
            },
          ],
        },
      },
    });

    const response = await prisma.d2DSurveyResponse.create({
      data: {
        surveyId: survey.id,
        householdId: household.id,
        surveyorUserId: volunteer?.id,
        surveyorCadreId: cadre?.id,
        sentiment: pick(sentiments, i),
        priority: pick([D2DPriority.High, D2DPriority.Medium, D2DPriority.Low], i),
        needsFollowup: i % 4 === 0,
        isKeyVoter: i % 5 === 0,
        influencer: i % 6 === 0,
        issues: [pick(issues, i), pick(issues, i + 1)],
        timeTakenSec: 300 + i * 20,
        status: D2DResponseStatus.Synced,
        latitude: household.latitude,
        longitude: household.longitude,
        answers: {
          create: [
            { questionId: q1.id, value: pick(['excellent', 'good', 'average', 'poor'], i) },
            { questionId: q2.id, value: i % 2 === 0 },
            { questionId: q3.id, value: 1 + (i % 5) },
          ],
        },
      },
    });

    if (i < 3) {
      await prisma.d2DSurveyPhoto.create({
        data: { responseId: response.id, url: `/uploads/d2d/sample-${i}.jpg`, label: 'House photo' },
      });
    }
  }

  await prisma.d2DSurvey.create({
    data: {
      name: 'Booth-level Voter Preference Survey',
      nameTe: 'బూత్ స్థాయి ఓటరు అభిప్రాయ సర్వే',
      type: D2DSurveyType.Voter,
      status: D2DSurveyStatus.Draft,
      description: 'Voter-level political sentiment tracking.',
      targetMandalId: mandal.id,
      targetBoothId: booth.id,
      createdById: leader?.id,
      questions: {
        create: [
          {
            order: 1,
            type: D2DQuestionType.Text,
            label: 'Voter concerns',
            labelTe: 'ఓటరు ఆందోళనలు',
            required: true,
          },
        ],
      },
    },
  });
}

async function seedElection(geo: Awaited<ReturnType<typeof seedGeo>>) {
  const leader = await prisma.user.findFirst({ where: { email: 'leader@praja.in' } });
  const mandal = geo.mandals[0];
  const village = geo.villages[0];
  const booth = geo.booths[0];
  const cadre = await prisma.cadre.findFirst({ where: { mandalId: mandal.id } });
  const citizen = await prisma.citizen.findFirst({ where: { boothId: booth.id } });

  const categories = [
    'Meetings', 'Events', 'Food', 'Fuel', 'Vehicles', 'Printing', 'Flex / Banners',
    'Social Media', 'Digital Ads', 'Volunteer Payments', 'Booth Expenses', 'Office Expenses',
    'Travel', 'Accommodation', 'Sound System', 'Stage Setup', 'Campaign Materials', 'Miscellaneous',
  ];
  for (let i = 0; i < categories.length; i++) {
    await prisma.electionExpenseCategory.upsert({
      where: { name: categories[i] },
      update: { label: categories[i], sortOrder: i },
      create: { name: categories[i], label: categories[i], sortOrder: i },
    });
  }

  const existing = await prisma.election.findFirst({ where: { name: 'Mangalagiri Assembly 2026' } });
  if (existing) return;

  const foodCat = await prisma.electionExpenseCategory.findFirst({ where: { name: 'Food' } });
  const fuelCat = await prisma.electionExpenseCategory.findFirst({ where: { name: 'Fuel' } });

  const election = await prisma.election.create({
    data: {
      name: 'Mangalagiri Assembly 2026',
      type: 'Assembly',
      status: ElectionStatus.Active,
      electionDate: daysAhead(90),
      totalBudget: 5000000,
      constituencyId: geo.constituency.id,
      createdById: leader?.id,
    },
  });

  await prisma.electionExpense.createMany({
    data: [
      {
        electionId: election.id,
        title: 'Public meeting catering',
        categoryId: foodCat!.id,
        amount: 45000,
        expenseDate: daysAgo(3),
        mandalId: mandal.id,
        villageId: village.id,
        vendorName: 'Sri Lakshmi Caterers',
        paidBy: 'Finance Team',
        paymentMode: PaymentMode.UPI,
        status: ElectionExpenseStatus.Approved,
        createdById: leader?.id,
      },
      {
        electionId: election.id,
        title: 'Campaign vehicle fuel',
        categoryId: fuelCat!.id,
        amount: 8500,
        expenseDate: daysAgo(1),
        mandalId: mandal.id,
        vendorName: 'HP Petrol Pump',
        paidBy: 'Transport Team',
        paymentMode: PaymentMode.Cash,
        status: ElectionExpenseStatus.Pending,
        createdById: leader?.id,
      },
    ],
  });

  const work = await prisma.electionCampaignWork.create({
    data: {
      electionId: election.id,
      title: 'Banner installation at Mangalagiri junction',
      type: CampaignWorkType.BannerInstallation,
      status: CampaignWorkStatus.InProgress,
      priority: ElectionWorkPriority.High,
      deadline: daysAhead(7),
      mandalId: mandal.id,
      villageId: village.id,
      boothId: booth.id,
      createdById: leader?.id,
      assignments: cadre
        ? { create: [{ cadreId: cadre.id, role: 'Field Lead', status: CampaignWorkStatus.InProgress }] }
        : undefined,
    },
  });

  const vehicle = await prisma.electionVehicle.create({
    data: {
      electionId: election.id,
      vehicleNumber: 'AP39TD1234',
      vehicleType: ElectionVehicleType.CampaignVehicle,
      ownerName: 'Party Office',
      driverName: 'Ramesh',
      driverMobile: '9876543210',
      status: ElectionVehicleStatus.Assigned,
      assignments: {
        create: {
          purpose: 'Mandal campaign route',
          mandalId: mandal.id,
          boothId: booth.id,
          fromDate: daysAgo(2),
        },
      },
      tripLogs: {
        create: {
          tripDate: daysAgo(1),
          startKm: 1200,
          endKm: 1285,
          route: 'Mangalagiri Town route',
          createdById: leader?.id,
        },
      },
    },
  });

  await prisma.electionVehicleFuelLog.create({
    data: {
      vehicleId: vehicle.id,
      fuelDate: daysAgo(1),
      liters: 35,
      cost: 3500,
      createdById: leader?.id,
    },
  });

  const boothPlan = await prisma.electionBoothPlan.create({
    data: {
      electionId: election.id,
      boothId: booth.id,
      strength: BoothStrength.Strong,
      readinessScore: 78,
      voterCount: booth.voterCount,
      committeeNotes: 'Booth committee formed with 12 volunteers',
      pollingAgents: cadre
        ? { create: [{ cadreId: cadre.id, name: cadre.name, mobile: cadre.mobile, role: 'Polling Agent' }] }
        : undefined,
    },
  });

  if (citizen) {
    await prisma.electionVoterOutreach.create({
      data: {
        electionId: election.id,
        citizenId: citizen.id,
        contactName: citizen.name,
        contactMobile: citizen.mobile ?? undefined,
        channel: OutreachChannel.DoorToDoor,
        stance: VoterStance.Supporter,
        mandalId: mandal.id,
        villageId: village.id,
        boothId: booth.id,
        isKeyVoter: true,
        createdById: leader?.id,
      },
    });
  }

  const team = await prisma.electionCampaignTeam.create({
    data: {
      electionId: election.id,
      name: 'Mangalagiri Ground Team',
      type: CampaignTeamType.Ground,
      leaderCadreId: cadre?.id,
      mandalId: mandal.id,
      performanceScore: 85,
      members: cadre ? { create: [{ cadreId: cadre.id, role: 'Volunteer' }] } : undefined,
    },
  });

  const material = await prisma.electionMaterial.create({
    data: {
      electionId: election.id,
      type: ElectionMaterialType.Pamphlets,
      name: 'Candidate pamphlets - Telugu',
      stockTotal: 50000,
      stockIssued: 12000,
      vendorName: 'Sri Sai Printers',
    },
  });

  await prisma.electionMaterialDistribution.create({
    data: {
      materialId: material.id,
      quantity: 5000,
      mandalId: mandal.id,
      boothId: booth.id,
      issuedToCadreId: cadre?.id,
      createdById: leader?.id,
    },
  });

  await prisma.electionPollingDayUpdate.create({
    data: {
      electionId: election.id,
      boothPlanId: boothPlan.id,
      status: PollingDayStatus.AgentReached,
      turnoutCount: 120,
      hour: 9,
      createdById: leader?.id,
    },
  });

  void work;
  void team;
}

async function seedVoterIntelligence() {
  if (await prisma.voterSegment.count() > 0) return;

  const segments = await Promise.all([
    prisma.voterSegment.create({
      data: { name: 'Core Supporters', description: 'Confirmed party supporters', color: '#FFD600' },
    }),
    prisma.voterSegment.create({
      data: { name: 'Swing Voters', description: 'Undecided or swing preference', color: '#003366' },
    }),
    prisma.voterSegment.create({
      data: { name: 'Influencer Network', description: 'Community influencers', color: '#22c55e' },
    }),
    prisma.voterSegment.create({
      data: { name: 'Priority Booths', description: 'High-priority booth targets', color: '#ef4444' },
    }),
    prisma.voterSegment.create({
      data: { name: 'Opposition Lean', description: 'Opponent preference tracked', color: '#6b7280' },
    }),
  ]);

  const citizens = await prisma.citizen.findMany({ take: 50, orderBy: { createdAt: 'asc' } });
  const prefs: VoterPreference[] = [
    VoterPreference.Supporter,
    VoterPreference.Neutral,
    VoterPreference.Opponent,
    VoterPreference.Swing,
    VoterPreference.Unknown,
  ];

  for (let i = 0; i < citizens.length; i++) {
    const c = citizens[i];
    const preference = pick(prefs, i);
    const isKeyVoter = i % 7 === 0;
    const isInfluencer = i % 11 === 0;
    const isSwing = preference === VoterPreference.Swing || i % 9 === 0;
    let priorityScore = 0;
    if (isKeyVoter) priorityScore += 30;
    if (isInfluencer) priorityScore += 25;
    if (isSwing) priorityScore += 20;
    if (preference === VoterPreference.Supporter) priorityScore += 15;

    const segmentId = isInfluencer ? segments[2].id : isSwing ? segments[1].id : preference === VoterPreference.Supporter ? segments[0].id : undefined;

    await prisma.voterIntelligenceProfile.create({
      data: {
        citizenId: c.id,
        preference,
        isKeyVoter,
        isInfluencer,
        isSwing,
        priorityScore: Math.min(100, priorityScore),
        segmentId,
        source: i % 3 === 0 ? VoterIntelligenceSource.D2D : i % 3 === 1 ? VoterIntelligenceSource.Election : VoterIntelligenceSource.Manual,
        lastAssessedAt: daysAgo(i % 30),
      },
    });
  }

  const families = await prisma.family.findMany({ take: 20 });
  for (const f of families) {
    const members = await prisma.voterIntelligenceProfile.findMany({
      where: { citizen: { familyId: f.id } },
    });
    if (!members.length) continue;
    const counts = { s: 0, n: 0, o: 0, sw: 0 };
    for (const m of members) {
      if (m.preference === VoterPreference.Supporter) counts.s++;
      else if (m.preference === VoterPreference.Neutral) counts.n++;
      else if (m.preference === VoterPreference.Opponent) counts.o++;
      else if (m.preference === VoterPreference.Swing) counts.sw++;
    }
    await prisma.familyVoterPreference.create({
      data: {
        familyId: f.id,
        dominantPreference: counts.s >= counts.n && counts.s >= counts.o ? VoterPreference.Supporter : counts.o >= counts.n ? VoterPreference.Opponent : VoterPreference.Neutral,
        supporterCount: counts.s,
        neutralCount: counts.n,
        opponentCount: counts.o,
        swingCount: counts.sw,
        memberCount: members.length,
      },
    });
  }

  const booths = await prisma.booth.findMany({ take: 15 });
  for (const b of booths) {
    const profiles = await prisma.voterIntelligenceProfile.findMany({
      where: { citizen: { boothId: b.id } },
    });
    let s = 0, n = 0, o = 0, sw = 0;
    for (const p of profiles) {
      if (p.preference === VoterPreference.Supporter) s++;
      else if (p.preference === VoterPreference.Neutral) n++;
      else if (p.preference === VoterPreference.Opponent) o++;
      else if (p.preference === VoterPreference.Swing) sw++;
    }
    const total = profiles.length || 1;
    const supporterPct = (s / total) * 100;
    await prisma.boothVoterStrength.create({
      data: {
        boothId: b.id,
        supporterCount: s,
        neutralCount: n,
        opponentCount: o,
        swingCount: sw,
        totalProfiles: profiles.length,
        supporterPct,
        strengthLabel: supporterPct >= 60 ? BoothStrength.Strong : supporterPct >= 40 ? BoothStrength.Swing : BoothStrength.Weak,
        priorityBoothScore: Math.round(supporterPct + sw * 5),
      },
    });
  }

  const dupCitizens = citizens.slice(0, 4);
  if (dupCitizens.length >= 2) {
    await prisma.voterDuplicateCandidate.create({
      data: {
        citizenIdA: dupCitizens[0].id,
        citizenIdB: dupCitizens[1].id,
        matchScore: 85,
        matchReason: 'Similar name and booth',
        status: VoterDuplicateStatus.Pending,
      },
    });
  }

  const batch = await prisma.voterImportBatch.create({
    data: { fileName: 'demo_roll_import.csv', status: 'Completed', totalRows: 3, matchedRows: 2, unmatchedRows: 1 },
  });
  for (let i = 0; i < 3; i++) {
    await prisma.electoralRollEntry.create({
      data: {
        epicNo: `DEMO${1000 + i}`,
        name: `Roll Voter ${i + 1}`,
        age: 35 + i,
        importBatchId: batch.id,
        matchedCitizenId: i < 2 ? citizens[i]?.id : undefined,
        boothId: booths[0]?.id,
      },
    });
  }
}

async function seedWarRoom(geo: Awaited<ReturnType<typeof seedGeo>>) {
  if (await prisma.warRoomAlert.count() > 0) return;

  const leader = await prisma.user.findFirst({ where: { email: 'leader@praja.in' } });
  const booth = await prisma.booth.findFirst();
  const mandal = geo.mandals[0];

  await prisma.warRoomAlert.createMany({
    data: [
      { title: 'Booth agent shortage', message: '3 booths need polling agents', severity: 'High', mandalId: mandal?.id, boothId: booth?.id },
      { title: 'Weather advisory', message: 'Rain expected polling day morning', severity: 'Medium' },
    ],
  });

  if (booth) {
    await prisma.boothReadinessScore.create({ data: { boothId: booth.id, score: 72, factors: { agents: 8, materials: 7 } } });
  }
  if (mandal) {
    await prisma.mandalReadinessScore.create({ data: { mandalId: mandal.id, score: 68 } });
  }

  await prisma.electionEscalation.create({
    data: { title: 'Road closure near Booth 12', description: 'Requires immediate coordination', priority: 'High', mandalId: mandal?.id, assignedToId: leader?.id },
  });

  await prisma.dailyBriefing.create({
    data: { summary: 'Campaign on track. 2 escalations open. Focus swing booths.', createdById: leader?.id, metrics: { alerts: 2 } },
  });
}

async function seedAttendance(geo: Awaited<ReturnType<typeof seedGeo>>) {
  if ((await prisma.volunteerAttendance.count()) >= 40) return;

  const cadres = await prisma.cadre.findMany({ where: { status: 'Active' }, take: 15 });
  if (!cadres.length) return;

  const zoneCoords: [string, number, number, number, string][] = [
    ['Mangalagiri HQ', 16.4350, 80.5600, 200, geo.mandals[0]?.id ?? ''],
    ['Tadepalli Office', 16.4700, 80.6000, 150, geo.mandals[1]?.id ?? ''],
    ['Duggirala Center', 16.3200, 80.4900, 150, geo.mandals[2]?.id ?? ''],
    ['Campaign Booth 001', 16.4380, 80.5550, 100, geo.mandals[0]?.id ?? ''],
    ['Field Camp Alpha', 16.4420, 80.5650, 120, geo.mandals[0]?.id ?? ''],
  ];

  for (const [name, lat, lon, radius, mandalId] of zoneCoords) {
    await prisma.geoFenceZone.create({
      data: { name, latitude: lat, longitude: lon, radiusM: radius, mandalId: mandalId || undefined },
    });
  }

  const attendanceIds: string[] = [];
  for (let i = 0; i < 40; i++) {
    const cadre = pick(cadres, i);
    const checkInAt = daysAgo(i % 14);
    const hasCheckout = i % 4 !== 0;
    const lat = 16.435 + (i % 10) * 0.002;
    const lon = 80.56 + (i % 8) * 0.002;
    const inZone = i % 5 !== 0;
    const record = await prisma.volunteerAttendance.create({
      data: {
        cadreId: cadre.id,
        checkInAt,
        checkOutAt: hasCheckout ? new Date(checkInAt.getTime() + 4 * 60 * 60 * 1000) : null,
        latitude: lat,
        longitude: lon,
        geoVerified: inZone,
        notes: i % 7 === 0 ? 'Field visit completed' : undefined,
      },
    });
    attendanceIds.push(record.id);

    if (i % 3 === 0) {
      await prisma.fieldRoutePoint.createMany({
        data: [
          { cadreId: cadre.id, latitude: lat, longitude: lon, recordedAt: checkInAt },
          { cadreId: cadre.id, latitude: lat + 0.001, longitude: lon + 0.001, recordedAt: new Date(checkInAt.getTime() + 30 * 60 * 1000) },
          { cadreId: cadre.id, latitude: lat + 0.002, longitude: lon, recordedAt: new Date(checkInAt.getTime() + 60 * 60 * 1000) },
        ],
      });
    }
  }

  const leader = await prisma.user.findFirst({ where: { email: 'leader@praja.in' } });
  const correctionReasons = [
    'Wrong check-in time — arrived 30 min earlier',
    'GPS drift placed me outside zone',
    'Forgot to check out yesterday',
    'Check-in at wrong booth location',
    'Network delay caused duplicate entry',
  ];
  const statuses: AttendanceCorrectionStatus[] = [
    AttendanceCorrectionStatus.Pending,
    AttendanceCorrectionStatus.Pending,
    AttendanceCorrectionStatus.Approved,
    AttendanceCorrectionStatus.Rejected,
    AttendanceCorrectionStatus.Pending,
  ];

  for (let i = 0; i < 5; i++) {
    await prisma.attendanceCorrectionRequest.create({
      data: {
        attendanceId: attendanceIds[i],
        reason: correctionReasons[i],
        status: statuses[i],
        reviewedById: statuses[i] !== AttendanceCorrectionStatus.Pending ? leader?.id : undefined,
      },
    });
  }

  for (let i = 0; i < 8; i++) {
    const cadre = pick(cadres, i);
    await prisma.dailyFieldReport.create({
      data: {
        cadreId: cadre.id,
        summary: `Completed ${8 + i} household visits and ${2 + (i % 3)} meetings`,
        tasksCompleted: 8 + i,
        reportDate: daysAgo(i % 7),
      },
    });
  }
}

async function seedFundraising() {
  if (await prisma.donor.count() > 0) return;

  const donorNames = [
    'Rama Rao', 'Lakshmi Devi', 'Venkat Reddy', 'Padma Krishnan', 'Suresh Babu',
    'Anitha Kumari', 'Krishna Murthy', 'Sujatha Naidu', 'Ravi Shankar', 'Meena Rani',
    'Gopal Krishna', 'Sunitha Rao', 'Nagesh Babu', 'Priya Sharma', 'Mohan Lal',
    'Kavitha Devi', 'Srinivas Reddy', 'Deepa Nair', 'Rajesh Kumar', 'Swathi Priya',
    'Vijay Kumar', 'Rekha Devi', 'Harish Chandra', 'Lalitha Bai', 'Prasad Rao',
    'Geetha Kumari', 'Ashok Reddy', 'Manjula Devi', 'Chandra Sekhar', 'Uma Shankar',
  ];

  const donors = [];
  for (let i = 0; i < 30; i++) {
    const donor = await prisma.donor.create({
      data: {
        name: donorNames[i],
        mobile: `98${String(70000000 + i).slice(-8)}`,
        email: i % 3 === 0 ? `donor${i + 1}@example.com` : undefined,
        address: i % 2 === 0 ? `Ward ${(i % 10) + 1}, Mangalagiri` : undefined,
      },
    });
    donors.push(donor);
  }

  const events = await Promise.all([
    prisma.fundraisingEvent.create({
      data: { name: 'Youth Rally Fundraiser', eventDate: daysAhead(14), targetAmount: 500000 },
    }),
    prisma.fundraisingEvent.create({
      data: { name: 'Mandal Development Drive', eventDate: daysAhead(30), targetAmount: 750000 },
    }),
    prisma.fundraisingEvent.create({
      data: { name: 'Booth Committee Collection', eventDate: daysAgo(7), targetAmount: 200000 },
    }),
  ]);

  const paymentModes = [PaymentMode.Cash, PaymentMode.UPI, PaymentMode.Bank, PaymentMode.Cheque, PaymentMode.Other];
  const donations = [];
  for (let i = 0; i < 50; i++) {
    const donation = await prisma.donation.create({
      data: {
        donorId: pick(donors, i).id,
        amount: 1000 + (i % 20) * 2500 + (i % 7) * 500,
        paymentMode: pick(paymentModes, i),
        eventId: i % 3 === 0 ? pick(events, i).id : undefined,
        notes: i % 5 === 0 ? 'Pledged during booth visit' : undefined,
        createdAt: daysAgo(i % 45),
      },
    });
    donations.push(donation);
  }

  for (let i = 0; i < 15; i++) {
    await prisma.donationReceipt.create({
      data: {
        donationId: donations[i].id,
        receiptNo: `RCP-${1001 + i}`,
        issuedAt: daysAgo(i % 30),
      },
    });
  }

  const channels = ['Phone', 'WhatsApp', 'Email', 'In-person', 'SMS'];
  for (let i = 0; i < 40; i++) {
    await prisma.donorFollowUp.create({
      data: {
        donorId: pick(donors, i).id,
        dueDate: i % 4 === 0 ? daysAgo(2 + (i % 5)) : daysAhead(1 + (i % 14)),
        notes: pick(['Thank-you call', 'Pledge reminder', 'Receipt follow-up', 'Event invite'], i),
        completed: i % 5 === 0,
      },
    });
  }

  for (let i = 0; i < 35; i++) {
    await prisma.donorCommunicationLog.create({
      data: {
        donorId: pick(donors, i + 3).id,
        channel: pick(channels, i),
        message: pick([
          'Thanked for recent contribution',
          'Invited to mandal meeting',
          'Shared event details',
          'Confirmed pledge amount',
          'Sent receipt via WhatsApp',
        ], i),
        createdAt: daysAgo(i % 20),
      },
    });
  }

  console.log('[seed] Fundraising: 30 donors, 50 donations, 3 events, follow-ups & comm logs');
}

async function seedCompliance() {
  if (await prisma.permissionRequest.count() >= 10) {
    console.log('[seed] Compliance data already present — skipping');
    return;
  }

  console.log('[seed] Seeding compliance module…');

  const checklist = await prisma.complianceChecklist.upsert({
    where: { name: 'Election Code of Conduct' },
    update: {},
    create: { name: 'Election Code of Conduct' },
  });

  const checklistItems = [
    'No liquor distribution within 48 hours of polling',
    'Silence zone compliance near booths',
    'Model Code of Conduct briefing for all workers',
    'Remove campaign material 48hrs before poll',
    'Verify loudspeaker permissions for rallies',
    'Ensure vehicle convoy route approvals',
    'Display party symbols only in permitted areas',
    'Maintain expense receipts for all campaign spending',
  ];

  for (const label of checklistItems) {
    const existing = await prisma.complianceChecklistItem.findFirst({
      where: { checklistId: checklist.id, label },
    });
    if (!existing) {
      await prisma.complianceChecklistItem.create({
        data: {
          checklistId: checklist.id,
          label,
          completed: label.includes('Silence zone') || label.includes('briefing'),
        },
      });
    }
  }

  const rallyChecklist = await prisma.complianceChecklist.upsert({
    where: { name: 'Rally & Event Checklist' },
    update: {},
    create: { name: 'Rally & Event Checklist' },
  });

  await prisma.complianceChecklistItem.createMany({
    data: [
      { checklistId: rallyChecklist.id, label: 'Police permission obtained', completed: true },
      { checklistId: rallyChecklist.id, label: 'Fire safety clearance', completed: false },
      { checklistId: rallyChecklist.id, label: 'First aid team on standby', completed: false },
      { checklistId: rallyChecklist.id, label: 'Crowd control plan submitted', completed: true },
    ],
  });

  const permissions = [
    { type: 'Rally' as const, title: 'Mangalagiri central rally permission', status: 'Pending' as const },
    { type: 'Vehicle' as const, title: 'Campaign convoy — 12 vehicles', status: 'Approved' as const },
    { type: 'Event' as const, title: 'Youth conclave at town hall', status: 'Pending' as const },
    { type: 'Loudspeaker' as const, title: 'Corner meeting loudspeaker — Ward 4', status: 'Approved' as const },
    { type: 'Police' as const, title: 'Road show security arrangement', status: 'Pending' as const },
    { type: 'Rally' as const, title: 'Village outreach rally — Tenali', status: 'Rejected' as const },
    { type: 'Vehicle' as const, title: 'Mobile publicity van permit', status: 'Approved' as const },
    { type: 'Event' as const, title: "Women's wing convention", status: 'Pending' as const },
    { type: 'Loudspeaker' as const, title: 'Temple festival announcement', status: 'Approved' as const },
    { type: 'Police' as const, title: 'Night padayatra route clearance', status: 'Pending' as const },
  ];

  const createdPermissions = [];
  for (const p of permissions) {
    const row = await prisma.permissionRequest.create({ data: p });
    createdPermissions.push(row);
  }

  const notices = [
    { title: 'ECI notice on paid news', reference: 'ECI/PN/2024/045', status: 'Open' },
    { title: 'District collector order — rally restrictions', reference: 'DC/GNT/2024/112', status: 'Open' },
    { title: 'High Court stay on wall writing', reference: 'HC/AP/2024/8891', status: 'Closed' },
  ];

  const createdNotices = [];
  for (const n of notices) {
    const row = await prisma.legalNotice.create({ data: n });
    createdNotices.push(row);
  }

  await prisma.complianceDocument.createMany({
    data: [
      {
        fileUrl: '/uploads/demo/rally-permission.pdf',
        fileName: 'rally-permission.pdf',
        permissionRequestId: createdPermissions[0].id,
      },
      {
        fileUrl: '/uploads/demo/vehicle-permit.pdf',
        fileName: 'vehicle-permit.pdf',
        permissionRequestId: createdPermissions[1].id,
      },
      {
        fileUrl: '/uploads/demo/loudspeaker-noc.pdf',
        fileName: 'loudspeaker-noc.pdf',
        permissionRequestId: createdPermissions[3].id,
      },
      {
        fileUrl: '/uploads/demo/eci-paid-news.pdf',
        fileName: 'eci-paid-news.pdf',
        legalNoticeId: createdNotices[0].id,
      },
      {
        fileUrl: '/uploads/demo/collector-order.pdf',
        fileName: 'collector-order.pdf',
        legalNoticeId: createdNotices[1].id,
      },
    ],
  });

  await prisma.complianceAlert.createMany({
    data: [
      { message: 'Vehicle permission expires in 3 days', severity: 'High' },
      { message: 'Rally permission pending — Mangalagiri central', severity: 'Medium' },
      { message: 'Missing receipt for 2 campaign expenses', severity: 'High' },
      { message: 'Legal notice ECI/PN/2024/045 requires response', severity: 'High' },
      { message: 'Checklist item overdue: Fire safety clearance', severity: 'Medium' },
      { message: 'Loudspeaker permit renewal due next week', severity: 'Low', resolved: true },
    ],
  });

  console.log('[seed] Compliance: 10 permissions, 3 notices, 5 documents, 6 alerts');
}

async function seedDocuments() {
  if (await prisma.documentCategory.count() >= 3) {
    console.log('[seed] Documents data already present — skipping');
    return;
  }

  console.log('[seed] Seeding documents module…');

  const categories = await Promise.all([
    prisma.documentCategory.upsert({
      where: { name: 'Campaign Material' },
      update: {},
      create: { name: 'Campaign Material' },
    }),
    prisma.documentCategory.upsert({
      where: { name: 'Legal & Compliance' },
      update: {},
      create: { name: 'Legal & Compliance' },
    }),
    prisma.documentCategory.upsert({
      where: { name: 'Field Reports' },
      update: {},
      create: { name: 'Field Reports' },
    }),
  ]);

  const electionFolder = await prisma.documentFolder.create({
    data: { name: 'Election 2024', categoryId: categories[0].id, permissionLevel: 'view' },
  });
  const legalFolder = await prisma.documentFolder.create({
    data: { name: 'Permissions & NOCs', categoryId: categories[1].id, permissionLevel: 'edit' },
  });
  const boothFolder = await prisma.documentFolder.create({
    data: { name: 'Booth Operations', parentId: electionFolder.id, categoryId: categories[0].id },
  });

  const leader = await prisma.user.findFirst({ where: { email: 'leader@praja.in' } });

  const files = [
    { folderId: electionFolder.id, name: 'Booth list.pdf', fileUrl: '/uploads/demo/booth-list.pdf', mimeType: 'application/pdf', tags: 'election,booth' },
    { folderId: electionFolder.id, name: 'Campaign plan.docx', fileUrl: '/uploads/demo/campaign-plan.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', tags: 'strategy' },
    { folderId: boothFolder.id, name: 'Agent roster.xlsx', fileUrl: '/uploads/demo/agent-roster.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', tags: 'booth,agents' },
    { folderId: legalFolder.id, name: 'Rally permission.pdf', fileUrl: '/uploads/demo/rally-permission.pdf', mimeType: 'application/pdf', tags: 'legal,rally' },
    { folderId: legalFolder.id, name: 'Loudspeaker NOC.pdf', fileUrl: '/uploads/demo/loudspeaker-noc.pdf', mimeType: 'application/pdf', tags: 'legal' },
  ];

  for (const f of files) {
    const file = await prisma.documentFile.create({ data: f });
    if (leader) {
      await prisma.documentAccessLog.create({
        data: { fileId: file.id, userId: leader.id, action: 'upload' },
      });
    }
  }

  console.log('[seed] Documents: 3 categories, 3 folders, 5 files');
}

async function seedCallCenter() {
  if (await prisma.callQueue.count() >= 2) {
    console.log('[seed] Call center data already present — skipping');
    return;
  }

  console.log('[seed] Seeding call center module…');

  const leader = await prisma.user.findFirst({ where: { email: 'leader@praja.in' } });
  const volunteer = await prisma.user.findFirst({ where: { email: 'volunteer@praja.in' } });

  let agent = leader
    ? await prisma.callAgent.findUnique({ where: { userId: leader.id } })
    : null;
  if (leader && !agent) {
    agent = await prisma.callAgent.create({ data: { userId: leader.id, status: 'Available' } });
  }

  let agent2 = volunteer
    ? await prisma.callAgent.findUnique({ where: { userId: volunteer.id } })
    : null;
  if (volunteer && !agent2) {
    agent2 = await prisma.callAgent.create({ data: { userId: volunteer.id, status: 'OnCall' } });
  }

  const grievanceQueue = await prisma.callQueue.create({ data: { name: 'Grievance Helpline', priority: 10 } });
  const infoQueue = await prisma.callQueue.create({ data: { name: 'Information Desk', priority: 5 } });

  const calls = [
    { direction: 'Inbound' as const, callerNumber: '9876543210', disposition: 'Grievance', durationSec: 180, notes: 'Water supply issue in Ward 3', agentId: agent?.id, queueId: grievanceQueue.id },
    { direction: 'Inbound' as const, callerNumber: '9123456780', disposition: 'Information', durationSec: 90, notes: 'Asked about pension scheme', agentId: agent2?.id, queueId: infoQueue.id },
    { direction: 'Outbound' as const, callerNumber: '9988776655', disposition: 'FollowUp', durationSec: 120, notes: 'Callback on road repair', agentId: agent?.id, queueId: grievanceQueue.id },
    { direction: 'Inbound' as const, callerNumber: '9000012345', disposition: 'Grievance', durationSec: 240, notes: 'Streetlight not working', agentId: agent?.id, queueId: grievanceQueue.id },
    { direction: 'Inbound' as const, callerNumber: '9555123456', disposition: 'Escalated', durationSec: 300, notes: 'Urgent drainage overflow', agentId: agent2?.id, queueId: grievanceQueue.id },
  ];

  const createdCalls = [];
  for (const c of calls) {
    createdCalls.push(await prisma.callLog.create({ data: c }));
  }

  await prisma.callScript.createMany({
    data: [
      { title: 'Grievance intake', content: 'Greet caller warmly. Record name, mobile, village/ward. Capture issue category and urgency. Confirm callback number.' },
      { title: 'Information desk', content: 'Answer scheme eligibility questions. Direct to nearest camp if needed. Offer WhatsApp follow-up.' },
      { title: 'Outbound follow-up', content: 'Reference previous ticket. Confirm resolution status. Log citizen satisfaction.' },
    ],
  });

  const dueTomorrow = new Date();
  dueTomorrow.setDate(dueTomorrow.getDate() + 1);
  await prisma.callFollowUpReminder.createMany({
    data: [
      { callLogId: createdCalls[0].id, dueAt: dueTomorrow, completed: false },
      { callLogId: createdCalls[2].id, dueAt: dueTomorrow, completed: false },
      { callLogId: createdCalls[1].id, dueAt: new Date(), completed: true },
    ],
  });

  console.log('[seed] Call center: 2 queues, 5 calls, 3 scripts, 3 follow-ups');
}

async function seedDataQuality() {
  if (await prisma.dataQualityIssue.count() >= 5) {
    console.log('[seed] Data quality data already present — skipping');
    return;
  }

  console.log('[seed] Seeding data quality module…');

  const citizens = await prisma.citizen.findMany({ take: 6, orderBy: { createdAt: 'asc' } });
  const c1 = citizens[0];
  const c2 = citizens[1];
  const c3 = citizens[2];

  if (c1) {
    await prisma.dataQualityIssue.create({
      data: { entityType: 'Citizen', entityId: c1.id, issueType: 'DuplicateMobile', score: 0.85 },
    });
  }
  if (c2) {
    await prisma.dataQualityIssue.create({
      data: { entityType: 'Citizen', entityId: c2.id, issueType: 'MissingVoterId', score: 0.6 },
    });
  }
  if (c1 && c2) {
    await prisma.profileMergeSuggestion.create({
      data: { citizenIdA: c1.id, citizenIdB: c2.id, score: 0.9 },
    });
  }
  if (c2 && c3) {
    await prisma.profileMergeSuggestion.create({
      data: { citizenIdA: c2.id, citizenIdB: c3.id, score: 0.75, status: 'Rejected' },
    });
  }

  const grievance = await prisma.grievance.findFirst();
  if (grievance) {
    await prisma.dataQualityIssue.create({
      data: { entityType: 'Grievance', entityId: grievance.id, issueType: 'DuplicateGrievance', score: 0.8 },
    });
  }

  if (c3) {
    await prisma.addressNormalizationLog.create({
      data: {
        citizenId: c3.id,
        original: 'main road,tenali,guntur',
        normalized: 'Main Road, Tenali, Guntur',
      },
    });
    await prisma.mobileValidationLog.create({ data: { mobile: '12345', valid: false } });
    await prisma.mobileValidationLog.create({ data: { mobile: c3.mobile ?? '9876543210', valid: true } });
  }

  console.log('[seed] Data quality: issues, merge suggestions, normalization & validation logs');
}

async function seedMedia() {
  if ((await prisma.newsArticle.count()) >= 20) return;

  const sources = ['Eenadu', 'Sakshi', 'Andhra Jyothy', 'The Hindu', 'Local News', 'TV9', 'NTV'];
  const sentiments = ['Positive', 'Neutral', 'Negative'];
  const leaderNames = ['State Leader', 'District Incharge', 'Constituency MLA', 'Party President'];

  const articleIds: string[] = [];
  for (let i = 0; i < 20; i++) {
    const article = await prisma.newsArticle.create({
      data: {
        title: pick([
          'Leader inaugurates development project',
          'Opposition questions welfare schemes',
          'Rally draws thousands in Mangalagiri',
          'New hospital wing opened',
          'Farmers meet on crop insurance',
          'Youth wing launches membership drive',
          'Road works completed ahead of schedule',
          'Party worker felicitated for service',
        ], i),
        source: pick(sources, i),
        url: i % 3 === 0 ? `https://news.example.com/article-${i + 1}` : undefined,
        sentiment: pick(sentiments, i),
        createdAt: daysAgo(i % 30),
      },
    });
    articleIds.push(article.id);

    if (i % 2 === 0) {
      await prisma.leaderMention.create({
        data: {
          articleId: article.id,
          leaderName: pick(leaderNames, i),
          sentiment: pick(sentiments, i + 1),
        },
      });
    }
  }

  for (let i = 0; i < 10; i++) {
    await prisma.pressClipping.create({
      data: {
        title: `Press clipping — ${pick(['Rally coverage', 'Interview excerpt', 'Editorial mention', 'Campaign photo'], i)}`,
        clipDate: daysAgo(i % 20),
        fileUrl: i % 2 === 0 ? `/uploads/demo/clipping-${i + 1}.pdf` : undefined,
      },
    });
  }

  const responseStatuses: MediaResponseStatus[] = [
    MediaResponseStatus.Draft,
    MediaResponseStatus.PendingApproval,
    MediaResponseStatus.Approved,
    MediaResponseStatus.Published,
    MediaResponseStatus.PendingApproval,
  ];
  const attackResponseStatuses = ['Pending', 'Drafted', 'Published', 'Pending', 'Approved'];

  for (let i = 0; i < 5; i++) {
    const attack = await prisma.oppositionAttack.create({
      data: {
        title: pick([
          'Opposition claims on job creation',
          'Allegations on fund diversion',
          'Criticism of road project delays',
          'Attack on welfare scheme rollout',
          'Misinformation on healthcare access',
        ], i),
        description: pick([
          'Counter narrative needed for social media',
          'Fact-check team assigned',
          'Press note draft required',
          'District spokesperson to respond',
          'Coordinate with legal cell',
        ], i),
        responseStatus: attackResponseStatuses[i],
        createdAt: daysAgo(i % 14),
      },
    });

    await prisma.mediaResponse.create({
      data: {
        attackId: attack.id,
        content: pick([
          'Official fact-check response with data points',
          'Clarification on budget allocation timeline',
          'Project completion milestones shared',
          'Citizen testimonials and ground reports',
          'Rebuttal with verified government records',
        ], i),
        status: responseStatuses[i],
        createdAt: daysAgo(i % 10),
      },
    });
  }

  for (let i = 0; i < 12; i++) {
    await prisma.reputationScoreSnapshot.create({
      data: {
        score: 62 + (i % 8) * 2.5,
        date: daysAgo(30 - i * 2),
      },
    });
  }

  console.log('[seed] Media: 20 articles, 10 clippings, mentions, 5 attacks, reputation snapshots');
}

async function seedPrManagement() {
  const sources: [string, string, string][] = [
    ['Eenadu', 'https://www.eenadu.net/rss/top-stories.rss', 'te'],
    ['Sakshi', 'https://www.sakshi.com/rss/andhra-pradesh', 'te'],
    ['Andhra Jyothy', 'https://www.andhrajyothy.com/rss/andhra-pradesh', 'te'],
    ['TV9 Telugu', 'https://www.tv9telugu.com/rss/andhra-pradesh', 'te'],
  ];

  for (const [name, url, language] of sources) {
    await prisma.newsSource.upsert({
      where: { url },
      update: { name, language, enabled: true },
      create: { name, url, language, enabled: true },
    });
  }

  console.log('[seed] PR Management: 4 default RSS news sources');
}

async function seedManifesto() {
  if ((await prisma.electionPromise.count()) >= 25) return;

  const categories = [
    'Infrastructure',
    'Healthcare',
    'Education',
    'Agriculture',
    'Employment',
  ];

  const categoryIds: string[] = [];
  for (const name of categories) {
    const cat = await prisma.promiseCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    categoryIds.push(cat.id);
  }

  const promiseTitles = [
    'Ring road completion', 'PHC upgrade in every mandal', 'Smart classrooms in govt schools',
    'Crop insurance enrollment drive', 'Youth skill training centres', 'Drinking water pipeline expansion',
    'Street lighting in all villages', 'Women self-help group credit', 'Bus connectivity improvement',
    'Primary school meal quality upgrade', 'Drainage network in towns', 'Rythu Bharosa outreach',
    'Anganwadi centre renovations', 'Employment exchange job fairs', 'Solar pumps for farmers',
    'Community health worker training', 'Library and reading rooms', 'Market yard modernization',
    'Senior citizen pension facilitation', 'Digital grievance kiosk rollout', 'Sports complex in constituency',
    'Waste management plant', 'Bridge repair programme', 'ITI apprenticeship slots', 'Housing for poor families',
  ];
  const workStatuses: PromiseWorkStatus[] = [
    PromiseWorkStatus.NotStarted,
    PromiseWorkStatus.InProgress,
    PromiseWorkStatus.Completed,
    PromiseWorkStatus.Delayed,
    PromiseWorkStatus.InProgress,
  ];
  const departments = ['Roads', 'Health', 'Education', 'Agriculture', 'Employment', 'Water', 'Municipal'];

  const promiseIds: string[] = [];
  for (let i = 0; i < 25; i++) {
    const status = pick(workStatuses, i);
    const completionPct = status === PromiseWorkStatus.Completed ? 100
      : status === PromiseWorkStatus.InProgress ? 20 + (i % 6) * 10
      : status === PromiseWorkStatus.Delayed ? 35
      : 0;
    const budgetTotal = 5000000 + (i % 10) * 2500000;

    const promise = await prisma.electionPromise.create({
      data: {
        title: promiseTitles[i],
        categoryId: pick(categoryIds, i),
        department: pick(departments, i),
        completionPct,
        budgetTotal,
        budgetSpent: Math.round(budgetTotal * (completionPct / 100)),
        workStatus: status,
      },
    });
    promiseIds.push(promise.id);

    await prisma.promisePublicUpdate.create({
      data: {
        promiseId: promise.id,
        note: pick([
          'Work commenced after tender approval',
          'Milestone 1 completed — site survey done',
          'Public inspection camp held',
          'Funds released from state allocation',
          'Contractor mobilized on site',
        ], i),
        isPublic: i % 4 !== 0,
        createdAt: daysAgo(i % 20),
      },
    });

    const priorStatus = status === PromiseWorkStatus.Completed
      ? PromiseWorkStatus.InProgress
      : status === PromiseWorkStatus.InProgress
        ? PromiseWorkStatus.NotStarted
        : PromiseWorkStatus.NotStarted;

    await prisma.promiseWorkStatusLog.createMany({
      data: [
        {
          promiseId: promise.id,
          status: PromiseWorkStatus.NotStarted,
          note: 'Promise registered in tracker',
          createdAt: daysAgo(25 + (i % 10)),
        },
        ...(status !== PromiseWorkStatus.NotStarted
          ? [{
              promiseId: promise.id,
              status: priorStatus,
              note: 'Status updated after field verification',
              createdAt: daysAgo(10 + (i % 8)),
            }]
          : []),
        ...(status === PromiseWorkStatus.Completed || status === PromiseWorkStatus.Delayed
          ? [{
              promiseId: promise.id,
              status,
              note: status === PromiseWorkStatus.Completed ? 'Work verified and closed' : 'Delayed due to monsoon',
              createdAt: daysAgo(i % 5),
            }]
          : []),
      ],
    });
  }

  void promiseIds;
  console.log('[seed] Manifesto: 5 categories, 25 promises, public updates, status history');
}

async function seedCrisis(geo: Awaited<ReturnType<typeof seedGeo>>) {
  if ((await prisma.crisisIssue.count()) >= 20) return;

  const leader = await prisma.user.findFirst({ where: { email: 'leader@praja.in' } });
  const cadres = await prisma.cadre.findMany({ where: { status: 'Active' }, take: 6 });
  const villages = geo.villages;

  const issueTemplates = [
    { title: 'Water shortage', severity: CrisisSeverity.High, desc: 'Summer drought impact on drinking water' },
    { title: 'Power outage cluster', severity: CrisisSeverity.Medium, desc: 'Transformer failure affecting 3 villages' },
    { title: 'Flood risk — low-lying area', severity: CrisisSeverity.Critical, desc: 'Canal overflow after heavy rains' },
    { title: 'Communal tension reported', severity: CrisisSeverity.High, desc: 'Dispute near market area needs mediation' },
    { title: 'Road blockade protest', severity: CrisisSeverity.Medium, desc: 'Farmers blocking highway over MSP' },
    { title: 'Hospital oxygen supply alert', severity: CrisisSeverity.Critical, desc: 'PHC reporting low cylinder stock' },
    { title: 'School building safety concern', severity: CrisisSeverity.Medium, desc: 'Cracks observed in classroom wall' },
    { title: 'Livestock disease outbreak', severity: CrisisSeverity.High, desc: 'Cattle deaths reported in 2 villages' },
  ];
  const statuses: CrisisIssueStatus[] = [
    CrisisIssueStatus.Open,
    CrisisIssueStatus.Active,
    CrisisIssueStatus.Resolved,
    CrisisIssueStatus.Closed,
  ];

  const issueIds: string[] = [];
  for (let i = 0; i < 20; i++) {
    const t = pick(issueTemplates, i);
    const village = pick(villages, i);
    const mandal = geo.mandals.find((m) => m.id === village.mandalId) ?? pick(geo.mandals, i);

    const issue = await prisma.crisisIssue.create({
      data: {
        title: `${t.title} — ${village.name}`,
        description: t.desc,
        severity: t.severity,
        status: pick(statuses, i),
        villageId: village.id,
        mandalId: mandal?.id,
        createdAt: daysAgo(i % 21),
      },
    });
    issueIds.push(issue.id);

    await prisma.crisisTimelineEntry.create({
      data: {
        issueId: issue.id,
        note: pick([
          'Issue reported by field team',
          'Coordinator notified',
          'District helpline escalated',
          'On-site assessment completed',
          'Resolution plan drafted',
        ], i),
        userId: leader?.id,
        createdAt: daysAgo(i % 14),
      },
    });

    if (i % 3 === 0) {
      await prisma.crisisEscalation.create({
        data: {
          issueId: issue.id,
          level: 1 + (i % 3),
          assignedToId: leader?.id,
          createdAt: daysAgo(i % 7),
        },
      });
    }
  }

  for (let i = 0; i < 3; i++) {
    await prisma.protestEvent.create({
      data: {
        location: pick(['Mangalagiri bus stand', 'Tadepalli collectorate road', 'Tenali market junction'], i),
        eventDate: daysAgo(3 + i),
        participants: 80 + i * 40,
        notes: pick(['Peaceful demonstration', 'Traffic diversion in place', 'Negotiations ongoing'], i),
      },
    });
  }

  const rrtTeams = ['RRT Alpha', 'RRT Bravo', 'RRT Charlie'];
  for (let i = 0; i < 3; i++) {
    const response = await prisma.emergencyResponse.create({
      data: {
        issueId: issueIds[i],
        teamName: rrtTeams[i],
        status: pick(['Assigned', 'EnRoute', 'OnSite', 'Completed'], i),
        createdAt: daysAgo(i % 5),
      },
    });

    if (cadres.length) {
      for (let j = 0; j < 2; j++) {
        await prisma.rapidResponseAssignment.create({
          data: {
            responseId: response.id,
            cadreId: pick(cadres, i + j).id,
          },
        });
      }
    }
  }

  console.log('[seed] Crisis: 20 issues, escalations, 3 protests, RRT teams');
}

async function seedLeaderOffice() {
  if ((await prisma.appointmentRequest.count()) >= 15) return;

  const purposes = [
    'Infrastructure project discussion',
    'Welfare scheme grievance',
    'Party worker meet',
    'Business delegation visit',
    'Community leader request',
    'Media interview request',
    'NGO collaboration proposal',
    'Local issue escalation',
  ];
  const appointmentStatuses: AppointmentStatus[] = [
    AppointmentStatus.Pending,
    AppointmentStatus.Approved,
    AppointmentStatus.Rejected,
    AppointmentStatus.Completed,
    AppointmentStatus.Pending,
  ];

  for (let i = 0; i < 15; i++) {
    const status = pick(appointmentStatuses, i);
    await prisma.appointmentRequest.create({
      data: {
        visitorName: `Visitor ${i + 1} — ${pick(['Rama Rao', 'Lakshmi Devi', 'Venkat Reddy', 'Padma Krishnan', 'Suresh Babu'], i)}`,
        mobile: `98${String(71000000 + i).slice(-8)}`,
        purpose: pick(purposes, i),
        status,
        scheduledAt: status === AppointmentStatus.Approved || status === AppointmentStatus.Completed
          ? daysAhead(1 + (i % 7))
          : undefined,
        createdAt: daysAgo(i % 14),
      },
    });
  }

  for (let i = 0; i < 20; i++) {
    const checkIn = daysAgo(i % 10);
    await prisma.visitor.create({
      data: {
        name: pick(['Party worker', 'Citizen delegate', 'Mandal coordinator', 'Booth agent', 'Press correspondent'], i),
        mobile: `97${String(72000000 + i).slice(-8)}`,
        purpose: pick(purposes, i),
        checkInAt: checkIn,
        checkOutAt: i % 4 !== 0 ? new Date(checkIn.getTime() + 45 * 60 * 1000) : null,
      },
    });
  }

  const vipOrgs = ['Govt of AP', 'District Administration', 'State Planning Board', 'Industry Association', 'Media House'];
  for (let i = 0; i < 8; i++) {
    await prisma.vipContact.create({
      data: {
        name: pick(['District Collector', 'SP Guntur', 'Municipal Commissioner', 'MLC', 'Senior Journalist', 'Trade Union Leader'], i),
        mobile: `96${String(73000000 + i).slice(-8)}`,
        organization: pick(vipOrgs, i),
        notes: i % 2 === 0 ? 'Key stakeholder — maintain regular contact' : undefined,
      },
    });
  }

  for (let i = 0; i < 12; i++) {
    await prisma.leaderPersonalTask.create({
      data: {
        title: pick([
          'Review booth readiness report',
          'Call district coordinator',
          'Approve media response draft',
          'Sign permission letters',
          'Prepare rally speech notes',
          'Follow up on grievance camp',
        ], i),
        dueDate: i % 3 === 0 ? daysAhead(i % 5) : daysAgo(i % 3),
        status: pick([ActivityStatus.Planned, ActivityStatus.Ongoing, ActivityStatus.Completed], i),
      },
    });
  }

  for (let i = 0; i < 10; i++) {
    const start = daysAhead(i % 7);
    await prisma.leaderScheduleBlock.create({
      data: {
        title: pick(['Constituency review', 'Media briefing', 'Party core committee', 'Field visit', 'VIP lunch'], i),
        startAt: start,
        endAt: new Date(start.getTime() + (1 + (i % 3)) * 60 * 60 * 1000),
      },
    });
  }

  console.log('[seed] Leader office: 15 appointments, 20 visitors, VIPs, tasks, schedule blocks');
}

async function seedSecurityAudit() {
  if ((await prisma.suspiciousActivityAlert.count()) >= 5) return;

  const users = await prisma.user.findMany({ take: 5 });
  const leader = users.find((u) => u.email === 'leader@praja.in') ?? users[0];
  const volunteer = users.find((u) => u.email === 'volunteer@praja.in') ?? users[1];

  for (const user of users.slice(0, 4)) {
    await prisma.userSession.create({
      data: {
        userId: user.id,
        tokenHash: `demo-token-hash-${user.id.slice(-8)}`,
        expiresAt: daysAhead(7),
        revoked: false,
        createdAt: daysAgo(1),
      },
    });

    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        ip: `192.168.1.${10 + users.indexOf(user)}`,
        success: true,
        createdAt: daysAgo(users.indexOf(user) % 5),
      },
    });
  }

  if (leader) {
    await prisma.loginHistory.create({
      data: { userId: leader.id, ip: '203.0.113.45', success: false, createdAt: daysAgo(2) },
    });
    await prisma.dataExportLog.create({
      data: { userId: leader.id, exportType: 'citizens', createdAt: daysAgo(3) },
    });
    await prisma.dataExportLog.create({
      data: { userId: leader.id, exportType: 'grievances', createdAt: daysAgo(1) },
    });
  }

  const modules = ['grievances', 'citizens', 'cadre', 'reports', 'admin', 'media'];
  for (let i = 0; i < 15; i++) {
    const user = pick(users, i);
    await prisma.roleActivityLog.create({
      data: {
        userId: user?.id,
        action: pick(['view', 'edit', 'export', 'assign', 'approve'], i),
        module: pick(modules, i),
        createdAt: daysAgo(i % 12),
      },
    });
  }

  for (let i = 0; i < 10; i++) {
    const user = pick(users, i);
    await prisma.fileAccessLog.create({
      data: {
        userId: user?.id,
        filePath: pick([
          '/uploads/demo/booth-list.pdf',
          '/uploads/demo/campaign-plan.docx',
          '/uploads/demo/agent-roster.xlsx',
          '/exports/citizens-2024.csv',
          '/exports/grievances-summary.pdf',
        ], i),
        action: pick(['read', 'download', 'upload', 'delete'], i),
        createdAt: daysAgo(i % 10),
      },
    });
  }

  await prisma.suspiciousActivityAlert.createMany({
    data: [
      { message: 'Multiple failed login attempts from unknown IP', severity: 'High', resolved: false },
      { message: 'Bulk export outside business hours', severity: 'Medium', resolved: false },
      { message: 'Role permission change by non-admin user', severity: 'High', resolved: false },
      { message: 'Unusual file download volume detected', severity: 'Medium', resolved: true },
      { message: 'Session token reuse across devices', severity: 'High', resolved: false },
      { message: 'After-hours admin module access', severity: 'Low', resolved: true },
    ],
  });

  void volunteer;
  console.log('[seed] Security audit: sessions, alerts, role activity, file access logs');
}

async function seedOfflineSync() {
  if ((await prisma.offlineSyncQueue.count()) >= 10) return;

  const devices = ['demo-device-1', 'demo-device-2', 'demo-tablet-field', 'demo-phone-booth'];
  const entityTypes = ['grievance', 'citizen', 'attendance', 'd2d_response', 'activity'];

  const queueIds: string[] = [];
  for (let i = 0; i < 10; i++) {
    const status = i === 9
      ? OfflineSyncStatus.Failed
      : i < 7
        ? OfflineSyncStatus.Pending
        : OfflineSyncStatus.Synced;

    const row = await prisma.offlineSyncQueue.create({
      data: {
        deviceId: pick(devices, i),
        entityType: pick(entityTypes, i),
        payload: {
          title: `Offline ${pick(entityTypes, i)} #${i + 1}`,
          description: 'Captured in field without connectivity',
          localId: `local-${i + 1}`,
        },
        status,
        error: status === OfflineSyncStatus.Failed ? 'Network timeout during sync' : undefined,
        syncedAt: status === OfflineSyncStatus.Synced ? daysAgo(1) : undefined,
        createdAt: daysAgo(i % 5),
      },
    });
    queueIds.push(row.id);
  }

  for (let i = 0; i < 2; i++) {
    await prisma.syncConflict.create({
      data: {
        queueId: queueIds[i],
        resolution: i === 0 ? null : 'Server version kept — field edit merged manually',
        resolvedAt: i === 1 ? daysAgo(1) : null,
        createdAt: daysAgo(i + 1),
      },
    });
    await prisma.offlineSyncQueue.update({
      where: { id: queueIds[i] },
      data: { status: OfflineSyncStatus.Conflict },
    });
  }

  console.log('[seed] Offline sync: multi-device queue, 2 conflicts, 1 failed row');
}

async function seedPublicPortal(geo: Awaited<ReturnType<typeof seedGeo>>) {
  if ((await prisma.publicFeedback.count()) >= 5) return;

  const citizens = await prisma.citizen.findMany({ take: 10 });
  const departments = await prisma.department.findMany({ take: 5 });
  const webIssues = [
    { title: 'Street light repair request', cat: 'Civic', desc: 'Lights not working near community hall.' },
    { title: 'Water tanker scheduling', cat: 'Water', desc: 'Need regular tanker supply in summer.' },
    { title: 'Ration card name correction', cat: 'Revenue', desc: 'Spelling error on family ration card.' },
    { title: 'Drainage overflow complaint', cat: 'Sanitation', desc: 'Sewage backing up after rains.' },
    { title: 'School fee reimbursement query', cat: 'Education', desc: 'Status of fee reimbursement application.' },
    { title: 'Pension not credited', cat: 'Welfare', desc: 'Old age pension missing this month.' },
    { title: 'Road repair near temple', cat: 'Roads', desc: 'Damaged road causing accidents.' },
    { title: 'PHC appointment delay', cat: 'Health', desc: 'Long wait times at primary health centre.' },
    { title: 'Bus stop shelter needed', cat: 'Transport', desc: 'No shelter at main village bus stop.' },
    { title: 'Street vendor permit inquiry', cat: 'Municipal', desc: 'Process for temporary vending permit.' },
  ];
  const statuses: GrievanceStatus[] = ['Open', 'Assigned', 'InProgress', 'Resolved'];

  for (let i = 0; i < 10; i++) {
    const issue = webIssues[i];
    const citizen = pick(citizens, i);
    const dept = pick(departments, i);

    await prisma.grievance.create({
      data: {
        code: `WEB-${1001 + i}`,
        title: issue.title,
        description: issue.desc,
        category: issue.cat,
        channel: GrievanceChannel.Web,
        priority: pick([GrievancePriority.High, GrievancePriority.Medium, GrievancePriority.Low], i),
        status: pick(statuses, i),
        citizenId: citizen?.id,
        reportedByName: citizen?.name ?? `Web Citizen ${i + 1}`,
        reportedByMobile: citizen?.mobile ?? `95${String(74000000 + i).slice(-8)}`,
        departmentId: dept?.id,
        villageId: citizen?.villageId ?? pick(geo.villages, i).id,
        mandalId: citizen?.mandalId ?? pick(geo.mandals, i).id,
        constituencyId: geo.constituency.id,
        createdAt: daysAgo(i % 14),
      },
    });
  }

  for (let i = 0; i < 5; i++) {
    await prisma.publicFeedback.create({
      data: {
        name: pick(['Citizen', 'Rama Rao', 'Lakshmi Devi', 'Venkat Reddy', 'Anonymous'], i),
        mobile: `94${String(75000000 + i).slice(-8)}`,
        message: pick([
          'Great initiative on grievance redressal',
          'Website is easy to use',
          'Need Telugu language option',
          'Response time could be faster',
          'Thank you for the health camp',
        ], i),
        createdAt: daysAgo(i % 10),
      },
    });
  }

  for (let i = 0; i < 5; i++) {
    await prisma.volunteerRegistration.create({
      data: {
        name: pick(['Field Volunteer', 'Youth Volunteer', 'Women Wing Volunteer', 'Booth Agent', 'Campaign Helper'], i),
        mobile: `93${String(76000000 + i).slice(-8)}`,
        village: pick(geo.villages, i).name,
        status: pick(['Pending', 'Approved', 'Rejected'], i),
        createdAt: daysAgo(i % 7),
      },
    });
  }

  const events = await prisma.event.findMany({ take: 4, orderBy: { startAt: 'asc' } });
  for (let i = 0; i < 8; i++) {
    const event = events[i % Math.max(events.length, 1)];
    if (!event) break;
    await prisma.publicEventRegistration.create({
      data: {
        eventId: event.id,
        name: pick(['Public Attendee', 'Ravi Kumar', 'Sujatha Naidu', 'Krishna Murthy'], i),
        mobile: `92${String(77000000 + i).slice(-8)}`,
        createdAt: daysAgo(i % 5),
      },
    });
  }

  console.log('[seed] Public portal: 10 web grievances, 5 feedback, 5 volunteers, event registrations');
}

async function seedGrievanceSlaViolations() {
  const validationHours = 48;
  const now = new Date();

  await prisma.temporaryGrievance.updateMany({
    where: {
      validationDueAt: null,
      validationStatus: { in: ['New', 'PendingValidation', 'MoreInfoRequired'] },
    },
    data: {
      validationDueAt: new Date(now.getTime() + validationHours * 60 * 60 * 1000),
    },
  });

  const pendingForDemo = await prisma.temporaryGrievance.findMany({
    where: { validationStatus: { in: ['New', 'PendingValidation', 'MoreInfoRequired'] } },
    take: 6,
  });
  for (let i = 0; i < pendingForDemo.length; i++) {
    if (i % 2 === 0) {
      await prisma.temporaryGrievance.update({
        where: { id: pendingForDemo[i].id },
        data: { validationDueAt: daysAgo(2 + (i % 4)) },
      });
    }
  }

  const overdueTemps = await prisma.temporaryGrievance.findMany({
    where: {
      validationStatus: { in: ['New', 'PendingValidation', 'MoreInfoRequired'] },
      validationDueAt: { lt: now },
    },
    take: 10,
  });

  const overdueGrievances = await prisma.grievance.findMany({
    where: {
      status: { in: ['Open', 'Assigned', 'InProgress', 'Escalated'] },
      slaDueAt: { lt: now },
    },
    take: 15,
  });

  for (const temp of overdueTemps) {
    const overdueDays = Math.max(1, Math.ceil((now.getTime() - temp.validationDueAt!.getTime()) / 86400000));
    await prisma.grievanceSlaViolation.upsert({
      where: { dedupeKey: `validation-${temp.id}` },
      update: { overdueDays, slaDueAt: temp.validationDueAt!, status: GrievanceSlaViolationStatus.Open },
      create: {
        type: GrievanceSlaViolationType.Validation,
        tempGrievanceId: temp.id,
        slaDueAt: temp.validationDueAt!,
        overdueDays,
        dedupeKey: `validation-${temp.id}`,
        breachedAt: temp.validationDueAt!,
        lastNotifiedAt: now,
      },
    });
  }

  for (const g of overdueGrievances) {
    const overdueDays = Math.max(1, Math.ceil((now.getTime() - g.slaDueAt!.getTime()) / 86400000));
    await prisma.grievanceSlaViolation.upsert({
      where: { dedupeKey: `resolution-${g.id}` },
      update: { overdueDays, slaDueAt: g.slaDueAt!, status: GrievanceSlaViolationStatus.Open },
      create: {
        type: GrievanceSlaViolationType.Resolution,
        grievanceId: g.id,
        slaDueAt: g.slaDueAt!,
        overdueDays,
        dedupeKey: `resolution-${g.id}`,
        breachedAt: g.slaDueAt!,
        lastNotifiedAt: now,
      },
    });
  }

  const leaders = await prisma.user.findMany({
    where: {
      role: { name: { in: ['SuperAdmin', 'StateLeader', 'DistrictLeader', 'ConstituencyIncharge'] } },
      status: 'Active',
    },
    select: { id: true },
  });

  const totalBreached = overdueTemps.length + overdueGrievances.length;
  if (totalBreached > 0 && leaders.length) {
    const existing = await prisma.notification.findFirst({
      where: { title: { contains: 'SLA breach summary' } },
    });
    if (!existing) {
      for (const leader of leaders) {
        await prisma.notification.create({
          data: {
            userId: leader.id,
            type: NotificationType.Alert,
            title: 'Grievance SLA breach summary',
            body: `${overdueGrievances.length} resolution and ${overdueTemps.length} validation grievances are overdue. Review the SLA tracker.`,
            link: '/grievances/sla-tracker',
          },
        });
      }
    }
  }

  console.log(
    `[seed] SLA violations: ${overdueTemps.length} validation + ${overdueGrievances.length} resolution (notified ${leaders.length} leaders)`,
  );
}

async function seedAdvancedModules(_geo: Awaited<ReturnType<typeof seedGeo>>) {
  // Module-specific seeds moved to dedicated functions above; kept as no-op fallback.
}

async function main() {
  console.log('[seed] Starting Praja Connect seed...');
  await seedSettings();
  const roleIds = await seedRolesAndPermissions();
  const geo = await seedGeo();
  await seedUsers(roleIds, geo);
  const depts = await seedDepartmentsAndOfficials();
  await seedCadres(geo);
  await seedCitizens(geo);
  await seedGrievances(geo, depts);
  await seedTemporaryGrievances();
  await seedSchemes();
  await seedEvents(geo);
  await seedSurveys();
  await seedD2D(geo);
  await seedProjects(geo, depts);
  await seedWhatsApp();
  await seedNotifications();
  await seedCommittees(geo);
  await seedActivities(geo);
  await seedAssets(geo);
  await seedElection(geo);
  await seedVoterIntelligence();
  await seedWarRoom(geo);
  await seedAttendance(geo);
  await seedFundraising();
  await seedMedia();
  await seedPrManagement();
  await seedManifesto();
  await seedCrisis(geo);
  await seedLeaderOffice();
  await seedSecurityAudit();
  await seedOfflineSync();
  await seedPublicPortal(geo);
  await seedAdvancedModules(geo);
  await seedCompliance();
  await seedDocuments();
  await seedCallCenter();
  await seedDataQuality();
  await seedGrievanceSlaViolations();
  console.log('[seed] Done. Demo login: leader@praja.in / Praja@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
