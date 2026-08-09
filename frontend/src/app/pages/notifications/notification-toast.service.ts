import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NotificationService } from './notification.service';
import type { Notification } from './notification.model';
import { NotificationToastComponent } from './notification-toast/notification-toast.component';
import { AuthService } from '../../auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class NotificationToastService {
  private readonly snackBar = inject(MatSnackBar);
  private readonly notificationService = inject(NotificationService);
  private readonly authService = inject(AuthService);

  private previousIds = new Set<string>();
  private initialized = false;
  private queue: Notification[] = [];
  private isShowing = false;

  constructor() {
    this.notificationService.visibleNotifications$.subscribe(
      (notifications) => {
        if (!this.authService.isLoggedIn()) {
          this.previousIds.clear();
          this.queue = [];
          this.isShowing = false;
          this.initialized = false;
          return;
        }

        if (
          !this.notificationService.loaded ||
          notifications.length === 0
        ) {
          return;
        }

        // First real notification list:
        // remember existing notifications but don't show them as popups.
        if (!this.initialized) {
          this.previousIds = new Set(
            notifications.map((n) => n.id)
          );

          this.initialized = true;
          return;
        }

        const currentIds = new Set(
          notifications.map((n) => n.id)
        );

        const newNotifications = notifications.filter(
          (n) => !this.previousIds.has(n.id)
        );

        this.previousIds = currentIds;

        newNotifications.forEach((notification) => {
          this.enqueueToast(notification);
        });
      }
    );
  }

  showToast(notification: Notification): void {
    const ref = this.snackBar.openFromComponent(
      NotificationToastComponent,
      {
        data: notification,
        duration: 5000,
        horizontalPosition: 'right',
        verticalPosition: 'top',
        panelClass: 'notification-toast-panel',
      }
    );

    ref.afterDismissed().subscribe(() => {
      this.isShowing = false;
      this.showNext();
    });
  }

  private enqueueToast(notification: Notification): void {
    this.queue.push(notification);
    this.showNext();
  }

  private showNext(): void {
    if (this.isShowing || this.queue.length === 0) {
      return;
    }

    const next = this.queue.shift();

    if (!next) {
      return;
    }

    this.isShowing = true;
    this.showToast(next);
  }
}