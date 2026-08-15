/**
 * Shared scheme-eligibility evaluation, used by both the manual
 * POST /schemes/eligibility check and the nightly proactive matcher.
 */
export interface EligibilityRule {
  minAge?: number;
  maxAge?: number;
  incomeBelow?: number;
  occupation?: string;
  hasSchoolChild?: boolean;
  ownsHouse?: boolean;
}

export interface EligibilityInput {
  age?: number;
  income?: number;
  occupation?: string;
  hasSchoolChild?: boolean;
  ownsHouse?: boolean;
}

export interface EligibilityEvaluation {
  eligible: boolean;
  reasons: string[];
  /** Criteria that affirmatively matched with provided data (for scoring). */
  matched: string[];
  /** Number of criteria defined on the rule. */
  totalCriteria: number;
}

export function evaluateEligibility(rule: EligibilityRule, input: EligibilityInput): EligibilityEvaluation {
  const reasons: string[] = [];
  const matched: string[] = [];
  let eligible = true;
  let totalCriteria = 0;

  if (rule.minAge != null) {
    totalCriteria += 1;
    if (input.age == null) reasons.push(`Requires age ≥ ${rule.minAge} (not provided)`);
    else if (input.age < rule.minAge) {
      eligible = false;
      reasons.push(`Age ${input.age} below minimum ${rule.minAge}`);
    } else matched.push('minAge');
  }
  if (rule.maxAge != null) {
    totalCriteria += 1;
    if (input.age != null && input.age > rule.maxAge) {
      eligible = false;
      reasons.push(`Age ${input.age} above maximum ${rule.maxAge}`);
    } else if (input.age != null) matched.push('maxAge');
  }
  if (rule.incomeBelow != null) {
    totalCriteria += 1;
    if (input.income == null) reasons.push(`Requires income < ₹${rule.incomeBelow} (not provided)`);
    else if (input.income >= rule.incomeBelow) {
      eligible = false;
      reasons.push(`Income ₹${input.income} exceeds limit ₹${rule.incomeBelow}`);
    } else matched.push('incomeBelow');
  }
  if (rule.occupation != null) {
    totalCriteria += 1;
    if (!input.occupation) reasons.push(`Requires occupation "${rule.occupation}"`);
    else if (input.occupation.toLowerCase() !== rule.occupation.toLowerCase()) {
      eligible = false;
      reasons.push(`Occupation must be ${rule.occupation}`);
    } else matched.push('occupation');
  }
  if (rule.hasSchoolChild === true) {
    totalCriteria += 1;
    if (input.hasSchoolChild !== true) {
      eligible = false;
      reasons.push('Requires a school-going child');
    } else matched.push('hasSchoolChild');
  }
  if (rule.ownsHouse === false) {
    totalCriteria += 1;
    if (input.ownsHouse === true) {
      eligible = false;
      reasons.push('Only for families without a pucca house');
    } else if (input.ownsHouse === false) matched.push('ownsHouse');
  }

  if (eligible && reasons.length === 0) reasons.push('Meets all criteria');

  return { eligible, reasons, matched, totalCriteria };
}
