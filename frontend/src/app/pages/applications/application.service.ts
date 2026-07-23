import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { API_BASE_URL } from '../../core/api/api-config';
import { ApplicationStatus, VolunteerApplication, VolunteerApplicationCheck, VolunteerApplicationRequest } from './application.model';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface ApplicationApiModel {
  _id: string;
  id?: string;
  opportunityId?: string | { _id?: string; title?: string } | null;
  opportunityTitle?: string;
  volunteerId?: { _id?: string; fullName?: string; email?: string } | string | null;
  fullName?: string;
  email?: string;
  status?: ApplicationStatus;
  createdAt?: string;
}

interface ApplicationCheckApiModel {
  applied: boolean;
  application?: ApplicationApiModel | null;
}

@Injectable({ providedIn: 'root' })
export class ApplicationService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly applicationsUrl = `${this.apiBaseUrl}/applications`;

  apply(request: VolunteerApplicationRequest): Observable<VolunteerApplication> {
    return this.http.post<ApiResponse<ApplicationApiModel>>(
      `${this.applicationsUrl}/apply`,
      request,
      { headers: this.headers() }
    ).pipe(map((response) => this.fromApi(response.data)));
  }

  getApplications(): Observable<VolunteerApplication[]> {
    return this.http.get<ApiResponse<ApplicationApiModel[]>>(
      this.applicationsUrl,
      { headers: this.headers() }
    ).pipe(map((response) => response.data.map((application) => this.fromApi(application))));
  }

  updateStatus(id: string, status: ApplicationStatus): Observable<VolunteerApplication> {
    const action = status === 'Accepted' ? 'accept' : 'reject';
    return this.http.put<ApiResponse<ApplicationApiModel>>(
      `${this.applicationsUrl}/${id}/${action}`,
      {},
      { headers: this.headers() }
    ).pipe(map((response) => this.fromApi(response.data)));
  }

  hasApplication(opportunityId: string): Observable<VolunteerApplicationCheck> {
    return this.http.get<ApiResponse<ApplicationCheckApiModel>>(
      `${this.applicationsUrl}/opportunity/${opportunityId}/me`,
      { headers: this.headers() }
    ).pipe(map((response) => ({
      applied: response.data.applied,
      application: response.data.application ? this.fromApi(response.data.application) : undefined,
    })));
  }

  private headers(): HttpHeaders {
    const token = typeof localStorage === 'undefined' ? '' : localStorage.getItem('token');
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  private fromApi(application: ApplicationApiModel): VolunteerApplication {
    const opportunity = typeof application.opportunityId === 'object' ? application.opportunityId : undefined;
    const volunteer = typeof application.volunteerId === 'object' ? application.volunteerId : undefined;

    return {
      id: application._id || application.id || '',
      opportunityId: typeof application.opportunityId === 'string'
        ? application.opportunityId
        : opportunity?._id || '',
      opportunityTitle: application.opportunityTitle || opportunity?.title || 'Opportunity no longer exists',
      fullName: application.fullName || volunteer?.fullName || '',
      email: application.email || volunteer?.email || '',
      status: application.status || 'Pending',
      appliedDate: application.createdAt || '',
    };
  }
}
