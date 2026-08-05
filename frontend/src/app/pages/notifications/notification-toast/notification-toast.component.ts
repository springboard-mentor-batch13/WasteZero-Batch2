import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  MatSnackBarRef,
  MAT_SNACK_BAR_DATA,
} from '@angular/material/snack-bar';
import { Router } from '@angular/router';

import {
  Notification,
  NOTIFICATION_DISPLAY_TYPE_CONFIG,
  NOTIFICATION_TYPE_CONFIG,
} from '../notification.model';

@Component({
  selector: 'app-notification-toast',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule],
  template: `
    <div class="toast-shell" (click)="onToastClick()">
      <div
        class="toast-icon"
        [style.color]="getNotificationColor(notification)"
        aria-hidden="true"
      >
        <mat-icon>{{ getNotificationIcon(notification) }}</mat-icon>
      </div>

      <div class="toast-body">
        <div class="toast-header">
          <div class="toast-title">{{ notification.title }}</div>

          <button
            class="toast-close"
            (click)="closeToast($event)"
            type="button"
            mat-icon-button
            matTooltip="Close"
            aria-label="Close notification"
          >
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <div class="toast-message">
          {{ notification.message }}
        </div>

        <div class="toast-footer">
          <div class="toast-type">
            {{ getNotificationLabel(notification) }}
          </div>

          <div class="toast-time">
            <mat-icon>access_time</mat-icon>
            {{ formatTime(notification.createdAt) }}
          </div>

          <button
            class="toast-view"
            (click)="viewNotification($event)"
            type="button"
            mat-button
          >
            <mat-icon>open_in_new</mat-icon>
            View
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .toast-shell {
      display: grid;
      grid-template-columns: 40px minmax(0, 1fr);
      align-items: flex-start;
      gap: 12px;
      width: 100%;
      cursor: pointer;
    }

    .toast-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: var(--wz-toast-icon-bg, rgba(22, 163, 74, 0.12));
      color: var(--wz-toast-accent, #16a34a);
      flex-shrink: 0;
    }

    .toast-icon mat-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
    }

    .toast-body {
      min-width: 0;
    }

    .toast-header {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 32px;
      align-items: flex-start;
      gap: 10px;
      min-height: 32px;
    }

    .toast-title {
      font-size: 14px;
      font-weight: 700;
      color: var(--wz-toast-title, #1f2937);
      line-height: 1.35;
      padding-top: 2px;
      word-break: break-word;
    }

    .toast-message {
      font-size: 13px;
      font-weight: 400;
      color: var(--wz-toast-secondary, #6b7280);
      line-height: 1.45;
      margin: 2px 0 10px;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      overflow: hidden;
    }

    .toast-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      min-width: 0;
    }

    .toast-type {
      font-size: 11px;
      font-weight: 700;
      color: var(--wz-toast-accent, #16a34a);
      line-height: 1.2;
      min-width: 0;
    }

    .toast-time {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      font-weight: 500;
      color: var(--wz-toast-muted, #6b7280);
      min-width: 0;
    }

    .toast-time mat-icon {
      font-size: 12px;
      width: 12px;
      height: 12px;
    }

    .toast-close {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      color: var(--wz-toast-close, #6b7280);
      justify-self: end;
      --mdc-icon-button-icon-size: 18px;
    }

    .toast-view {
      min-width: 68px;
      min-height: 32px;
      height: 32px;
      padding: 0 10px;
      border-radius: 8px;
      color: var(--wz-toast-accent, #16a34a);
      font-size: 12px;
      font-weight: 700;
      flex-shrink: 0;
    }

    .toast-view mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      margin-right: 4px;
    }

    @media (max-width: 420px) {
      .toast-shell {
        grid-template-columns: 36px minmax(0, 1fr);
        gap: 10px;
      }

      .toast-icon {
        width: 36px;
        height: 36px;
      }

      .toast-footer {
        align-items: flex-start;
        flex-direction: column;
        gap: 8px;
      }

      .toast-view {
        align-self: flex-end;
      }
    }
  `],
})
export class NotificationToastComponent {
  notification: Notification;

  constructor(
    @Inject(MAT_SNACK_BAR_DATA) data: Notification,
    private snackBarRef: MatSnackBarRef<NotificationToastComponent>,
    private router: Router
  ) {
    this.notification = data;
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

  formatTime(createdAt: string): string {
    const date = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;

    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  }

  onToastClick(): void {
    this.viewNotification(new MouseEvent('click'));
  }

  viewNotification(event: MouseEvent): void {
    event.stopPropagation();
    this.snackBarRef.dismiss();

    if (this.notification.redirectUrl) {
      this.router.navigate([this.notification.redirectUrl]);
    } else {
      this.router.navigate(['/notifications', this.notification.id]);
    }
  }

  closeToast(event: MouseEvent): void {
    event.stopPropagation();
    this.snackBarRef.dismiss();
  }

  private getNotificationConfig(notification: Notification) {
    return notification.displayType
      ? NOTIFICATION_DISPLAY_TYPE_CONFIG[notification.displayType]
      : NOTIFICATION_TYPE_CONFIG[notification.type];
  }
}
