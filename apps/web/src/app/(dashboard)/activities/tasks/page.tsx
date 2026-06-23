'use client';

import { ActivityType } from '@praja/types';
import { ActivitiesView } from '@/components/crm/activities-view';

export default function TasksPage() {
  return (
    <ActivitiesView
      title="Tasks"
      description="Personal, team and cadre tasks with priority, due dates and status tracking."
      lockedType={ActivityType.Task}
    />
  );
}
