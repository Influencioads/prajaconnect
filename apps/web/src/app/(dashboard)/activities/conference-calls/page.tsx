'use client';

import { ActivityType } from '@praja/types';
import { ActivitiesView } from '@/components/crm/activities-view';

export default function ConferenceCallsPage() {
  return (
    <ActivitiesView
      title="Conference Calls"
      description="Scheduled multi-participant calls, leadership and committee meetings with attendance and notes."
      lockedType={ActivityType.ConferenceCall}
    />
  );
}
