import { Component, DestroyRef, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
  Notification,
  NOTIFICATION_DISPLAY_TYPE_CONFIG,
  NOTIFICATION_TYPE_CONFIG,
} from '../notification.model';
import { NotificationService } from '../notification.service';
import { NotificationToastService } from '../notification-toast.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [
    CommonModule,
    MatBadgeModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './notification-bell.html',
  styleUrl: './notification-bell.css',
})
export class NotificationBellComponent implements OnInit {
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  // Inject to initialize the toast service singleton
  private readonly _toastService = inject(NotificationToastService);

  isOpen = false;
  notifications: Notification[] = [];
  unreadCount = 0;
  loading = false;
  error: string | null = null;
  private hasSubscribed = false;

  readonly maxPanelItems = 8;

  ngOnInit(): void {
    this.loadNotifications();
  }

  /* ==========================================================
     LOAD NOTIFICATIONS
     Uses the shared NotificationService as the single source of
     truth. Both the bell popup and the Notifications page read
     from the same BehaviorSubject-backed service.

     Notifications are loaded ONCE on init. The popup does NOT
     reload every time it opens — it uses the cached data.
     ========================================================== */

  loadNotifications(): void {
    this.loading = true;
    this.error = null;
    this.notificationService.loadNotificationsOnce();

    if (this.hasSubscribed) {
      this.loading = false;
      return;
    }

    this.hasSubscribed = true;

    this.notificationService.visibleNotifications$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: (notifications) => {
        this.notifications = notifications;
        this.loading = false;
      },
      error: (err: unknown) => {
        this.loading = false;
        this.error =
          err instanceof Error
            ? err.message
            : 'Unable to load notifications. Please try again.';
      },
    });

    this.notificationService.unreadCount$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((count) => {
        this.unreadCount = count;
      });
  }

  /* ==========================================================
     TOGGLE PANEL
     Does NOT reload notifications — uses cached data from
     the shared NotificationService.
     ========================================================== */

  togglePanel(): void {
    this.isOpen = !this.isOpen;
    // Notifications are already loaded on init.
    // Do NOT reload — use cached data to avoid spinner flash.
  }

  closePanel(): void {
    this.isOpen = false;
  }

  /* ==========================================================
     CLICK OUTSIDE TO CLOSE
     ========================================================== */

  @HostListener('document:keydown.escape')
  onKeydownHandler(): void {
    this.isOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    if (this.isOpen && !target.closest('.notification-bell')) {
      this.isOpen = false;
    }
  }

  /* ==========================================================
     UNREAD COUNT
     ========================================================== */

  /* ==========================================================
     RECENT NOTIFICATIONS (for panel)
     Unread notifications first, then by date (newest first).
     ========================================================== */

  get recentNotifications(): Notification[] {
    return this.notifications.slice(0, this.maxPanelItems);
  }

  /* ==========================================================
     OPEN NOTIFICATION
     ========================================================== */

  openNotification(notification: Notification): void {
    // Mark as read immediately for badge sync
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.id).subscribe({
        next: () => undefined,
      });
    }

    // Close panel
    this.isOpen = false;

    // Navigate to detail or redirect URL
    if (notification.redirectUrl) {
      this.router.navigate([notification.redirectUrl]);
    } else {
      this.router.navigate(['/notifications', notification.id]);
    }
  }

  /* ==========================================================
     MARK ALL AS READ
     ========================================================== */

  markAllAsRead(event: Event): void {
    event.stopPropagation();

    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.snackBar.open('All notifications marked as read', 'Close', {
          duration: 2000,
        });
      },
      error: () => {
        this.snackBar.open('Failed to mark all as read', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  /* ==========================================================
     MARK READ (single, from popup)
     ========================================================== */

  markAsRead(event: Event, notification: Notification): void {
    event.stopPropagation();

    this.notificationService.markAsRead(notification.id).subscribe({
      next: () => undefined,
      error: () => {
        this.snackBar.open('Failed to mark as read', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  /* ==========================================================
     VIEW ALL
     ========================================================== */

  viewAll(event: Event): void {
    event.stopPropagation();

    this.isOpen = false;
    this.router.navigate(['/notifications']);
  }

  /* ==========================================================
     RETRY
     ========================================================== */

  retry(event: Event): void {
    event.stopPropagation();
    this.loadNotifications();
  }

  get unreadBadgeLabel(): string {
    return this.unreadCount > 99 ? '99+' : String(this.unreadCount);
  }

  /* ==========================================================
     HELPER: TYPE ICON
     ========================================================== */

  getNotificationIcon(notification: Notification): string {
    return this.getNotificationConfig(notification).icon;
  }

  /* ==========================================================
     HELPER: TYPE COLOR
     ========================================================== */

  getNotificationColor(notification: Notification): string {
    return this.getNotificationConfig(notification).color;
  }

  getNotificationLabel(notification: Notification): string {
    return this.getNotificationConfig(notification).label;
  }

  private getNotificationConfig(notification: Notification) {
    return notification.displayType
      ? NOTIFICATION_DISPLAY_TYPE_CONFIG[notification.displayType]
      : NOTIFICATION_TYPE_CONFIG[notification.type];
  }

  /* ==========================================================
     HELPER: FORMAT TIME
     ========================================================== */

  formatTime(createdAt: string): string {
    const date = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) {
      return 'Just now';
    }

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    }

    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }

    if (diffDays < 7) {
      return `${diffDays}d ago`;
    }

    // Format older dates as "MMM d"
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  }
}
