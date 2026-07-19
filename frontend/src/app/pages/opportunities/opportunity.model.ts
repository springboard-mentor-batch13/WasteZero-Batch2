export interface Opportunity {
  id: string;
  title: string;
  category: OpportunityCategory;
  description: string;
  location: string;
  eventDate: string;
  requiredVolunteers: number;
  skillsRequired: string[];
  imageUrl?: string;
  status: string;
  createdAt?: string;
  ngoId?: string;
  duration?: string;
  postedBy?: {
    _id?: string;
    name?: string;
    email?: string;
  } | string;
  imageFile?: File;
  imagePreviewUrl?: string;
}

export type OpportunityCategory =
  | 'Environment'
  | 'Healthcare'
  | 'Education'
  | 'Animal Welfare'
  | 'Community Service';

export type OpportunityStatus = 'Open' | 'In Progress' | 'Closed';

export type OpportunityDraft = Omit<Opportunity, 'id' | 'category' | 'imagePreviewUrl' | 'status'> & {
  status: OpportunityStatus;
  removeImage?: boolean;
};

export const OPPORTUNITY_CATEGORIES: OpportunityCategory[] = [
  'Environment',
  'Healthcare',
  'Education',
  'Animal Welfare',
  'Community Service'
];

export const OPPORTUNITY_STATUSES: OpportunityStatus[] = ['Open', 'In Progress', 'Closed'];
