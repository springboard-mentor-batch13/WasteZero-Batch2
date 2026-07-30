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
  Notification,
  NotificationApiResponse,
  NotificationRecipientRole,
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
  private isLoading = false;
  private pollSubscription?: Subscription;

  private readonly notificationsSubject = new BehaviorSubject<Notification[]>(
    []
  );

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
    if (this.authService.isLoggedIn()) {
      this.loadNotificationsOnce();
      this.startPolling();
    }

    this.authService.currentUser$.subscribe((user) => {
      if (user) {
        this.hasLoaded = false;
        this.loadNotificationsOnce();
        this.startPolling();
      } else {
        this.stopPolling();
        this.notificationsSubject.next([]);
        this.hasLoaded = false;
      }
    });
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
    return this.http
      .get<NotificationApiResponse<BackendNotification[]>>(
        this.notificationsUrl,
        this.getHttpOptions()
      )
      .pipe(map((response) => this.mapNotifications(response.data)));
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
    };
  }

  private filterByRole(
    notifications: Notification[],
    user: AuthResponse['user'] | null = this.authService.getUser()
  ): Notification[] {
    const role = this.getUserRole(user);

    if (role === 'Admin') {
      return notifications;
    }

    return notifications.filter((notification) => {
      if (notification.recipientRole === 'All') {
        return true;
      }

      if (notification.recipientRole !== role) {
        return false;
      }

      return !notification.recipientId || notification.recipientId === user?.id;
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
