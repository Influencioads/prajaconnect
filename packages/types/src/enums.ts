export enum UserRole {
  SuperAdmin = 'SuperAdmin',
  StateLeader = 'StateLeader',
  DistrictLeader = 'DistrictLeader',
  ConstituencyIncharge = 'ConstituencyIncharge',
  MandalCoordinator = 'MandalCoordinator',
  BoothCoordinator = 'BoothCoordinator',
  Volunteer = 'Volunteer',
  GovernmentOfficial = 'GovernmentOfficial',
  Citizen = 'Citizen',
}

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.SuperAdmin]: 'Super Admin',
  [UserRole.StateLeader]: 'State Leader',
  [UserRole.DistrictLeader]: 'District Leader',
  [UserRole.ConstituencyIncharge]: 'Constituency Incharge',
  [UserRole.MandalCoordinator]: 'Mandal Coordinator',
  [UserRole.BoothCoordinator]: 'Booth Coordinator',
  [UserRole.Volunteer]: 'Volunteer',
  [UserRole.GovernmentOfficial]: 'Government Official',
  [UserRole.Citizen]: 'Citizen',
};

/** Higher number = more authority. Used for simple hierarchy checks. */
export const ROLE_RANK: Record<UserRole, number> = {
  [UserRole.SuperAdmin]: 100,
  [UserRole.StateLeader]: 90,
  [UserRole.DistrictLeader]: 80,
  [UserRole.ConstituencyIncharge]: 70,
  [UserRole.MandalCoordinator]: 60,
  [UserRole.BoothCoordinator]: 50,
  [UserRole.Volunteer]: 40,
  [UserRole.GovernmentOfficial]: 45,
  [UserRole.Citizen]: 10,
};

export enum UserStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Suspended = 'Suspended',
}

export enum AccessLevel {
  none = 'none',
  view = 'view',
  edit = 'edit',
  full = 'full',
}

export enum ModuleKey {
  Dashboard = 'dashboard',
  Cadre = 'cadre',
  Committees = 'committees',
  Citizens = 'citizens',
  Grievances = 'grievances',
  Officials = 'officials',
  Schemes = 'schemes',
  Whatsapp = 'whatsapp',
  Activities = 'activities',
  Events = 'events',
  Surveys = 'surveys',
  Gis = 'gis',
  DevProjects = 'devprojects',
  Ai = 'ai',
  Reports = 'reports',
  Notifications = 'notifications',
  Assets = 'assets',
  D2D = 'd2d',
  TempGrievances = 'tempgrievances',
  Election = 'election',
  Admin = 'admin',
  VoterIntelligence = 'voterintelligence',
  WarRoom = 'warroom',
  Attendance = 'attendance',
  Fundraising = 'fundraising',
  Compliance = 'compliance',
  Media = 'media',
  Manifesto = 'manifesto',
  Crisis = 'crisis',
  Documents = 'documents',
  CallCenter = 'callcenter',
  DataQuality = 'dataquality',
  PublicPortal = 'publicportal',
  LeaderOffice = 'leaderoffice',
  SecurityAudit = 'securityaudit',
  OfflineSync = 'offlinesync',
}

export enum D2DSurveyType {
  Household = 'Household',
  Voter = 'Voter',
  Scheme = 'Scheme',
  Grievance = 'Grievance',
  ElectionSentiment = 'ElectionSentiment',
  CandidateFeedback = 'CandidateFeedback',
  DevelopmentWorks = 'DevelopmentWorks',
}

export const D2D_SURVEY_TYPE_LABELS: Record<D2DSurveyType, string> = {
  [D2DSurveyType.Household]: 'Household Survey',
  [D2DSurveyType.Voter]: 'Voter Survey',
  [D2DSurveyType.Scheme]: 'Scheme Survey',
  [D2DSurveyType.Grievance]: 'Grievance Survey',
  [D2DSurveyType.ElectionSentiment]: 'Election Sentiment Survey',
  [D2DSurveyType.CandidateFeedback]: 'Candidate Feedback Survey',
  [D2DSurveyType.DevelopmentWorks]: 'Development Works Survey',
};

export enum D2DSurveyStatus {
  Draft = 'Draft',
  Active = 'Active',
  Paused = 'Paused',
  Completed = 'Completed',
  Closed = 'Closed',
}

export const D2D_SURVEY_STATUS_LABELS: Record<D2DSurveyStatus, string> = {
  [D2DSurveyStatus.Draft]: 'Draft',
  [D2DSurveyStatus.Active]: 'Active',
  [D2DSurveyStatus.Paused]: 'Paused',
  [D2DSurveyStatus.Completed]: 'Completed',
  [D2DSurveyStatus.Closed]: 'Closed',
};

export enum D2DQuestionType {
  Text = 'Text',
  Number = 'Number',
  SingleChoice = 'SingleChoice',
  MultiChoice = 'MultiChoice',
  YesNo = 'YesNo',
  Rating = 'Rating',
  Dropdown = 'Dropdown',
  Photo = 'Photo',
  Location = 'Location',
  Signature = 'Signature',
}

export const D2D_QUESTION_TYPE_LABELS: Record<D2DQuestionType, string> = {
  [D2DQuestionType.Text]: 'Text',
  [D2DQuestionType.Number]: 'Number',
  [D2DQuestionType.SingleChoice]: 'Single Choice',
  [D2DQuestionType.MultiChoice]: 'Multiple Choice',
  [D2DQuestionType.YesNo]: 'Yes / No',
  [D2DQuestionType.Rating]: 'Rating',
  [D2DQuestionType.Dropdown]: 'Dropdown',
  [D2DQuestionType.Photo]: 'Photo Upload',
  [D2DQuestionType.Location]: 'Location Capture',
  [D2DQuestionType.Signature]: 'Signature',
};

export enum D2DSentiment {
  Supporter = 'Supporter',
  Neutral = 'Neutral',
  Opponent = 'Opponent',
  Undecided = 'Undecided',
}

export const D2D_SENTIMENT_LABELS: Record<D2DSentiment, string> = {
  [D2DSentiment.Supporter]: 'Supporter',
  [D2DSentiment.Neutral]: 'Neutral',
  [D2DSentiment.Opponent]: 'Opponent',
  [D2DSentiment.Undecided]: 'Undecided',
};

export enum D2DPriority {
  High = 'High',
  Medium = 'Medium',
  Low = 'Low',
}

export enum D2DSyncStatus {
  Pending = 'Pending',
  Synced = 'Synced',
  Failed = 'Failed',
}

export const D2D_ISSUE_CATEGORIES = [
  'Water',
  'Roads',
  'Drainage',
  'Pension',
  'Ration',
  'HouseSite',
  'Electricity',
  'Health',
  'Education',
  'Employment',
  'LandIssue',
  'Other',
] as const;

export type D2DIssueCategory = (typeof D2D_ISSUE_CATEGORIES)[number];

export const D2D_ISSUE_CATEGORY_LABELS: Record<D2DIssueCategory, string> = {
  Water: 'Water',
  Roads: 'Roads',
  Drainage: 'Drainage',
  Pension: 'Pension',
  Ration: 'Ration',
  HouseSite: 'House Site',
  Electricity: 'Electricity',
  Health: 'Health',
  Education: 'Education',
  Employment: 'Employment',
  LandIssue: 'Land Issue',
  Other: 'Other',
};

export enum AssetCategory {
  Roads = 'Roads',
  Taxes = 'Taxes',
  ReligiousPlaces = 'ReligiousPlaces',
  DevelopmentWorks = 'DevelopmentWorks',
  DealerShops = 'DealerShops',
  BurialGrounds = 'BurialGrounds',
  Hospitals = 'Hospitals',
  Schools = 'Schools',
  DwcraGroups = 'DwcraGroups',
  Tanks = 'Tanks',
  RwsAssets = 'RwsAssets',
  GreenAmbassadors = 'GreenAmbassadors',
  GovernmentOffices = 'GovernmentOffices',
}

export const ASSET_CATEGORY_LABELS: Record<AssetCategory, string> = {
  [AssetCategory.Roads]: 'Constituency Roads',
  [AssetCategory.Taxes]: 'Taxes',
  [AssetCategory.ReligiousPlaces]: 'Religious Places',
  [AssetCategory.DevelopmentWorks]: 'Total Works',
  [AssetCategory.DealerShops]: 'Dealer Shops',
  [AssetCategory.BurialGrounds]: 'Burial Grounds',
  [AssetCategory.Hospitals]: 'Hospitals',
  [AssetCategory.Schools]: 'School Data',
  [AssetCategory.DwcraGroups]: 'MEPMA / DWCRA',
  [AssetCategory.Tanks]: 'Tanks',
  [AssetCategory.RwsAssets]: 'RWS',
  [AssetCategory.GreenAmbassadors]: 'Green Ambassadors',
  [AssetCategory.GovernmentOffices]: 'Government Offices',
};

/** URL slug for each asset category (used in web + mobile routes). */
export const ASSET_CATEGORY_SLUGS: Record<AssetCategory, string> = {
  [AssetCategory.Roads]: 'roads',
  [AssetCategory.Taxes]: 'taxes',
  [AssetCategory.ReligiousPlaces]: 'religious-places',
  [AssetCategory.DevelopmentWorks]: 'total-works',
  [AssetCategory.DealerShops]: 'dealer-shops',
  [AssetCategory.BurialGrounds]: 'burial-grounds',
  [AssetCategory.Hospitals]: 'hospitals',
  [AssetCategory.Schools]: 'schools',
  [AssetCategory.DwcraGroups]: 'mepma-dwcra',
  [AssetCategory.Tanks]: 'tanks',
  [AssetCategory.RwsAssets]: 'rws',
  [AssetCategory.GreenAmbassadors]: 'green-ambassadors',
  [AssetCategory.GovernmentOffices]: 'government-offices',
};

export enum AssetStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  UnderMaintenance = 'UnderMaintenance',
  UnderDevelopment = 'UnderDevelopment',
  Decommissioned = 'Decommissioned',
}

export enum AssetCondition {
  Good = 'Good',
  Fair = 'Fair',
  Damaged = 'Damaged',
  Critical = 'Critical',
}

export enum GrievanceChannel {
  WhatsApp = 'WhatsApp',
  Voice = 'Voice',
  Field = 'Field',
  Web = 'Web',
  Mobile = 'Mobile',
}

export enum GrievancePriority {
  High = 'High',
  Medium = 'Medium',
  Low = 'Low',
}

export enum GrievanceStatus {
  Open = 'Open',
  Assigned = 'Assigned',
  InProgress = 'InProgress',
  Escalated = 'Escalated',
  Resolved = 'Resolved',
  Closed = 'Closed',
}

export enum TempGrievanceSource {
  Call = 'Call',
  CampaignCall = 'CampaignCall',
  ConferenceCall = 'ConferenceCall',
  WhatsApp = 'WhatsApp',
  WhatsAppBot = 'WhatsAppBot',
  D2DSurvey = 'D2DSurvey',
  Email = 'Email',
  SMS = 'SMS',
  FieldVisit = 'FieldVisit',
  VolunteerNote = 'VolunteerNote',
  Manual = 'Manual',
}

export const TEMP_GRIEVANCE_SOURCE_LABELS: Record<TempGrievanceSource, string> = {
  [TempGrievanceSource.Call]: 'Call',
  [TempGrievanceSource.CampaignCall]: 'Campaign Call',
  [TempGrievanceSource.ConferenceCall]: 'Conference Call',
  [TempGrievanceSource.WhatsApp]: 'WhatsApp',
  [TempGrievanceSource.WhatsAppBot]: 'WhatsApp Bot',
  [TempGrievanceSource.D2DSurvey]: 'D2D Survey',
  [TempGrievanceSource.Email]: 'Email',
  [TempGrievanceSource.SMS]: 'SMS',
  [TempGrievanceSource.FieldVisit]: 'Field Visit',
  [TempGrievanceSource.VolunteerNote]: 'Volunteer Note',
  [TempGrievanceSource.Manual]: 'Manual Entry',
};

export enum TempGrievanceStatus {
  New = 'New',
  PendingValidation = 'PendingValidation',
  MoreInfoRequired = 'MoreInfoRequired',
  Validated = 'Validated',
  Converted = 'Converted',
  Duplicate = 'Duplicate',
  Rejected = 'Rejected',
  Archived = 'Archived',
}

export const TEMP_GRIEVANCE_STATUS_LABELS: Record<TempGrievanceStatus, string> = {
  [TempGrievanceStatus.New]: 'New',
  [TempGrievanceStatus.PendingValidation]: 'Pending Validation',
  [TempGrievanceStatus.MoreInfoRequired]: 'More Info Required',
  [TempGrievanceStatus.Validated]: 'Validated',
  [TempGrievanceStatus.Converted]: 'Converted',
  [TempGrievanceStatus.Duplicate]: 'Duplicate',
  [TempGrievanceStatus.Rejected]: 'Rejected',
  [TempGrievanceStatus.Archived]: 'Archived',
};

export enum TempGrievancePriority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Critical = 'Critical',
}

export const TEMP_GRIEVANCE_PRIORITY_LABELS: Record<TempGrievancePriority, string> = {
  [TempGrievancePriority.Low]: 'Low',
  [TempGrievancePriority.Medium]: 'Medium',
  [TempGrievancePriority.High]: 'High',
  [TempGrievancePriority.Critical]: 'Critical',
};

export enum DuplicateRisk {
  None = 'None',
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
}

export enum CadreStatus {
  Active = 'Active',
  OnLeave = 'OnLeave',
  Inactive = 'Inactive',
}

export enum OfficialLevel {
  Booth = 'Booth',
  Village = 'Village',
  Mandal = 'Mandal',
  Constituency = 'Constituency',
  District = 'District',
  State = 'State',
}

export enum Gender {
  Male = 'Male',
  Female = 'Female',
  Other = 'Other',
}

export enum CitizenStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Deceased = 'Deceased',
  Migrated = 'Migrated',
}

export enum SchemeStatus {
  Active = 'Active',
  Upcoming = 'Upcoming',
  Closed = 'Closed',
}

export enum WhatsAppStatus {
  Queued = 'Queued',
  Sent = 'Sent',
  Delivered = 'Delivered',
  Read = 'Read',
  Failed = 'Failed',
}

export enum AuditAction {
  Login = 'Login',
  Logout = 'Logout',
  Create = 'Create',
  Update = 'Update',
  Delete = 'Delete',
  Export = 'Export',
  Assign = 'Assign',
  Escalate = 'Escalate',
}

export enum BeneficiaryStatus {
  Enrolled = 'Enrolled',
  Pending = 'Pending',
  Rejected = 'Rejected',
  Disbursed = 'Disbursed',
}

export enum ProjectStatus {
  Planning = 'Planning',
  InProgress = 'InProgress',
  Completed = 'Completed',
  Delayed = 'Delayed',
}

export enum EventType {
  Rally = 'Rally',
  Camp = 'Camp',
  Meeting = 'Meeting',
  Awareness = 'Awareness',
  Other = 'Other',
}

export enum EventStatus {
  Scheduled = 'Scheduled',
  Ongoing = 'Ongoing',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}

export enum SurveyStatus {
  Draft = 'Draft',
  Active = 'Active',
  Closed = 'Closed',
}

export enum NotificationType {
  Info = 'Info',
  Warning = 'Warning',
  Alert = 'Alert',
  Success = 'Success',
}

export enum WhatsAppDirection {
  Inbound = 'Inbound',
  Outbound = 'Outbound',
}

export enum ActivityType {
  Call = 'Call',
  CampaignCall = 'CampaignCall',
  ConferenceCall = 'ConferenceCall',
  WhatsApp = 'WhatsApp',
  Email = 'Email',
  Meeting = 'Meeting',
  Visit = 'Visit',
  Task = 'Task',
  VolunteerActivity = 'VolunteerActivity',
  CadreActivity = 'CadreActivity',
  GrievanceFollowup = 'GrievanceFollowup',
  EventActivity = 'EventActivity',
  SurveyActivity = 'SurveyActivity',
  SocialMedia = 'SocialMedia',
  PressInteraction = 'PressInteraction',
  InfluencerInteraction = 'InfluencerInteraction',
  OfficialMeeting = 'OfficialMeeting',
  FieldVisit = 'FieldVisit',
  DoorToDoor = 'DoorToDoor',
  BoothActivity = 'BoothActivity',
  SmsCampaign = 'SmsCampaign',
  VoiceBroadcast = 'VoiceBroadcast',
}

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  [ActivityType.Call]: 'Call',
  [ActivityType.CampaignCall]: 'Campaign Call',
  [ActivityType.ConferenceCall]: 'Conference Call',
  [ActivityType.WhatsApp]: 'WhatsApp',
  [ActivityType.Email]: 'Email',
  [ActivityType.Meeting]: 'Meeting',
  [ActivityType.Visit]: 'Visit',
  [ActivityType.Task]: 'Task',
  [ActivityType.VolunteerActivity]: 'Volunteer Activity',
  [ActivityType.CadreActivity]: 'Cadre Activity',
  [ActivityType.GrievanceFollowup]: 'Grievance Follow-up',
  [ActivityType.EventActivity]: 'Event Activity',
  [ActivityType.SurveyActivity]: 'Survey Activity',
  [ActivityType.SocialMedia]: 'Social Media Activity',
  [ActivityType.PressInteraction]: 'Press Interaction',
  [ActivityType.InfluencerInteraction]: 'Influencer Interaction',
  [ActivityType.OfficialMeeting]: 'Official Meeting',
  [ActivityType.FieldVisit]: 'Field Visit',
  [ActivityType.DoorToDoor]: 'Door-to-Door Campaign',
  [ActivityType.BoothActivity]: 'Booth Activity',
  [ActivityType.SmsCampaign]: 'SMS Campaign',
  [ActivityType.VoiceBroadcast]: 'Voice Broadcast',
};

export enum ActivityStatus {
  Planned = 'Planned',
  Scheduled = 'Scheduled',
  InProgress = 'InProgress',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
  NoResponse = 'NoResponse',
  FollowUp = 'FollowUp',
}

export enum ActivityDirection {
  Inbound = 'Inbound',
  Outbound = 'Outbound',
  Missed = 'Missed',
}

export enum ActivityPriority {
  High = 'High',
  Medium = 'Medium',
  Low = 'Low',
}

export enum CampaignType {
  CampaignCall = 'CampaignCall',
  SmsCampaign = 'SmsCampaign',
  VoiceBroadcast = 'VoiceBroadcast',
  EmailCampaign = 'EmailCampaign',
  DoorToDoor = 'DoorToDoor',
  FieldOutreach = 'FieldOutreach',
}

export enum CampaignStatus {
  Draft = 'Draft',
  Active = 'Active',
  Paused = 'Paused',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}

export enum ParticipantStatus {
  Invited = 'Invited',
  Confirmed = 'Confirmed',
  Attended = 'Attended',
  Absent = 'Absent',
  Declined = 'Declined',
}

export enum CommitteeCategory {
  MandalCommittee = 'MandalCommittee',
  VillageCommittee = 'VillageCommittee',
  CoordinationCommittee = 'CoordinationCommittee',
  MandalCoordinationCommittee = 'MandalCoordinationCommittee',
}

export const COMMITTEE_CATEGORY_LABELS: Record<CommitteeCategory, string> = {
  [CommitteeCategory.MandalCommittee]: 'Mandal Committee',
  [CommitteeCategory.VillageCommittee]: 'Village Committee',
  [CommitteeCategory.CoordinationCommittee]: 'Coordination Committee',
  [CommitteeCategory.MandalCoordinationCommittee]: 'Mandal Coordination Committee',
};

export enum NetworkStatus {
  Active = 'Active',
  Inactive = 'Inactive',
}

export enum NetworkEntityType {
  CommitteeMember = 'CommitteeMember',
  Observer = 'Observer',
  ImpLeader = 'ImpLeader',
  Influencer = 'Influencer',
  Press = 'Press',
}

export enum JournalistType {
  Print = 'Print',
  TV = 'TV',
  Digital = 'Digital',
  YouTube = 'YouTube',
}

// Election Management
export enum ElectionStatus {
  Planning = 'Planning',
  Active = 'Active',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}

export enum ElectionExpenseStatus {
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected',
}

export enum PaymentMode {
  Cash = 'Cash',
  UPI = 'UPI',
  Bank = 'Bank',
  Cheque = 'Cheque',
  Other = 'Other',
}

export enum CampaignWorkType {
  BannerInstallation = 'BannerInstallation',
  WallPainting = 'WallPainting',
  PamphletDistribution = 'PamphletDistribution',
  DoorToDoorCampaign = 'DoorToDoorCampaign',
  VoterSlipDistribution = 'VoterSlipDistribution',
  PublicMeetingSetup = 'PublicMeetingSetup',
  StageWork = 'StageWork',
  SoundSystemSetup = 'SoundSystemSetup',
  VehicleCampaign = 'VehicleCampaign',
  SocialMediaContent = 'SocialMediaContent',
  PressNote = 'PressNote',
  VolunteerMobilization = 'VolunteerMobilization',
  BoothCommitteeWork = 'BoothCommitteeWork',
  PollingAgentAssignment = 'PollingAgentAssignment',
}

export enum CampaignWorkStatus {
  NotStarted = 'NotStarted',
  InProgress = 'InProgress',
  Completed = 'Completed',
  Delayed = 'Delayed',
  Cancelled = 'Cancelled',
}

export enum ElectionVehicleType {
  Car = 'Car',
  Jeep = 'Jeep',
  Auto = 'Auto',
  Bike = 'Bike',
  Van = 'Van',
  Bus = 'Bus',
  CampaignVehicle = 'CampaignVehicle',
  SoundVehicle = 'SoundVehicle',
  MediaVehicle = 'MediaVehicle',
  LogisticsVehicle = 'LogisticsVehicle',
}

export enum ElectionVehicleStatus {
  Available = 'Available',
  Assigned = 'Assigned',
  InTransit = 'InTransit',
  Maintenance = 'Maintenance',
  Inactive = 'Inactive',
}

export enum OutreachChannel {
  DoorToDoor = 'DoorToDoor',
  Call = 'Call',
  WhatsApp = 'WhatsApp',
  SMS = 'SMS',
  PublicMeeting = 'PublicMeeting',
  Other = 'Other',
}

export enum VoterStance {
  Supporter = 'Supporter',
  Neutral = 'Neutral',
  Opponent = 'Opponent',
  Unknown = 'Unknown',
}

export enum VoterPreference {
  Supporter = 'Supporter',
  Neutral = 'Neutral',
  Opponent = 'Opponent',
  Swing = 'Swing',
  Unknown = 'Unknown',
}

export enum CampaignTeamType {
  Mandal = 'Mandal',
  Village = 'Village',
  Booth = 'Booth',
  Media = 'Media',
  SocialMedia = 'SocialMedia',
  Ground = 'Ground',
  Transport = 'Transport',
  Event = 'Event',
  Finance = 'Finance',
}

export enum ElectionMaterialType {
  Pamphlets = 'Pamphlets',
  Posters = 'Posters',
  FlexBanners = 'FlexBanners',
  Flags = 'Flags',
  Caps = 'Caps',
  TShirts = 'TShirts',
  Stickers = 'Stickers',
  VoterSlips = 'VoterSlips',
  IDCards = 'IDCards',
  StageMaterial = 'StageMaterial',
  SoundEquipment = 'SoundEquipment',
  Chairs = 'Chairs',
  WaterBottles = 'WaterBottles',
  FoodPackets = 'FoodPackets',
}

export enum BoothStrength {
  Strong = 'Strong',
  Weak = 'Weak',
  Swing = 'Swing',
}

export enum PollingDayStatus {
  BoothOpened = 'BoothOpened',
  AgentReached = 'AgentReached',
  VotingStarted = 'VotingStarted',
  LowTurnoutAlert = 'LowTurnoutAlert',
  IssueReported = 'IssueReported',
  Resolved = 'Resolved',
  PollingClosed = 'PollingClosed',
  FinalReportSubmitted = 'FinalReportSubmitted',
}

export enum ElectionReportType {
  Expense = 'Expense',
  Booth = 'Booth',
  Vehicle = 'Vehicle',
  CampaignWork = 'CampaignWork',
  TeamPerformance = 'TeamPerformance',
  MaterialDistribution = 'MaterialDistribution',
  VoterOutreach = 'VoterOutreach',
  PollingDay = 'PollingDay',
  MandalWise = 'MandalWise',
  VillageWise = 'VillageWise',
  DailySummary = 'DailySummary',
}

export enum ElectionApprovalAction {
  Approved = 'Approved',
  Rejected = 'Rejected',
  Pending = 'Pending',
}

export enum ElectionWorkPriority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Critical = 'Critical',
}
