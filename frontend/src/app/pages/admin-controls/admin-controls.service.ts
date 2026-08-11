import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';

import { Opportunity } from '../opportunities/opportunity.model';
import { OpportunityService } from '../opportunities/opportunity.service';

export type AdminUserStatus = 'Active' | 'Suspended';

export interface AdminManagedUser {
  id: string;
  fullName: string;
  email: string;
  role: 'Volunteer' | 'NGO' | 'Admin' | string;
  status: AdminUserStatus;
}

export interface AdminLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  description: string;
  status?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminControlsService {
  private readonly opportunityService = inject(OpportunityService);

  private readonly mockUsers: AdminManagedUser[] = [
    {
      id: 'mock-volunteer-1',
      fullName: 'Volunteer Account',
      email: 'volunteer@example.com',
      role: 'Volunteer',
      status: 'Active'
    },
    {
      id: 'mock-ngo-1',
      fullName: 'NGO Account',
      email: 'ngo@example.com',
      role: 'NGO',
      status: 'Active'
    }
  ];

  private readonly mockLogs: AdminLogEntry[] = [
    {
      id: 'mock-log-1',
      timestamp: new Date().toISOString(),
      actor: 'Admin',
      action: 'Frontend ready',
      target: 'Administrative controls',
      description: 'User status and admin log APIs are pending backend implementation.',
      status: 'Pending API'
    }
  ];

  getUsers(): Observable<AdminManagedUser[]> {
    // TODO: Replace mock data with Gaytri's user management API when the route is available.
    return of(this.mockUsers.map((user) => ({ ...user })));
  }

  suspendUser(userId: string): Observable<AdminManagedUser> {
    // TODO: Integrate the real suspend-user endpoint when the backend exposes it.
    return this.updateMockUserStatus(userId, 'Suspended');
  }

  activateUser(userId: string): Observable<AdminManagedUser> {
    // TODO: Integrate the real activate-user endpoint when the backend exposes it.
    return this.updateMockUserStatus(userId, 'Active');
  }

  getOpportunities(): Observable<Opportunity[]> {
    return this.opportunityService.getAll();
  }

  removeOpportunity(opportunityId: string): Observable<void> {
    return this.opportunityService.delete(opportunityId);
  }

  getLogs(): Observable<AdminLogEntry[]> {
    // TODO: Replace mock data with Gaytri's admin logs API when the route is available.
    return of(this.mockLogs.map((log) => ({ ...log })));
  }

  private updateMockUserStatus(
    userId: string,
    status: AdminUserStatus
  ): Observable<AdminManagedUser> {
    const user = this.mockUsers.find((item) => item.id === userId);

    if (!user) {
      return throwError(() => new Error('User not found.'));
    }

    user.status = status;
    return of({ ...user });
  }
}
