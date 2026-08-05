import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NotificationService } from './notification.service';
import { Notification } from './notification.model';
import { NotificationToastComponent } from './notification-toast/notification-toast.component';
import { AuthService } from '../../auth/auth.service';

/* ==========================================================
   NOTIFICATION TOAST SERVICE
   Listens to the shared NotificationService and shows
   toast popups when new notifications arrive.

   Uses MatSnackBar for queuing — multiple toasts
   are displayed one after another automatically.
   ========================================================== */

@Injectable({
  providedIn: 'root',
})
export class NotificationToastService {
  private readonly snackBar = inject(MatSnackBar);
  private readonly notificationService = inject(NotificationService);
  private readonly authService = inject(AuthService);

  private seenIds = new Set<string>();
  private isInitialized = false;
  private queue: Notification[] = [];
  private isShowing = false;

  constructor() {
    this.notificationService.visibleNotifications$.subscribe((notifications) => {
      if (!this.authService.isLoggedIn()) {
        this.isInitialized = false;
        this.seenIds.clear();
        this.queue = [];
        return;
      }

      if (!this.isInitialized) {
        // First logged-in emission: record existing IDs, don't show toasts.
        notifications.forEach((n) => this.seenIds.add(n.id));
        this.isInitialized = true;
        return;
      }

      // Detect new notifications
      const newNotifications = notifications.filter(
        (n) => !this.seenIds.has(n.id)
      );

      newNotifications.forEach((n) => {
        this.seenIds.add(n.id);
        this.enqueueToast(n);
      });
    });
  }

  /* ==========================================================
     SHOW TOAST
     Auto-closes after 5 seconds.
     Manual close button available.
     ========================================================== */

  showToast(notification: Notification): void {
    const ref = this.snackBar.openFromComponent(NotificationToastComponent, {
      data: notification,
      duration: 5000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: 'notification-toast-panel',
    });

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
