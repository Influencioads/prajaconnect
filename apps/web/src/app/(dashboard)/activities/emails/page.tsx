'use client';

import { ActivityType } from '@praja/types';
import { ActivitiesView } from '@/components/crm/activities-view';

export default function EmailsPage() {
  return (
    <ActivitiesView
      title="Emails"
      description="Inbox, sent, drafts, templates and campaign emails with open and click tracking."
      lockedType={ActivityType.Email}
    />
  );
}
