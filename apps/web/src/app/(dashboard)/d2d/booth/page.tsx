'use client';

import { D2DSurveyType } from '@praja/types';
import { D2DSurveyTable } from '@/components/crm/d2d-views';

export default function D2DBoothPage() {
  return (
    <D2DSurveyTable
      type={D2DSurveyType.ElectionSentiment}
      title="Booth Survey"
      description="Booth-wise coverage and sentiment surveys for field teams."
    />
  );
}
