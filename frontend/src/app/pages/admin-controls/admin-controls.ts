import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';

import { Opportunity } from '../opportunities/opportunity.model';
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
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTableModule,
    MatTabsModule,
  ],
  templateUrl: './admin-controls.html',
  styleUrl: './admin-controls.css'
})
export class AdminControls implements OnInit {
  private readonly adminControlsService = inject(AdminControlsService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);

  users: AdminManagedUser[] = [];
  opportunities: Opportunity[] = [];
  logs: AdminLogEntry[] = [];

  usersLoading = true;
  opportunitiesLoading = true;
  logsLoading = true;

  usersError = '';
  opportunitiesError = '';
  logsError = '';

  userSearchText = '';
  userRoleFilter = '';
  userStatusFilter: AdminUserStatus | '' = '';
  opportunitySearchText = '';
  opportunityStatusFilter = '';
  logSearchText = '';
  logStatusFilter = '';

  updatingUserId = '';
  removingOpportunityId = '';

  readonly userColumns = ['name', 'email', 'role', 'status', 'actions'];
  readonly opportunityColumns = ['title', 'owner', 'status', 'createdAt', 'details', 'actions'];
  readonly logColumns = ['timestamp', 'actor', 'action', 'target', 'description', 'status'];
  readonly userStatuses: AdminUserStatus[] = ['Active', 'Suspended'];
  readonly opportunityStatuses = ['Open', 'In Progress', 'Closed'];

  ngOnInit(): void {
    this.loadUsers();
    this.loadOpportunities();
    this.loadLogs();
  }

  get filteredUsers(): AdminManagedUser[] {
    const search = this.userSearchText.toLowerCase().trim();

    return this.users.filter((user) => {
      const matchesSearch = !search ||
        user.fullName.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        user.role.toLowerCase().includes(search);
      const matchesRole = !this.userRoleFilter || user.role === this.userRoleFilter;
      const matchesStatus = !this.userStatusFilter || user.status === this.userStatusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }

  get filteredOpportunities(): Opportunity[] {
    const search = this.opportunitySearchText.toLowerCase().trim();

    return this.opportunities.filter((opportunity) => {
      const owner = this.ownerName(opportunity).toLowerCase();
      const matchesSearch = !search ||
        opportunity.title.toLowerCase().includes(search) ||
        owner.includes(search) ||
        opportunity.category.toLowerCase().includes(search) ||
        opportunity.location.toLowerCase().includes(search);
      const matchesStatus = !this.opportunityStatusFilter ||
        opportunity.status === this.opportunityStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }

  get filteredLogs(): AdminLogEntry[] {
    const search = this.logSearchText.toLowerCase().trim();

    return this.logs.filter((log) => {
      const matchesSearch = !search ||
        log.actor.toLowerCase().includes(search) ||
        log.action.toLowerCase().includes(search) ||
        log.target.toLowerCase().includes(search) ||
        log.description.toLowerCase().includes(search);
      const matchesStatus = !this.logStatusFilter || log.status === this.logStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }

  get userRoles(): string[] {
    return [...new Set(this.users.map((user) => user.role).filter(Boolean))].sort();
  }

  get logStatuses(): string[] {
    return [...new Set(this.logs.map((log) => log.status || '').filter(Boolean))].sort();
  }

  loadUsers(): void {
    this.usersLoading = true;
    this.usersError = '';

    this.adminControlsService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.usersLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load admin users:', error);
        this.users = [];
        this.usersLoading = false;
        this.usersError = error.error?.message || error.message || 'Unable to load users.';
        this.cdr.detectChanges();
      }
    });
  }

  loadOpportunities(): void {
    this.opportunitiesLoading = true;
    this.opportunitiesError = '';

    this.adminControlsService.getOpportunities().subscribe({
      next: (opportunities) => {
        this.opportunities = opportunities;
        this.opportunitiesLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load admin opportunities:', error);
        this.opportunities = [];
        this.opportunitiesLoading = false;
        this.opportunitiesError = error.error?.message || 'Unable to load opportunities.';
        this.cdr.detectChanges();
      }
    });
  }

  loadLogs(): void {
    this.logsLoading = true;
    this.logsError = '';

    this.adminControlsService.getLogs().subscribe({
      next: (logs) => {
        this.logs = logs;
        this.logsLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load admin logs:', error);
        this.logs = [];
        this.logsLoading = false;
        this.logsError = error.error?.message || error.message || 'Unable to load admin logs.';
        this.cdr.detectChanges();
      }
    });
  }

  suspendUser(user: AdminManagedUser): void {
    this.confirm({
      title: 'Suspend User?',
      message: 'This will prevent the user from accessing the platform.',
      confirmLabel: 'Suspend User',
      confirmIcon: 'person_off',
      destructive: true
    }, () => this.updateUserStatus(user, 'Suspended'));
  }

  activateUser(user: AdminManagedUser): void {
    this.confirm({
      title: 'Activate User?',
      message: "This will restore the user's access.",
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
          this.removingOpportunityId = '';
          this.snackBar.open('Opportunity removed successfully.', 'Close', { duration: 3500 });
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Failed to remove opportunity:', error);
          this.removingOpportunityId = '';
          this.snackBar.open(error.error?.message || 'Unable to remove opportunity.', 'Close', { duration: 4500 });
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
        this.users = this.users.map((item) =>
          item.id === updatedUser.id ? updatedUser : item
        );
        this.updatingUserId = '';
        this.snackBar.open(`User ${status.toLowerCase()} successfully.`, 'Close', { duration: 3500 });
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to update user status:', error);
        this.updatingUserId = '';
        this.snackBar.open(error.error?.message || error.message || 'Unable to update user status.', 'Close', { duration: 4500 });
        this.cdr.detectChanges();
      }
    });
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
