/* ==========================================================
   NOTIFICATION MODEL
   ========================================================== */

export type NotificationType = 'Match' | 'Message' | 'Opportunity' | 'System';
export type NotificationRecipientRole = 'Volunteer' | 'NGO' | 'Admin' | 'All';
export type NotificationSourceRole = 'Volunteer' | 'NGO' | 'Admin' | 'System';

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

/* ==========================================================
   API RESPONSE WRAPPER
   ========================================================== */

export interface NotificationApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
