import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { Opportunity, OpportunityStatus } from '../opportunities/opportunity.model';
import { OpportunityService } from '../opportunities/opportunity.service';

export type AdminUserStatus = 'Active' | 'Suspended';

export interface AdminManagedUser {
  id: string;
  fullName: string;
  username?: string;
  email: string;
  role: 'Volunteer' | 'NGO' | 'Admin' | string;
  status: AdminUserStatus;
}

export interface AdminLogEntry {
  id: string;
  userId?: string;
  adminId?: string;
  timestamp: string;
  action: string;
  status?: string;
}

export interface AdminPaginationQuery {
  page: number;
  limit: number;
  search?: string;
  role?: string;
  status?: string;
  action?: string;
}

export interface AdminOpportunityPaginationQuery {
  page: number;
  limit: number;
  search?: string;
  status?: OpportunityStatus | '';
}

export interface AdminPagedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface AdminApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface AdminUserApiModel {
  id?: string;
  _id?: string;
  fullName?: string;
  username?: string;
  email?: string;
  role?: string;
  status?: AdminUserStatus;
}

interface AdminLogApiModel {
  id?: string;
  _id?: string;
  action?: string;
  userId?: string | { _id?: string };
  adminId?: string | { _id?: string };
  timestamp?: string;
  status?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminControlsService {
  private readonly http = inject(HttpClient);
  private readonly opportunityService = inject(OpportunityService);
  private readonly adminApiUrl = 'http://localhost:5000/api/admin';

  getUsers(query: AdminPaginationQuery): Observable<AdminPagedResult<AdminManagedUser>> {
    return this.http
      .get<AdminApiResponse<AdminUserApiModel[]>>(
        `${this.adminApiUrl}/users`,
        {
          headers: this.headers(),
          params: this.toParams(query)
        }
      )
      .pipe(
        map((response) => this.toPagedResult(
          response,
          (response.data || []).map((user) => this.fromUserApi(user))
        ))
      );
  }

  suspendUser(userId: string): Observable<AdminManagedUser | null> {
    return this.http
      .patch<AdminApiResponse<AdminUserApiModel>>(
        `${this.adminApiUrl}/users/${userId}/suspend`,
        {},
        { headers: this.headers() }
      )
      .pipe(map((response) => response.data ? this.fromUserApi(response.data) : null));
  }

  activateUser(userId: string): Observable<AdminManagedUser | null> {
    return this.http
      .patch<AdminApiResponse<AdminUserApiModel>>(
        `${this.adminApiUrl}/users/${userId}/activate`,
        {},
        { headers: this.headers() }
      )
      .pipe(map((response) => response.data ? this.fromUserApi(response.data) : null));
  }

  getOpportunities(query: AdminOpportunityPaginationQuery): Observable<AdminPagedResult<Opportunity>> {
    return this.opportunityService.getPaged(query);
  }

  removeOpportunity(opportunityId: string): Observable<void> {
    return this.opportunityService.delete(opportunityId);
  }

  getLogs(query: AdminPaginationQuery): Observable<AdminPagedResult<AdminLogEntry>> {
    return this.http
      .get<AdminApiResponse<AdminLogApiModel[]>>(
        `${this.adminApiUrl}/logs`,
        {
          headers: this.headers(),
          params: this.toParams(query)
        }
      )
      .pipe(
        map((response) => this.toPagedResult(
          response,
          (response.data || []).map((log) => this.fromLogApi(log))
        ))
      );
  }

  private toParams(query: AdminPaginationQuery): HttpParams {
    let params = new HttpParams()
      .set('page', String(query.page))
      .set('limit', String(query.limit));

    if (query.search?.trim()) {
      params = params.set('search', query.search.trim());
    }

    if (query.role) {
      params = params.set('role', query.role);
    }

    if (query.status) {
      params = params.set('status', query.status);
    }

    if (query.action) {
      params = params.set('action', query.action);
    }

    return params;
  }

  private toPagedResult<T>(response: AdminApiResponse<unknown>, data: T[]): AdminPagedResult<T> {
    const pagination = response.pagination;

    return {
      data,
      total: pagination?.total ?? data.length,
      page: pagination?.page ?? 1,
      limit: pagination?.limit ?? data.length,
      totalPages: pagination?.totalPages ?? 1
    };
  }

  private fromUserApi(user: AdminUserApiModel): AdminManagedUser {
    return {
      id: user.id || user._id || '',
      fullName: user.fullName || user.username || 'Unnamed user',
      username: user.username,
      email: user.email || '',
      role: user.role || '',
      status: user.status || 'Active'
    };
  }

  private fromLogApi(log: AdminLogApiModel): AdminLogEntry {
    return {
      id: log.id || log._id || '',
      userId: this.toId(log.userId),
      adminId: this.toId(log.adminId),
      timestamp: log.timestamp || '',
      action: log.action || '',
      status: log.status
    };
  }

  private toId(value?: string | { _id?: string }): string | undefined {
    return typeof value === 'string' ? value : value?._id;
  }

  private headers(): HttpHeaders {
    const token =
      typeof localStorage === 'undefined'
        ? ''
        : localStorage.getItem('token');

    return new HttpHeaders(
      token
        ? { Authorization: `Bearer ${token}` }
        : {}
    );
  }
}
