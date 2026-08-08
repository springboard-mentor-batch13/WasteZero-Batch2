import { Component, ChangeDetectorRef, DestroyRef, HostListener, OnInit, inject } from '@angular/core';
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
import { AuthService, AuthResponse } from '../../../auth/auth.service';

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
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  
  private readonly _toastService = inject(NotificationToastService);

  isOpen = false;
  notifications: Notification[] = [];
  unreadCount = 0;
  loading = false;
  error: string | null = null;

  readonly maxPanelItems = 8;

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user: AuthResponse['user'] | null) => {
        if (!user) {
          this.notifications = [];
          this.unreadCount = 0;
          this.loading = false;
          this.error = null;
          this.cdr.markForCheck();
        } else {
          this.notificationService.clearAndReload();
        }
      });

    this.notificationService.visibleNotifications$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (notifications) => {
          this.notifications = notifications;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (err: unknown) => {
          this.loading = false;
          this.error =
            err instanceof Error
              ? err.message
              : 'Unable to load notifications. Please try again.';
          this.cdr.markForCheck();
        },
      });

    this.notificationService.unreadCount$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((count) => {
        this.unreadCount = count;
        this.cdr.markForCheck();
      });
  }

  togglePanel(): void {
    this.isOpen = !this.isOpen;
    this.cdr.markForCheck();
  }

  closePanel(): void {
    this.isOpen = false;
    this.cdr.markForCheck();
  }

  @HostListener('document:keydown.escape')
  onKeydownHandler(): void {
    this.isOpen = false;
    this.cdr.markForCheck();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    if (this.isOpen && !target.closest('.notification-bell')) {
      this.isOpen = false;
      this.cdr.markForCheck();
    }
  }

  get recentNotifications(): Notification[] {
    return this.notifications.slice(0, this.maxPanelItems);
  }

  openNotification(notification: Notification): void {
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.id).subscribe({
        next: () => this.cdr.markForCheck(),
      });
    }

    this.isOpen = false;

    if (notification.redirectUrl) {
      this.router.navigate([notification.redirectUrl]);
    } else {
      this.router.navigate(['/notifications', notification.id]);
    }
  }

  markAllAsRead(event: Event): void {
    event.stopPropagation();

    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.snackBar.open('All notifications marked as read', 'Close', {
          duration: 2000,
        });
        this.cdr.markForCheck();
      },
      error: () => {
        this.snackBar.open('Failed to mark all as read', 'Close', {
          duration: 3000,
        });
        this.cdr.markForCheck();
      },
    });
  }

  markAsRead(event: Event, notification: Notification): void {
    event.stopPropagation();

    this.notificationService.markAsRead(notification.id).subscribe({
      next: () => this.cdr.markForCheck(),
      error: () => {
        this.snackBar.open('Failed to mark as read', 'Close', {
          duration: 3000,
        });
        this.cdr.markForCheck();
      },
    });
  }

  viewAll(event: Event): void {
    event.stopPropagation();

    this.isOpen = false;
    this.router.navigate(['/notifications']);
  }

  retry(event: Event): void {
    event.stopPropagation();
    this.notificationService.clearAndReload();
  }

  get unreadBadgeLabel(): string {
    return this.unreadCount > 99 ? '99+' : String(this.unreadCount);
  }

  getNotificationIcon(notification: Notification): string {
    return this.getNotificationConfig(notification).icon;
  }

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

    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  }
}