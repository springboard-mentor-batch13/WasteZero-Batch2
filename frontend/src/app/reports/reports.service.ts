import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface DashboardReport {
  users: {
    Total: number;
    Volunteer: number;
    NGO: number;
    Admin: number;
    Active: number;
    Suspended: number;
  };
  opportunities: {
    Total: number;
    Open: number;
    Closed: number;
    'In Progress': number;
    Removed: number;
  };
  applications: {
    Total: number;
    Pending: number;
    Accepted: number;
    Rejected: number;
  };
  recentActivity: {
    users: Array<{
      fullName: string;
      email: string;
      role: string;
      status: string;
      createdAt: string;
    }>;
    opportunities: Array<{
      title: string;
      category: string;
      status: string;
      createdAt: string;
    }>;
  };
}

export interface UserReport {
  _id: string;
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
}

export interface OpportunityReport {
  _id: string;
  totalOpportunities: number;
  open: number;
  closed: number;
  inProgress: number;
  removed: number;
  totalVolunteersNeeded: number;
}

export interface VolunteerResponseReport {
  _id: string;
  totalApplications: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReportsService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl = 'http://localhost:5000/api/admin';

  private headers(): HttpHeaders {
    const token =
      typeof localStorage === 'undefined'
        ? ''
        : localStorage.getItem('token');

    return new HttpHeaders(
      token
        ? {
          Authorization: `Bearer ${token}`
        }
        : {}
    );
  }

  getDashboardStats(): Observable<DashboardReport> {
    return this.http
      .get<ApiResponse<DashboardReport>>(
        `${this.apiUrl}/dashboard-stats`,
        {
          headers: this.headers()
        }
      )
      .pipe(
        map(response => response.data)
      );
  }

  getUserReport(): Observable<UserReport[]> {
    return this.http
      .get<ApiResponse<UserReport[]>>(
        `${this.apiUrl}/reports/users`,
        {
          headers: this.headers()
        }
      )
      .pipe(
        map(response => response.data)
      );
  }

  getOpportunityReport(): Observable<OpportunityReport[]> {
    return this.http
      .get<ApiResponse<OpportunityReport[]>>(
        `${this.apiUrl}/reports/opportunities`,
        {
          headers: this.headers()
        }
      )
      .pipe(
        map(response => response.data)
      );
  }

  getVolunteerResponseReport(): Observable<VolunteerResponseReport[]> {
    return this.http
      .get<ApiResponse<VolunteerResponseReport[]>>(
        `${this.apiUrl}/reports/volunteer-responses`,
        {
          headers: this.headers()
        }
      )
      .pipe(
        map(response => response.data)
      );
  }

  downloadUsersReport(): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/reports/export/users`,
      {
        headers: this.headers(),
        responseType: 'blob'
      }
    );
  }

  downloadOpportunitiesReport(): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/reports/export/opportunities`,
      {
        headers: this.headers(),
        responseType: 'blob'
      }
    );
  }

  downloadApplicationsReport(): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/reports/export/applications`,
      {
        headers: this.headers(),
        responseType: 'blob'
      }
    );
  }
}