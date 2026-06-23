'use client';

import { ActivityType } from '@praja/types';
import { ActivitiesView } from '@/components/crm/activities-view';

export default function MeetingsPage() {
  return (
    <ActivitiesView
      title="Meetings / Visits"
      description="Constituency visits, official and public meetings, field and door-to-door visits with geo-tagged reports."
      typeOptions={[
        ActivityType.Meeting,
        ActivityType.Visit,
        ActivityType.OfficialMeeting,
        ActivityType.FieldVisit,
        ActivityType.DoorToDoor,
        ActivityType.BoothActivity,
      ]}
    />
  );
}
