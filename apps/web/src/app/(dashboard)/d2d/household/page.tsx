'use client';

import { D2DSurveyType } from '@praja/types';
import { D2DSurveyTable } from '@/components/crm/d2d-views';

export default function D2DHouseholdPage() {
  return (
    <D2DSurveyTable
      type={D2DSurveyType.Household}
      title="Household Survey"
      description="Household-level door-to-door surveys for family mapping and civic feedback."
    />
  );
}
