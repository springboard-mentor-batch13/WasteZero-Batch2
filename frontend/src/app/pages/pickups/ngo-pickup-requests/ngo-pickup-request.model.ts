export type NgoPickupStatus =
  | 'Pending'
  | 'Accepted'
  | 'In Progress'
  | 'Waiting for NGO Approval'
  | 'Proof Rejected'
  | 'Unfinished Pickup'
  | 'Rescheduled'
  | 'Rejected'
  | 'Completed'
  | 'Cancelled'
  | 'Withdrawn';

export type PickupApiStatus =
  | 'Pending'
  | 'Assigned'
  | 'Accepted'
  | 'In Progress'
  | 'Waiting for NGO Approval'
  | 'Proof Rejected'
  | 'Unfinished Pickup'
  | 'Rescheduled'
  | 'Rejected'
  | 'Completed'
  | 'Cancelled'
  | 'Withdrawn';

export interface NgoPickupRequest {

  id: string;

  volunteerName: string;

  volunteerPhone: string;

  wasteType: string;

  pickupAddress: string;

  pickupArea: string;

  pickupDate: string;

  pickupTime: string;

  notes: string;

  status: NgoPickupStatus;

  createdAt: string;

  volunteerId?: string;

  backendStatus?: PickupApiStatus;

  proofImage?: string;

  completionRemarks?: string;

}

export const NGO_PICKUP_STATUSES: Array<NgoPickupStatus | 'All'> = [

  'All',

  'Pending',

  'Accepted',

  'In Progress',

  'Waiting for NGO Approval',

  'Proof Rejected',

  'Unfinished Pickup',

  'Rescheduled',

  'Rejected',

  'Completed',

  'Cancelled',

  'Withdrawn',

];

export const NGO_PICKUP_WASTE_TYPES = [

  'All',

  'Plastic',

  'Paper',

  'Glass',

  'Metal',

  'Organic',

  'E-Waste',

  'Mixed',

];