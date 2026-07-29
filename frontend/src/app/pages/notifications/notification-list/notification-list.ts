import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
  Notification,
  NotificationFilter,
  NotificationType,
  NOTIFICATION_FILTERS,
  NOTIFICATION_TYPE_CONFIG,
} from '../notification.model';
import { NotificationService } from '../notification.service';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatDividerModule,
  ],
  templateUrl: './notification-list.html',
  styleUrl: './notification-list.css',
})
export class NotificationList implements OnInit {
  private readonly notificationService = inject(NotificationService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  /* State */
  allNotifications: Notification[] = [];
  filteredNotifications: Notification[] = [];
  displayedNotifications: Notification[] = [];

  loading = true;
  errorMessage = '';
  searchText = '';
  selectedFilter: NotificationFilter = 'all';
  private hasSubscribed = false;

  /* Pagination (Load More) */
  readonly pageSize = 10;
  currentPage = 1;

  /* Constants */
  readonly filters = NOTIFICATION_FILTERS;

  ngOnInit(): void {
    this.loadNotifications();
  }

  /* ==========================================================
     LOAD NOTIFICATIONS
     ========================================================== */

  private loadNotifications(): void {
    this.loading = true;
    this.errorMessage = '';

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
          this.allNotifications = notifications;
          this.applyFilters();
          this.loading = false;
        },
        error: (error: unknown) => {
          console.error('Failed to load notifications:', error);
          this.allNotifications = [];
          this.filteredNotifications = [];
          this.displayedNotifications = [];
          const err = error as { error?: { message?: string } };
          this.errorMessage =
            err?.error?.message ||
            'Unable to load notifications. Please try again.';
          this.loading = false;
          this.showMessage(this.errorMessage);
        },
      });
  }

  /* ==========================================================
     APPLY FILTERS (search + filter type)
     ========================================================== */

  applyFilters(): void {
    const search = this.searchText.toLowerCase().trim();

    let result = this.allNotifications.filter((notification) => {
      const matchesSearch =
        !search ||
        notification.title.toLowerCase().includes(search) ||
        notification.message.toLowerCase().includes(search);

      const matchesFilter = this.matchesFilter(notification);

      return matchesSearch && matchesFilter;
    });

    // Sort: unread first, then by date (newest first)
    result = result.sort((a, b) => {
      if (a.isRead !== b.isRead) {
        return a.isRead ? 1 : -1;
      }
      return (
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
      );
    });

    this.filteredNotifications = result;
    this.resetPagination();
  }

  /* ==========================================================
     FILTER MATCHING
     ========================================================== */

  private matchesFilter(notification: Notification): boolean {
    switch (this.selectedFilter) {
      case 'all':
        return true;
      case 'unread':
        return !notification.isRead;
      case 'read':
        return notification.isRead;
      case 'Match':
      case 'Message':
      case 'Opportunity':
      case 'System':
        return notification.type === this.selectedFilter;
      default:
        return true;
    }
  }

  /* ==========================================================
     SEARCH HANDLER
     ========================================================== */

  onSearchChange(): void {
    this.applyFilters();
  }

  /* ==========================================================
     FILTER HANDLER
     ========================================================== */

  onFilterChange(): void {
    this.applyFilters();
  }

  /* ==========================================================
     PAGINATION (Load More)
     ========================================================== */

  resetPagination(): void {
    this.currentPage = 1;
    this.updateDisplayed();
  }

  updateDisplayed(): void {
    const endIndex = this.currentPage * this.pageSize;
    this.displayedNotifications = this.filteredNotifications.slice(
      0,
      endIndex
    );
  }

  loadMore(): void {
    this.currentPage++;
    this.updateDisplayed();
  }

  get hasMore(): boolean {
    return this.displayedNotifications.length <
      this.filteredNotifications.length;
  }

  get displayedCount(): number {
    return this.displayedNotifications.length;
  }

  /* ==========================================================
     READ / UNREAD ACTIONS
     ========================================================== */

  markAsRead(notification: Notification): void {
    this.notificationService.markAsRead(notification.id).subscribe({
      next: () => undefined,
      error: () => {
        this.showMessage('Failed to mark notification as read.');
      },
    });
  }

  markAsUnread(notification: Notification): void {
    this.notificationService.markAsUnread(notification.id).subscribe({
      next: () => undefined,
      error: () => {
        this.showMessage('Failed to mark notification as unread.');
      },
    });
  }

  markAllAsRead(): void {
    if (this.filteredNotifications.length === 0) {
      return;
    }

    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.showMessage('All notifications marked as read.');
      },
      error: () => {
        this.showMessage('Failed to mark all notifications as read.');
      },
    });
  }

  /* ==========================================================
     DELETE
     ========================================================== */

  deleteNotification(notification: Notification): void {
    this.notificationService.deleteNotification(notification.id).subscribe({
      next: () => {
        this.showMessage('Notification deleted.');
      },
      error: () => {
        this.showMessage('Failed to delete notification.');
      },
    });
  }

  /* ==========================================================
     OPEN / NAVIGATE
     ========================================================== */

  openNotification(notification: Notification): void {
    // Mark as read if unread — optimistic update
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.id).subscribe({
        next: () => undefined,
      });
    }

    // Navigate to detail or redirect URL
    if (notification.redirectUrl) {
      this.router.navigate([notification.redirectUrl]);
    } else {
      this.router.navigate(['/notifications', notification.id]);
    }
  }

  /* ==========================================================
     RETRY
     ========================================================== */

  retry(): void {
    this.loadNotifications();
  }

  /* ==========================================================
     HELPER METHODS
     ========================================================== */

  getTypeIcon(type: NotificationType): string {
    return NOTIFICATION_TYPE_CONFIG[type]?.icon ?? 'notifications';
  }

  getTypeColor(type: NotificationType): string {
    return (
      NOTIFICATION_TYPE_CONFIG[type]?.color ?? 'var(--wz-text-muted)'
    );
  }

  getFilterLabel(filter: NotificationFilter): string {
    const found = this.filters.find((f) => f.value === filter);
    return found?.label ?? filter;
  }

  getSelectedFilterIcon(): string {
    const found = this.filters.find((f) => f.value === this.selectedFilter);
    return found?.icon ?? 'notifications';
  }

  isUnread(notification: Notification): boolean {
    return !notification.isRead;
  }

  private showMessage(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3500 });
  }
}
