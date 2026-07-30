import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
  Notification,
  NOTIFICATION_DISPLAY_TYPE_CONFIG,
  NOTIFICATION_TYPE_CONFIG,
} from '../notification.model';
import { NotificationService } from '../notification.service';

@Component({
  selector: 'app-notification-detail',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatDividerModule,
  ],
  templateUrl: './notification-detail.html',
  styleUrl: './notification-detail.css',
})
export class NotificationDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  notification: Notification | null = null;
  loading = true;
  error: string | null = null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.loadNotification(id);
    } else {
      this.error = 'Notification ID not found.';
      this.loading = false;
    }
  }

  /* ==========================================================
     LOAD NOTIFICATION BY ID
     ========================================================== */

  private loadNotification(id: string): void {
    this.loading = true;
    this.error = null;
    this.notificationService.loadNotificationsOnce();

    this.notificationService.visibleNotifications$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (notifications) => {
          const notification = notifications.find((item) => item.id === id) ?? null;

        if (notification) {
          this.notification = notification;
          this.error = null;
        } else {
          this.notification = null;
          this.error = 'Notification not found.';
        }
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load notification.';
        this.loading = false;
        this.showMessage(this.error);
      },
    });
  }

  /* ==========================================================
     MARK AS READ / UNREAD
     ========================================================== */

  markAsRead(): void {
    if (!this.notification) return;

    this.notificationService.markAsRead(this.notification.id).subscribe({
      next: (updated) => {
        this.notification = updated;
        this.showMessage('Notification marked as read.');
      },
      error: () => {
        this.showMessage('Failed to update notification.');
      },
    });
  }

  markAsUnread(): void {
    if (!this.notification) return;

    this.notificationService.markAsUnread(this.notification.id).subscribe({
      next: (updated) => {
        this.notification = updated;
        this.showMessage('Notification marked as unread.');
      },
      error: () => {
        this.showMessage('Failed to update notification.');
      },
    });
  }

  /* ==========================================================
     DELETE
     ========================================================== */

  delete(): void {
    if (!this.notification) return;

    this.notificationService.deleteNotification(this.notification.id).subscribe({
      next: () => {
        this.showMessage('Notification deleted.');
        this.router.navigate(['/notifications']);
      },
      error: () => {
        this.showMessage('Failed to delete notification.');
      },
    });
  }

  /* ==========================================================
     NAVIGATE TO RELATED MODULE
     ========================================================== */

  navigateToRelated(): void {
    if (!this.notification?.redirectUrl) return;

    this.router.navigate([this.notification.redirectUrl]);
  }

  /* ==========================================================
     HELPER METHODS
     ========================================================== */

  getNotificationIcon(notification: Notification): string {
    return this.getNotificationConfig(notification).icon;
  }

  getNotificationColor(notification: Notification): string {
    return this.getNotificationConfig(notification).color;
  }

  getNotificationLabel(notification: Notification): string {
    return this.getNotificationConfig(notification).label;
  }

  goBack(): void {
    this.router.navigate(['/notifications']);
  }

  private showMessage(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }

  private getNotificationConfig(notification: Notification) {
    return notification.displayType
      ? NOTIFICATION_DISPLAY_TYPE_CONFIG[notification.displayType]
      : NOTIFICATION_TYPE_CONFIG[notification.type];
  }
}
