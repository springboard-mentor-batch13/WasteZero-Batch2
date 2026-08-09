import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  BehaviorSubject,
  Observable,
  Subscription,
  catchError,
  map,
  of,
  switchMap,
  tap,
  timer,
} from 'rxjs';

import { API_BASE_URL } from '../../core/api/api-config';
import { AuthResponse, AuthService } from '../../auth/auth.service';
import {
  ADMIN_BLOCKED_NOTIFICATION_DISPLAY_TYPES,
  Notification,
  NotificationApiResponse,
  NotificationDisplayType,
  NotificationRecipientRole,
  ROLE_NOTIFICATION_DISPLAY_TYPES,
  RoleNotificationRecipient,
  NotificationSourceRole,
  NotificationType,
} from './notification.model';

type CreateNotificationRequest = Omit<Notification, 'id' | 'createdAt'>;

type BackendNotification = Omit<Notification, 'id'> & {
  _id?: string;
  id?: string;
};

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly notificationsUrl = `${this.apiBaseUrl}/notifications`;
  private readonly pollIntervalMs = 15000;

  private hasLoaded = false;
  public get loaded(): boolean {
    return this.hasLoaded;
  }
  private isLoading = false;
  private pollSubscription?: Subscription;

  private readonly notificationsSubject = new BehaviorSubject<Notification[]>([]);

  readonly notifications$ = this.notificationsSubject.asObservable();
  readonly visibleNotifications$ = this.notifications$.pipe(
    map((notifications) =>
      this.sortNotifications(this.filterByRole(notifications))
    )
  );
  readonly unreadCount$ = this.visibleNotifications$.pipe(
    map((notifications) => notifications.filter((n) => !n.isRead).length)
  );

  constructor() {
    this.authService.currentUser$.subscribe((user) => {
      if (user && this.authService.isLoggedIn()) {
        this.clearAndReload();
      } else {
        this.stopPolling();
        this.notificationsSubject.next([]);
        this.hasLoaded = false;
        this.isLoading = false;
      }
    });
  }

  clearAndReload(): void {
    this.hasLoaded = false;
    this.isLoading = false;
    this.refreshNotifications().subscribe({
      error: (err) => console.error('Failed to load notifications on login:', err),
    });
    this.startPolling();
  }

  loadNotificationsOnce(): void {
    if (this.hasLoaded || this.isLoading || !this.authService.isLoggedIn()) {
      return;
    }

    this.isLoading = true;

    this.fetchNotifications().subscribe({
      next: (notifications) => {
        this.notificationsSubject.next(notifications);
        this.hasLoaded = true;
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Failed to load notifications:', error);
      },
    });
  }

  refreshNotifications(): Observable<Notification[]> {
    return this.fetchNotifications().pipe(
      tap((notifications) => {
        this.notificationsSubject.next(notifications);
        this.hasLoaded = true;
      })
    );
  }

  getNotifications(): Observable<Notification[]> {
    this.loadNotificationsOnce();
    return this.visibleNotifications$;
  }

  getUnreadCount(): Observable<number> {
    this.loadNotificationsOnce();
    return this.unreadCount$;
  }

  markAsRead(id: string): Observable<Notification> {
    return this.patchNotification(`${this.notificationsUrl}/${id}/read`).pipe(
      tap((notification) => this.upsertNotification(notification))
    );
  }

  markAsUnread(id: string): Observable<Notification> {
    return this.patchNotification(`${this.notificationsUrl}/${id}/unread`).pipe(
      tap((notification) => this.upsertNotification(notification))
    );
  }

  markAllAsRead(): Observable<Notification[]> {
    return this.http
      .patch<NotificationApiResponse<BackendNotification[]>>(
        `${this.notificationsUrl}/mark-all-read`,
        {},
        this.getHttpOptions()
      )
      .pipe(
        map((response) => this.mapNotifications(response.data)),
        tap((notifications) => this.notificationsSubject.next(notifications))
      );
  }

  markMessageNotificationsAsRead(): Observable<any> {
    return this.http.patch(
      `${this.notificationsUrl}/mark-message-read`,
      {},
      this.getHttpOptions()
    );
  }

  deleteNotification(id: string): Observable<void> {
    return this.http
      .delete<NotificationApiResponse<null>>(
        `${this.notificationsUrl}/${id}`,
        this.getHttpOptions()
      )
      .pipe(
        tap(() => {
          const notifications = this.notificationsSubject.value.filter(
            (notification) => notification.id !== id
          );
          this.notificationsSubject.next(notifications);
        }),
        map(() => undefined)
      );
  }

  getNotificationById(id: string): Observable<Notification | null> {
    const cached =
      this.filterByRole(this.notificationsSubject.value).find(
        (notification) => notification.id === id
      ) ?? null;

    if (cached) {
      return of(cached);
    }

    return this.http
      .get<NotificationApiResponse<BackendNotification>>(
        `${this.notificationsUrl}/${id}`,
        this.getHttpOptions()
      )
      .pipe(
        map((response) => this.mapNotification(response.data)),
        tap((notification) => this.upsertNotification(notification)),
        map((notification) =>
          this.filterByRole([notification]).length ? notification : null
        ),
        catchError(() => of(null))
      );
  }

  addNotification(
    notification: CreateNotificationRequest
  ): Observable<Notification> {
    return this.http
      .post<NotificationApiResponse<BackendNotification>>(
        this.notificationsUrl,
        notification,
        this.getHttpOptions()
      )
      .pipe(
        map((response) => this.mapNotification(response.data)),
        tap((created) => this.upsertNotification(created))
      );
  }

  private fetchNotifications(): Observable<Notification[]> {
    if (!this.authService.isLoggedIn()) {
      return of([]);
    }

    return this.http
      .get<NotificationApiResponse<BackendNotification[]>>(
        this.notificationsUrl,
        this.getHttpOptions()
      )
      .pipe(
        map((response) => this.mapNotifications(response.data || [])),
        catchError(() => of([]))
      );
  }

  private patchNotification(url: string): Observable<Notification> {
    return this.http
      .patch<NotificationApiResponse<BackendNotification>>(
        url,
        {},
        this.getHttpOptions()
      )
      .pipe(map((response) => this.mapNotification(response.data)));
  }

  private startPolling(): void {
    if (this.pollSubscription || !this.authService.isLoggedIn()) {
      return;
    }

    this.pollSubscription = timer(this.pollIntervalMs, this.pollIntervalMs)
      .pipe(
        switchMap(() => this.fetchNotifications()),
        catchError((error) => {
          console.error('Notification polling failed:', error);
          return of(this.notificationsSubject.value);
        })
      )
      .subscribe((notifications) => {
        this.notificationsSubject.next(notifications);
        this.hasLoaded = true;
      });
  }

  private stopPolling(): void {
    this.pollSubscription?.unsubscribe();
    this.pollSubscription = undefined;
  }

  private upsertNotification(notification: Notification): void {
    const notifications = [...this.notificationsSubject.value];
    const index = notifications.findIndex((item) => item.id === notification.id);

    if (index >= 0) {
      notifications[index] = notification;
    } else {
      notifications.unshift(notification);
    }

    this.notificationsSubject.next(this.sortNotifications(notifications));
  }

  private mapNotifications(notifications: BackendNotification[]): Notification[] {
    if (!Array.isArray(notifications)) return [];
    return this.sortNotifications(
      notifications.map((notification) => this.mapNotification(notification))
    );
  }

  private mapNotification(notification: BackendNotification): Notification {
    return {
      id: notification.id || notification._id || '',
      title: notification.title,
      message: notification.message,
      type: notification.type as NotificationType,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
      redirectUrl: notification.redirectUrl ?? undefined,
      sourceRole: notification.sourceRole as NotificationSourceRole | undefined,
      recipientId: notification.recipientId ?? undefined,
      recipientRole:
        notification.recipientRole as NotificationRecipientRole | undefined,
      displayType: this.resolveDisplayType(notification),
    };
  }

  private filterByRole(
    notifications: Notification[],
    user: AuthResponse['user'] | null = this.authService.getUser()
  ): Notification[] {
    const role = this.getUserRole(user);

    if (!this.isRoleNotificationRecipient(role) || !this.authService.isLoggedIn()) {
      return [];
    }

    const currentUserId = user?.id || (user as any)?._id;

    return notifications.filter((notification) => {
      const displayType =
        notification.displayType ?? this.resolveDisplayType(notification);

      if (!ROLE_NOTIFICATION_DISPLAY_TYPES[role]?.includes(displayType)) {
        return false;
      }

      if (
        role === 'Admin' &&
        ADMIN_BLOCKED_NOTIFICATION_DISPLAY_TYPES.includes(displayType)
      ) {
        return false;
      }

      if (
        notification.recipientRole &&
        notification.recipientRole !== role &&
        notification.recipientRole !== 'All'
      ) {
        return false;
      }

      return !notification.recipientId || notification.recipientId === currentUserId;
    });
  }

  private sortNotifications(notifications: Notification[]): Notification[] {
    return [...notifications].sort((a, b) => {
      if (a.isRead !== b.isRead) {
        return a.isRead ? 1 : -1;
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  private getUserRole(user: AuthResponse['user'] | null): string {
    return user?.role || this.authService.getRole() || '';
  }

  private isRoleNotificationRecipient(
    role: string
  ): role is RoleNotificationRecipient {
    return role === 'Volunteer' || role === 'NGO' || role === 'Admin';
  }

  private resolveDisplayType(
    notification: Pick<
      Notification,
      'type' | 'title' | 'message' | 'recipientRole' | 'sourceRole'
    >
  ): NotificationDisplayType {
    const text = `${notification.title} ${notification.message}`.toLowerCase();
    const recipientRole = notification.recipientRole;

    if (this.hasAny(text, ['application accepted', 'accepted application'])) {
      return 'ApplicationAccepted';
    }

    if (this.hasAny(text, ['application rejected', 'rejected application'])) {
      return 'ApplicationRejected';
    }

    if (this.hasAny(text, ['pickup accepted', 'accepted pickup'])) {
      return 'PickupAccepted';
    }

    if (this.hasAny(text, ['pickup rejected', 'rejected pickup'])) {
      return 'PickupRejected';
    }

    if (
      this.hasAny(text, [
        'pickup schedule',
        'pickup scheduled',
        'scheduled pickup',
      ])
    ) {
      return 'PickupSchedule';
    }

    if (
      this.hasAny(text, [
        'drive completed',
        'completed drive',
        'opportunity completed',
        'completed opportunity',
      ])
    ) {
      return 'DriveCompleted';
    }

    if (
      this.hasAny(text, [
        'volunteer applied',
        'applied for an opportunity',
        'application received',
        'applications received',
        'new application',
      ])
    ) {
      return recipientRole === 'Admin'
        ? 'AdminVolunteerApplied'
        : 'ApplicationsReceived';
    }

    if (
      this.hasAny(text, [
        'ngo created a new opportunity',
        'created a new opportunity',
        'new opportunity created',
      ])
    ) {
      return recipientRole === 'Admin'
        ? 'AdminNgoCreatedOpportunity'
        : 'NewOpportunity';
    }

    if (notification.type === 'Match') {
      return 'MatchOpportunity';
    }

    if (notification.type === 'Message') {
      return 'Message';
    }

    if (notification.type === 'System') {
      return 'System';
    }

    if (
      recipientRole === 'Admin' ||
      notification.sourceRole === 'NGO'
    ) {
      return recipientRole === 'Admin'
        ? 'AdminNgoCreatedOpportunity'
        : 'NewOpportunity';
    }

    return 'NewOpportunity';
  }

  private hasAny(text: string, phrases: string[]): boolean {
    return phrases.some((phrase) => text.includes(phrase));
  }

  private getHttpOptions(): { headers: HttpHeaders } {
    const token =
      typeof localStorage === 'undefined' ? '' : localStorage.getItem('token');

    return {
      headers: token
        ? new HttpHeaders({ Authorization: `Bearer ${token}` })
        : new HttpHeaders(),
    };
  }
}