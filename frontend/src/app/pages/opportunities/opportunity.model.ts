export interface Opportunity {
  id: number;
  title: string;
  category: OpportunityCategory;
  description: string;
  location: string;
  eventDate: string;
  requiredVolunteers: number;
  skillsRequired: string[];
}

export type OpportunityCategory =
  | 'Environment'
  | 'Healthcare'
  | 'Education'
  | 'Animal Welfare'
  | 'Community Service';

export type OpportunityDraft = Omit<Opportunity, 'id'>;

export const OPPORTUNITY_CATEGORIES: OpportunityCategory[] = [
  'Environment',
  'Healthcare',
  'Education',
  'Animal Welfare',
  'Community Service'
];
