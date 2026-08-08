export type NgoPickupStatus =
  | 'Pending'
  | 'Accepted'
  | 'In Progress'
  | 'Rescheduled'
  | 'Rejected'
  | 'Completed';

export type PickupApiStatus =
  | 'Pending'
  | 'Assigned'
  | 'Accepted'
  | 'In Progress'
  | 'Rescheduled'
  | 'Rejected'
  | 'Completed'
  | 'Cancelled';

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
}

export const NGO_PICKUP_STATUSES: Array<NgoPickupStatus | 'All'> = [
  'All',
  'Pending',
  'Accepted',
  'In Progress',
  'Rescheduled',
  'Rejected',
  'Completed',
];

export const NGO_PICKUP_WASTE_TYPES = [
  'All',
  'Dry Waste',
  'Wet Waste',
  'Plastic Waste',
  'E-waste',
  'Organic Waste',
  'Mixed Recyclables',
];
