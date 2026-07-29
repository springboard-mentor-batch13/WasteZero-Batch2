import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, map, of, throwError } from 'rxjs';
import {
  Notification,
  NotificationRecipientRole,
} from './notification.model';
import { AuthResponse, AuthService } from '../../auth/auth.service';

/* ==========================================================
   MOCK NOTIFICATION DATA
   Each notification includes recipientId and recipientRole
   for role-based filtering.
   ========================================================== */

type MockNotificationTemplate = Omit<Notification, 'recipientId' | 'createdAt'> & {
  createdMinutesAgo: number;
  mockOwnerId?: string;
};

const MOCK_NOTIFICATION_TEMPLATES: MockNotificationTemplate[] = [
  {
    id: 'ngo_001',
    title: 'Volunteer Applied',
    message: 'Maya Iyer applied to your "Community Tree Planting" opportunity.',
    type: 'Opportunity',
    isRead: false,
    redirectUrl: '/admin/applications',
    sourceRole: 'Volunteer',
    recipientRole: 'NGO',
    createdMinutesAgo: 5,
  },
  {
    id: 'ngo_002',
    title: 'Message from Volunteer',
    message: 'Rahul sent a question about reporting time for the Beach Cleanup drive.',
    type: 'Message',
    isRead: false,
    redirectUrl: '/messages',
    sourceRole: 'Volunteer',
    recipientRole: 'NGO',
    createdMinutesAgo: 45,
  },
  {
    id: 'ngo_003',
    title: 'Opportunity Reminder',
    message: 'Your "Food Drive for Homeless" opportunity closes for applications tomorrow.',
    type: 'Opportunity',
    isRead: false,
    redirectUrl: '/opportunities',
    sourceRole: 'System',
    recipientRole: 'NGO',
    createdMinutesAgo: 160,
  },
  {
    id: 'ngo_004',
    title: 'Match Found',
    message: 'A strong volunteer match was found for your "Park Cleanup" opportunity.',
    type: 'Match',
    isRead: true,
    redirectUrl: '/admin/applications',
    sourceRole: 'System',
    recipientRole: 'NGO',
    createdMinutesAgo: 420,
  },
  {
    id: 'ngo_005',
    title: 'Message from Admin',
    message: 'Admin shared updated verification guidance for active opportunities.',
    type: 'Message',
    isRead: true,
    redirectUrl: '/messages',
    sourceRole: 'Admin',
    recipientRole: 'NGO',
    createdMinutesAgo: 1280,
  },
  {
    id: 'vol_001',
    title: 'Message from NGO',
    message: 'Green Earth NGO replied about the Beach Cleanup event schedule.',
    type: 'Message',
    isRead: false,
    redirectUrl: '/messages',
    sourceRole: 'NGO',
    recipientRole: 'Volunteer',
    createdMinutesAgo: 10,
  },
  {
    id: 'vol_002',
    title: 'Application Accepted',
    message: 'Your application for "Community Garden" has been accepted. Check the opportunity page for next steps.',
    type: 'Opportunity',
    isRead: false,
    redirectUrl: '/opportunities',
    sourceRole: 'NGO',
    recipientRole: 'Volunteer',
    createdMinutesAgo: 70,
  },
  {
    id: 'vol_003',
    title: 'Application Rejected',
    message: 'Your application for "Animal Shelter Support" was not selected this time.',
    type: 'Opportunity',
    isRead: true,
    redirectUrl: '/opportunities',
    sourceRole: 'NGO',
    recipientRole: 'Volunteer',
    createdMinutesAgo: 220,
  },
  {
    id: 'vol_004',
    title: 'Opportunity Updated',
    message: 'The NGO updated the meeting location for an opportunity you applied to.',
    type: 'Opportunity',
    isRead: false,
    redirectUrl: '/opportunities',
    sourceRole: 'NGO',
    recipientRole: 'Volunteer',
    createdMinutesAgo: 310,
  },
  {
    id: 'vol_005',
    title: 'Match Found',
    message: 'You matched with "Park Cleanup" based on your skills and availability.',
    type: 'Match',
    isRead: true,
    redirectUrl: '/opportunities',
    sourceRole: 'System',
    recipientRole: 'Volunteer',
    createdMinutesAgo: 980,
  },
  {
    id: 'vol_006',
    title: 'Message from Admin',
    message: 'Admin sent an update about volunteer profile verification.',
    type: 'Message',
    isRead: true,
    redirectUrl: '/messages',
    sourceRole: 'Admin',
    recipientRole: 'Volunteer',
    createdMinutesAgo: 1500,
  },
  {
    id: 'sys_001',
    title: 'Welcome to WasteZero!',
    message: 'Welcome back. Your notification center is ready with mock data until backend APIs are available.',
    type: 'System',
    isRead: true,
    sourceRole: 'System',
    recipientRole: 'All',
    createdMinutesAgo: 2200,
  },
  {
    id: 'sys_002',
    title: 'System Maintenance Scheduled',
    message: 'Scheduled maintenance is planned for July 30, 2026 from 2:00 AM to 4:00 AM.',
    type: 'System',
    isRead: false,
    sourceRole: 'System',
    recipientRole: 'All',
    createdMinutesAgo: 3600,
  },
  {
    id: 'admin_001',
    title: 'Platform Notification Review',
    message: 'There are recent notification activities across volunteers and NGOs.',
    type: 'System',
    isRead: true,
    sourceRole: 'System',
    recipientRole: 'Admin',
    createdMinutesAgo: 95,
  }
];

/* ==========================================================
   STORAGE KEY
   ========================================================== */

const STORAGE_KEY_PREFIX = 'wastezero_notifications';

/* ==========================================================
   NOTIFICATION SERVICE
   ========================================================== */

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly authService = inject(AuthService);
  private hasLoaded = false;

  private readonly notificationsSubject = new BehaviorSubject<Notification[]>(
    []
  );

  readonly notifications$ = this.notificationsSubject.asObservable();
  readonly visibleNotifications$ = combineLatest([
    this.notifications$,
    this.authService.currentUser$,
  ]).pipe(
    map(([notifications, user]) =>
      this.sortNotifications(this.filterByRole(notifications, user))
    )
  );
  readonly unreadCount$ = this.visibleNotifications$.pipe(
    map((notifications) => notifications.filter((n) => !n.isRead).length)
  );

  constructor() {
    if (this.authService.isLoggedIn()) {
      this.loadNotificationsOnce();
    }

    this.authService.currentUser$.subscribe((user) => {
      if (user) {
        this.loadNotificationsOnce();
      } else {
        this.notificationsSubject.next([]);
        this.hasLoaded = false;
      }
    });
  }

  loadNotificationsOnce(): void {
    if (this.hasLoaded) {
      return;
    }

    // TODO: Replace this mock load with existing notification backend endpoints
    // when they are added. No notification API routes exist in this backend yet.
    const notifications = this.loadFromStorage();
    this.notificationsSubject.next(notifications);
    this.hasLoaded = true;
  }

  /* ==========================================================
     GET ALL NOTIFICATIONS (role-filtered)
     Admin sees all. Volunteer/NGO see only their notifications.
     ========================================================== */

  getNotifications(): Observable<Notification[]> {
    this.loadNotificationsOnce();
    return this.visibleNotifications$;
  }

  /* ==========================================================
     GET UNREAD COUNT (role-filtered)
     ========================================================== */

  getUnreadCount(): Observable<number> {
    this.loadNotificationsOnce();
    return this.unreadCount$;
  }

  /* ==========================================================
     ROLE-BASED FILTERING
     ========================================================== */

  private filterByRole(
    notifications: Notification[],
    user: AuthResponse['user'] | null = this.authService.getUser()
  ): Notification[] {
    const role = this.getUserRole(user);

    // Admin sees ALL notifications
    if (role === 'Admin') {
      return notifications;
    }

    // Volunteer and NGO see only their own notifications plus shared system notices.
    return notifications.filter((n) => {
      if (n.recipientRole === 'All') {
        return true;
      }

      if (n.recipientRole === role && user?.id) {
        return n.recipientId === user.id;
      }

      return false;
    });
  }

  /* ==========================================================
     MARK AS READ
     ========================================================== */

  markAsRead(id: string): Observable<Notification> {
    const notifications = [...this.notificationsSubject.value];
    const index = notifications.findIndex((n) => n.id === id);

    if (index === -1) {
      return throwError(() => new Error('Notification not found'));
    }

    if (!this.canAccess(notifications[index])) {
      return throwError(() => new Error('Notification not found'));
    }

    notifications[index] = {
      ...notifications[index],
      isRead: true,
    };

    this.notificationsSubject.next(notifications);
    this.saveToStorage(notifications);

    return of(notifications[index]);
  }

  /* ==========================================================
     MARK AS UNREAD
     ========================================================== */

  markAsUnread(id: string): Observable<Notification> {
    const notifications = [...this.notificationsSubject.value];
    const index = notifications.findIndex((n) => n.id === id);

    if (index === -1) {
      return throwError(() => new Error('Notification not found'));
    }

    if (!this.canAccess(notifications[index])) {
      return throwError(() => new Error('Notification not found'));
    }

    notifications[index] = {
      ...notifications[index],
      isRead: false,
    };

    this.notificationsSubject.next(notifications);
    this.saveToStorage(notifications);

    return of(notifications[index]);
  }

  /* ==========================================================
     MARK ALL AS READ
     ========================================================== */

  markAllAsRead(): Observable<Notification[]> {
    const allNotifications = this.notificationsSubject.value;
    const filtered = this.filterByRole(allNotifications);

    // Only mark the user's visible notifications as read
    const filteredIds = new Set(filtered.map((n) => n.id));
    const notifications = allNotifications.map((n) =>
      filteredIds.has(n.id) ? { ...n, isRead: true } : n
    );

    this.notificationsSubject.next(notifications);
    this.saveToStorage(notifications);

    return of(this.sortNotifications(this.filterByRole(notifications)));
  }

  /* ==========================================================
     DELETE NOTIFICATION
     ========================================================== */

  deleteNotification(id: string): Observable<void> {
    const existing = this.notificationsSubject.value.find((n) => n.id === id);

    if (!existing || !this.filterByRole([existing]).length) {
      return throwError(() => new Error('Notification not found'));
    }

    const notifications = this.notificationsSubject.value.filter(
      (n) => n.id !== id
    );

    this.notificationsSubject.next(notifications);
    this.saveToStorage(notifications);

    return of(undefined);
  }

  /* ==========================================================
     GET NOTIFICATION BY ID
     ========================================================== */

  getNotificationById(id: string): Observable<Notification | null> {
    this.loadNotificationsOnce();
    const notification =
      this.filterByRole(this.notificationsSubject.value).find((n) => n.id === id) ?? null;

    return of(notification);
  }

  /* ==========================================================
      ADD NEW NOTIFICATION
      Used for real-time notification simulation.
      The NotificationToastService listens to the
      notifications$ stream and shows a toast popup
      when a new notification appears.
      ========================================================== */

  addNotification(
    notification: Omit<Notification, 'id' | 'createdAt'>
  ): Observable<Notification> {
    const newNotification: Notification = {
      ...notification,
      id: `ntf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
    };

    const notifications = [newNotification, ...this.notificationsSubject.value];

    this.notificationsSubject.next(notifications);
    this.saveToStorage(notifications);

    return of(newNotification);
  }

  /* ==========================================================
     PRIVATE: LOAD FROM STORAGE
     ========================================================== */

  private loadFromStorage(): Notification[] {
    const user = this.authService.getUser();
    const storageKey = this.getStorageKey(user);

    if (typeof localStorage === 'undefined') {
      return this.createMockNotifications(user);
    }

    try {
      const stored = localStorage.getItem(storageKey);

      if (stored) {
        return JSON.parse(stored) as Notification[];
      }
    } catch {
      // If parsing fails, fall back to mock data
    }

    // First-time load: save mock data to storage
    const initial = this.createMockNotifications(user);
    this.saveToStorage(initial);

    return initial;
  }

  /* ==========================================================
     PRIVATE: SAVE TO STORAGE
     ========================================================== */

  private saveToStorage(notifications: Notification[]): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(
        this.getStorageKey(this.authService.getUser()),
        JSON.stringify(notifications)
      );
    } catch {
      // Ignore storage errors
    }
  }

  private createMockNotifications(
    user: AuthResponse['user'] | null
  ): Notification[] {
    const role = this.getUserRole(user);
    const userId = user?.id ?? `${role.toLowerCase()}_mock_user`;

    return MOCK_NOTIFICATION_TEMPLATES
      .filter((template) => this.templateBelongsToRole(template.recipientRole, role))
      .map(({ createdMinutesAgo, mockOwnerId, ...template }) => {
        const recipientRole = template.recipientRole ?? 'All';

        return {
          ...template,
          id: `${userId}_${template.id}`,
          createdAt: new Date(Date.now() - createdMinutesAgo * 60 * 1000).toISOString(),
          recipientId:
            recipientRole === 'All'
              ? undefined
              : role === 'Admin' && recipientRole !== 'Admin'
                ? mockOwnerId ?? `${recipientRole.toLowerCase()}_mock_owner`
                : userId,
        };
      });
  }

  private templateBelongsToRole(
    recipientRole: NotificationRecipientRole | undefined,
    role: string
  ): boolean {
    if (role === 'Admin') {
      return true;
    }

    return recipientRole === 'All' || recipientRole === role;
  }

  private getStorageKey(user: AuthResponse['user'] | null): string {
    const role = this.getUserRole(user);
    const userId = user?.id ?? 'anonymous';

    return `${STORAGE_KEY_PREFIX}_${role}_${userId}`;
  }

  private sortNotifications(notifications: Notification[]): Notification[] {
    return [...notifications].sort((a, b) => {
      if (a.isRead !== b.isRead) {
        return a.isRead ? 1 : -1;
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  private canAccess(notification: Notification): boolean {
    return this.filterByRole([notification]).length > 0;
  }

  private getUserRole(user: AuthResponse['user'] | null): string {
    return user?.role || this.authService.getRole() || '';
  }
}
