export type OpportunityStatus = 'Open' | 'In Progress' | 'Closed';
export type OpportunityCategory = 'Environment' | 'Healthcare' | 'Education' | 'Animal Welfare' | 'Community Service';

export interface PostedBy {
  _id?: string;
  name?: string;
  email?: string;
  role?: 'Volunteer' | 'NGO' | 'Admin' | string;
}

export interface Opportunity {
  id: string;
  ngoId?: string;
  postedBy?: PostedBy | string;
  title: string;
  category: OpportunityCategory | string;
  description: string;
  requiredSkills: string[];
  skillsRequired: string[];
  duration: string;
  city: string;
  state: string;
  date: Date;
  eventDate: string;
  location: string;
  requiredVolunteers: number;
  status: OpportunityStatus;
  imageUrl?: string;
  imagePreviewUrl?: string;
  imageFile?: File;
  createdAt?: string;
}

export type OpportunityDraft = Omit<Opportunity, 'id' | 'ngoId' | 'postedBy' | 'createdAt' | 'imagePreviewUrl' | 'skillsRequired' | 'location' | 'eventDate'> & {
  location?: string;
  eventDate?: string;
  skillsRequired?: string[];
  removeImage?: boolean;
};

export interface OpportunityApplication {
  fullName: string;
  email: string;
  phoneNumber: string;
  motivation: string;
  relevantSkills: string;
  availability: string;
}

export interface StateCityOption {
  state: string;
  cities: string[];
}

export const OPPORTUNITY_CATEGORIES: OpportunityCategory[] = [
  'Environment',
  'Healthcare',
  'Education',
  'Animal Welfare',
  'Community Service'
];

export const OPPORTUNITY_STATUSES: OpportunityStatus[] = ['Open', 'In Progress', 'Closed'];

export const OPPORTUNITY_STATE_CITIES: StateCityOption[] = [
  { state: 'Andhra Pradesh', cities: ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore'] },
  { state: 'Delhi', cities: ['New Delhi', 'Delhi'] },
  { state: 'Gujarat', cities: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot'] },
  { state: 'Karnataka', cities: ['Bengaluru', 'Mysuru', 'Mangaluru', 'Hubballi'] },
  { state: 'Kerala', cities: ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur'] },
  { state: 'Maharashtra', cities: ['Mumbai', 'Pune', 'Nagpur', 'Nashik'] },
  { state: 'Rajasthan', cities: ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota'] },
  { state: 'Tamil Nadu', cities: ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli'] },
  { state: 'Telangana', cities: ['Hyderabad', 'Warangal', 'Karimnagar', 'Nizamabad'] },
  { state: 'Uttar Pradesh', cities: ['Lucknow', 'Kanpur', 'Noida', 'Varanasi'] },
  { state: 'West Bengal', cities: ['Kolkata', 'Howrah', 'Durgapur', 'Siliguri'] },
];
