export type OpportunityStatus = 'Open' | 'In Progress' | 'Closed';

export interface PostedBy {
  _id?: string;
  name?: string;
  email?: string;
}

export interface Opportunity {
  id: string;
  ngoId?: string;
  postedBy?: PostedBy | string;
  title: string;
  description: string;
  requiredSkills: string[];
  duration: string;
  city: string;
  state: string;
  date: Date;
  status: OpportunityStatus;
  imageUrl?: string;
  createdAt?: string;
  imageFile?: File;
  imagePreviewUrl?: string;
}

export type OpportunityDraft = Omit<Opportunity, 'id' | 'ngoId' | 'postedBy' | 'createdAt' | 'imagePreviewUrl'> & {
  removeImage?: boolean;
};

export interface StateCityOption {
  state: string;
  cities: string[];
}

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
