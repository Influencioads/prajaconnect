'use client';

import { ActivityType } from '@praja/types';
import { ActivitiesView } from '@/components/crm/activities-view';

export default function CallsPage() {
  return (
    <ActivitiesView
      title="Calls"
      description="Incoming, outgoing and missed calls with recordings, duration, outcome and follow-up reminders."
      lockedType={ActivityType.Call}
    />
  );
}
