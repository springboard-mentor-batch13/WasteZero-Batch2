export interface Opportunity {
  id: string;
  title: string;
  category: OpportunityCategory;
  description: string;
  location: string;
  eventDate: string;
  requiredVolunteers: number;
  skillsRequired: string[];
  imageFile?: File;
  imagePreviewUrl?: string;
}

export type OpportunityCategory =
  | 'Environment'
  | 'Healthcare'
  | 'Education'
  | 'Animal Welfare'
  | 'Community Service';

export type OpportunityDraft = Omit<Opportunity, 'id' | 'imagePreviewUrl'> & {
  removeImage?: boolean;
};

export const OPPORTUNITY_CATEGORIES: OpportunityCategory[] = [
  'Environment',
  'Healthcare',
  'Education',
  'Animal Welfare',
  'Community Service'
];