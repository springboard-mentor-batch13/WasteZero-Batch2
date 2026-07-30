/* ==========================================================
   NOTIFICATION MODEL
   ========================================================== */

export type NotificationType = 'Match' | 'Message' | 'Opportunity' | 'System';
export type NotificationRecipientRole = 'Volunteer' | 'NGO' | 'Admin' | 'All';
export type NotificationSourceRole = 'Volunteer' | 'NGO' | 'Admin' | 'System';
export type RoleNotificationRecipient = Exclude<
  NotificationRecipientRole,
  'All'
>;

export type NotificationDisplayType =
  | 'MatchOpportunity'
  | 'Message'
  | 'NewOpportunity'
  | 'System'
  | 'ApplicationAccepted'
  | 'ApplicationRejected'
  | 'PickupAccepted'
  | 'PickupRejected'
  | 'PickupSchedule'
  | 'DriveCompleted'
  | 'ApplicationsReceived'
  | 'AdminVolunteerApplied'
  | 'AdminNgoCreatedOpportunity';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  redirectUrl?: string;
  sourceRole?: NotificationSourceRole;
  recipientId?: string;
  recipientRole?: NotificationRecipientRole;
  displayType?: NotificationDisplayType;
}

/* ==========================================================
   FILTER OPTIONS
   ========================================================== */

export type NotificationFilter =
  | 'all'
  | 'unread'
  | 'read'
  | 'Match'
  | 'Message'
  | 'Opportunity'
  | 'System';

export interface NotificationFilterOption {
  value: NotificationFilter;
  label: string;
  icon: string;
}

export const NOTIFICATION_FILTERS: NotificationFilterOption[] = [
  { value: 'all', label: 'All', icon: 'notifications' },
  { value: 'unread', label: 'Unread', icon: 'markunread' },
  { value: 'read', label: 'Read', icon: 'mark_email_read' },
  { value: 'Match', label: 'Match', icon: 'volunteer_activism' },
  { value: 'Message', label: 'Message', icon: 'chat' },
  { value: 'Opportunity', label: 'Opportunity', icon: 'campaign' },
  { value: 'System', label: 'System', icon: 'settings' },
];

/* ==========================================================
   TYPE CONFIG - icon, color mapping
   ========================================================== */

export interface NotificationTypeConfig {
  icon: string;
  color: string;
  label: string;
}

export const NOTIFICATION_TYPE_CONFIG: Record<NotificationType, NotificationTypeConfig> = {
  Match: {
    icon: 'handshake',
    color: 'var(--wz-success)',
    label: 'Match',
  },
  Message: {
    icon: 'chat',
    color: 'var(--wz-primary)',
    label: 'Message',
  },
  Opportunity: {
    icon: 'event_available',
    color: 'var(--wz-warning)',
    label: 'Opportunity',
  },
  System: {
    icon: 'settings',
    color: 'var(--wz-text-muted)',
    label: 'System',
  },
};

export const NOTIFICATION_DISPLAY_TYPE_CONFIG: Record<
  NotificationDisplayType,
  NotificationTypeConfig
> = {
  MatchOpportunity: {
    icon: 'handshake',
    color: 'var(--wz-success)',
    label: 'Match Opportunity',
  },
  Message: {
    icon: 'chat',
    color: 'var(--wz-primary)',
    label: 'Message',
  },
  NewOpportunity: {
    icon: 'event_available',
    color: 'var(--wz-warning)',
    label: 'New Opportunity',
  },
  System: {
    icon: 'settings',
    color: 'var(--wz-text-muted)',
    label: 'System',
  },
  ApplicationAccepted: {
    icon: 'assignment_turned_in',
    color: 'var(--wz-success)',
    label: 'Application Accepted',
  },
  ApplicationRejected: {
    icon: 'assignment_late',
    color: 'var(--wz-danger)',
    label: 'Application Rejected',
  },
  PickupAccepted: {
    icon: 'task_alt',
    color: 'var(--wz-success)',
    label: 'Pickup Accepted',
  },
  PickupRejected: {
    icon: 'cancel',
    color: 'var(--wz-danger)',
    label: 'Pickup Rejected',
  },
  PickupSchedule: {
    icon: 'local_shipping',
    color: 'var(--wz-primary)',
    label: 'Pickup Schedule',
  },
  DriveCompleted: {
    icon: 'verified',
    color: 'var(--wz-success)',
    label: 'Drive Completed',
  },
  ApplicationsReceived: {
    icon: 'group_add',
    color: 'var(--wz-primary)',
    label: 'Applications Received',
  },
  AdminVolunteerApplied: {
    icon: 'how_to_reg',
    color: 'var(--wz-primary)',
    label: 'Volunteer Applied',
  },
  AdminNgoCreatedOpportunity: {
    icon: 'add_business',
    color: 'var(--wz-warning)',
    label: 'NGO New Opportunity',
  },
};

export const ROLE_NOTIFICATION_DISPLAY_TYPES: Record<
  RoleNotificationRecipient,
  NotificationDisplayType[]
> = {
  Volunteer: [
    'MatchOpportunity',
    'Message',
    'NewOpportunity',
    'System',
    'ApplicationAccepted',
    'ApplicationRejected',
    'PickupAccepted',
    'PickupRejected',
  ],
  NGO: [
    'PickupSchedule',
    'Message',
    'NewOpportunity',
    'System',
    'DriveCompleted',
    'ApplicationsReceived',
  ],
  Admin: [
    'AdminVolunteerApplied',
    'AdminNgoCreatedOpportunity',
    'Message',
    'System',
  ],
};

export const ADMIN_BLOCKED_NOTIFICATION_DISPLAY_TYPES: NotificationDisplayType[] = [
  'ApplicationAccepted',
  'ApplicationRejected',
  'PickupAccepted',
  'PickupRejected',
];

/* ==========================================================
   API RESPONSE WRAPPER
   ========================================================== */

export interface NotificationApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
