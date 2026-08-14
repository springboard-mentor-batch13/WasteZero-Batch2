import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { Subscription } from 'rxjs';

import { Opportunity, OpportunityStatus } from '../opportunities/opportunity.model';
import {
  AdminControlsService,
  AdminLogEntry,
  AdminManagedUser,
  AdminUserStatus
} from './admin-controls.service';
import { AdminConfirmDialog, AdminConfirmDialogData } from './admin-confirm-dialog';

@Component({
  selector: 'app-admin-controls',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTableModule,
    MatTabsModule,
  ],
  templateUrl: './admin-controls.html',
  styleUrl: './admin-controls.css'
})
export class AdminControls implements OnInit, OnDestroy {
  private readonly adminControlsService = inject(AdminControlsService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);

  users: AdminManagedUser[] = [];
  opportunities: Opportunity[] = [];
  logs: AdminLogEntry[] = [];

  usersLoading = true;
  opportunitiesLoading = true;
  logsLoading = false;

  usersError = '';
  opportunitiesError = '';
  logsError = '';

  userSearchText = '';
  userRoleFilter = '';
  userStatusFilter: AdminUserStatus | '' = '';
  opportunitySearchText = '';
  opportunityStatusFilter: OpportunityStatus | '' = '';
  logSearchText = '';
  logActionFilter = '';

  updatingUserId = '';
  removingOpportunityId = '';
  private logsLoaded = false;
  private usersRequest?: Subscription;
  private opportunitiesRequest?: Subscription;
  private logsRequest?: Subscription;

  userPageIndex = 0;
  userPageSize = 10;
  userTotal = 0;
  opportunityPageIndex = 0;
  opportunityPageSize = 10;
  opportunityTotal = 0;
  logPageIndex = 0;
  logPageSize = 10;
  logTotal = 0;

  readonly userColumns = ['name', 'email', 'role', 'status', 'actions'];
  readonly opportunityColumns = ['title', 'owner', 'status', 'createdAt', 'details', 'actions'];
  readonly logColumns = ['timestamp', 'action', 'userId', 'adminId'];
  readonly userStatuses: AdminUserStatus[] = ['Active', 'Suspended'];
  readonly userRoleOptions = ['Admin', 'NGO', 'Volunteer'];
  readonly opportunityStatuses: OpportunityStatus[] = ['Open', 'In Progress', 'Closed'];
  readonly pageSizeOptions = [5, 10, 25, 50];

  ngOnInit(): void {
    this.loadUsers();
    this.loadOpportunities();
  }

  ngOnDestroy(): void {
    this.usersRequest?.unsubscribe();
    this.opportunitiesRequest?.unsubscribe();
    this.logsRequest?.unsubscribe();
  }

  onTabIndexChange(index: number): void {
    if (index === 2 && !this.logsLoaded) {
      this.loadLogs();
    }
  }

  refreshCurrentData(): void {
    this.loadUsers();
    this.loadOpportunities();

    if (this.logsLoaded) {
      this.loadLogs();
    }
  }

  get filteredUsers(): AdminManagedUser[] {
    return this.users;
  }

  get filteredOpportunities(): Opportunity[] {
    return this.opportunities;
  }

  get filteredLogs(): AdminLogEntry[] {
    return this.logs;
  }

  get userRoles(): string[] {
    return this.userRoleOptions;
  }

  get logActions(): string[] {
    return [...new Set(this.logs.map((log) => log.action).filter(Boolean))].sort();
  }

  trackByUserId(_index: number, user: AdminManagedUser): string {
    return user.id;
  }

  trackByOpportunityId(_index: number, opportunity: Opportunity): string {
    return opportunity.id;
  }

  trackByLogId(_index: number, log: AdminLogEntry): string {
    return log.id;
  }

  onUserFiltersChanged(): void {
    this.userPageIndex = 0;
    this.loadUsers();
  }

  onOpportunityFiltersChanged(): void {
    this.opportunityPageIndex = 0;
    this.loadOpportunities();
  }

  onLogFiltersChanged(): void {
    this.logPageIndex = 0;
    this.loadLogs();
  }

  onUserPage(event: PageEvent): void {
    this.userPageIndex = event.pageIndex;
    this.userPageSize = event.pageSize;
    this.loadUsers();
  }

  onOpportunityPage(event: PageEvent): void {
    this.opportunityPageIndex = event.pageIndex;
    this.opportunityPageSize = event.pageSize;
    this.loadOpportunities();
  }

  onLogPage(event: PageEvent): void {
    this.logPageIndex = event.pageIndex;
    this.logPageSize = event.pageSize;
    this.loadLogs();
  }

  loadUsers(): void {
    this.usersRequest?.unsubscribe();
    this.usersLoading = true;
    this.usersError = '';

    this.usersRequest = this.adminControlsService.getUsers({
      page: this.userPageIndex + 1,
      limit: this.userPageSize,
      search: this.userSearchText,
      role: this.userRoleFilter,
      status: this.userStatusFilter
    }).subscribe({
      next: (result) => {
        this.users = result.data;
        this.userTotal = result.total;
        this.usersLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load admin users:', error);
        this.users = [];
        this.usersLoading = false;
        this.usersError = this.userFriendlyError(error, 'Unable to load users.');
        this.cdr.detectChanges();
      }
    });
  }

  loadOpportunities(): void {
    this.opportunitiesRequest?.unsubscribe();
    this.opportunitiesLoading = true;
    this.opportunitiesError = '';

    this.opportunitiesRequest = this.adminControlsService.getOpportunities({
      page: this.opportunityPageIndex + 1,
      limit: this.opportunityPageSize,
      search: this.opportunitySearchText,
      status: this.opportunityStatusFilter
    }).subscribe({
      next: (result) => {
        this.opportunities = result.data;
        this.opportunityTotal = result.total;
        this.opportunitiesLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load admin opportunities:', error);
        this.opportunities = [];
        this.opportunitiesLoading = false;
        this.opportunitiesError = this.userFriendlyError(error, 'Unable to load opportunities.');
        this.cdr.detectChanges();
      }
    });
  }

  loadLogs(): void {
    this.logsRequest?.unsubscribe();
    this.logsLoading = true;
    this.logsError = '';
    this.logsLoaded = true;

    this.logsRequest = this.adminControlsService.getLogs({
      page: this.logPageIndex + 1,
      limit: this.logPageSize,
      search: this.logSearchText,
      action: this.logActionFilter
    }).subscribe({
      next: (result) => {
        this.logs = result.data;
        this.logTotal = result.total;
        this.logsLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load admin logs:', error);
        this.logs = [];
        this.logsLoading = false;
        this.logsError = this.userFriendlyError(error, 'Unable to load admin logs.');
        this.cdr.detectChanges();
      }
    });
  }

  suspendUser(user: AdminManagedUser): void {
    this.confirm({
      title: 'Suspend User?',
      message: "This will suspend the user's account.",
      confirmLabel: 'Suspend User',
      confirmIcon: 'person_off',
      destructive: true
    }, () => this.updateUserStatus(user, 'Suspended'));
  }

  activateUser(user: AdminManagedUser): void {
    this.confirm({
      title: 'Activate User?',
      message: "This will restore the user's account access.",
      confirmLabel: 'Activate User',
      confirmIcon: 'person_check'
    }, () => this.updateUserStatus(user, 'Active'));
  }

  removeOpportunity(opportunity: Opportunity): void {
    this.confirm({
      title: 'Remove this opportunity?',
      message: 'This action will remove the opportunity from the platform.',
      confirmLabel: 'Remove Opportunity',
      confirmIcon: 'delete',
      destructive: true
    }, () => {
      this.removingOpportunityId = opportunity.id;

      this.adminControlsService.removeOpportunity(opportunity.id).subscribe({
        next: () => {
          this.opportunities = this.opportunities.filter((item) => item.id !== opportunity.id);
          this.opportunityTotal = Math.max(this.opportunityTotal - 1, 0);
          this.removingOpportunityId = '';
          this.snackBar.open('Opportunity removed successfully.', 'Close', { duration: 3500 });
          if (!this.opportunities.length && this.opportunityPageIndex > 0) {
            this.opportunityPageIndex -= 1;
            this.loadOpportunities();
          }
          if (this.logsLoaded) {
            this.loadLogs();
          }
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Failed to remove opportunity:', error);
          this.removingOpportunityId = '';
          this.snackBar.open(this.userFriendlyError(error, 'Unable to remove opportunity.'), 'Close', { duration: 4500 });
          this.cdr.detectChanges();
        }
      });
    });
  }

  ownerName(opportunity: Opportunity): string {
    const postedBy = opportunity.postedBy;

    if (postedBy && typeof postedBy === 'object') {
      return postedBy.fullName || postedBy.name || postedBy.username || postedBy.email || 'Owner unavailable';
    }

    return opportunity.ngoId || 'Owner unavailable';
  }

  opportunityDetails(opportunity: Opportunity): string {
    return [
      opportunity.category,
      opportunity.city,
      opportunity.state
    ].filter(Boolean).join(' - ');
  }

  isUpdatingUser(user: AdminManagedUser): boolean {
    return this.updatingUserId === user.id;
  }

  private updateUserStatus(user: AdminManagedUser, status: AdminUserStatus): void {
    if (this.updatingUserId) {
      return;
    }

    this.updatingUserId = user.id;
    const request = status === 'Suspended'
      ? this.adminControlsService.suspendUser(user.id)
      : this.adminControlsService.activateUser(user.id);

    request.subscribe({
      next: (updatedUser) => {
        const resolvedUser: AdminManagedUser = updatedUser?.id
          ? updatedUser
          : { ...user, status };

        this.users = this.users.map((item) =>
          item.id === user.id ? resolvedUser : item
        );
        this.updatingUserId = '';
        const message = status === 'Suspended'
          ? 'User suspended successfully.'
          : 'User activated successfully.';
        this.snackBar.open(message, 'Close', { duration: 3500 });
        if (this.logsLoaded) {
          this.loadLogs();
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to update user status:', error);
        this.updatingUserId = '';
        this.snackBar.open(this.userFriendlyError(error, 'Unable to update user status.'), 'Close', { duration: 4500 });
        this.cdr.detectChanges();
      }
    });
  }

  private userFriendlyError(error: unknown, fallback: string): string {
    if (error instanceof Error) {
      return error.message;
    }

    const httpError = error as {
      status?: number;
      error?: { message?: string };
      message?: string;
    };

    switch (httpError.status) {
      case 400:
        return httpError.error?.message || 'Please check the request and try again.';
      case 401:
        return 'Please log in again to continue.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return httpError.error?.message || 'The requested record was not found.';
      case 500:
        return 'The server could not complete the request. Please try again later.';
      default:
        return httpError.error?.message || httpError.message || fallback;
    }
  }

  private confirm(data: AdminConfirmDialogData, action: () => void): void {
    this.dialog
      .open(AdminConfirmDialog, {
        width: '420px',
        data
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          action();
        }
      });
  }
}
