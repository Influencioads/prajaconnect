'use client';

import { D2DSurveyType } from '@praja/types';
import { D2DSurveyTable } from '@/components/crm/d2d-views';

export default function D2DVoterPage() {
  return (
    <D2DSurveyTable
      type={D2DSurveyType.Voter}
      title="Voter Survey"
      description="Voter-level political sentiment and preference tracking surveys."
    />
  );
}
