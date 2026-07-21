import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, delay, map, of, throwError } from 'rxjs';

import { API_BASE_URL } from '../../core/api/api-config';
import { ApplicationStatus, VolunteerApplication, VolunteerApplicationRequest } from './application.model';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class ApplicationService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly applicationsUrl = `${this.apiBaseUrl}/applications`;
  private readonly opportunitiesUrl = `${this.apiBaseUrl}/opportunities`;
  private readonly storageKey = 'wastezero.volunteerApplications';
  private readonly useBackendApi = false;

  apply(request: VolunteerApplicationRequest): Observable<VolunteerApplication> {
    // TODO: Replace placeholder storage with POST /api/opportunities/:id/apply when backend is available.
    if (this.useBackendApi) {
      return this.http.post<ApiResponse<VolunteerApplication>>(
        `${this.opportunitiesUrl}/${request.opportunityId}/apply`,
        request,
        { headers: this.headers() }
      ).pipe(map((response) => response.data));
    }

    const existingApplication = this.readApplications().find((application) =>
      application.opportunityId === request.opportunityId &&
      application.volunteerUserId === request.volunteerUserId
    );

    if (existingApplication) {
      return of(existingApplication).pipe(delay(250));
    }

    const application: VolunteerApplication = {
      id: this.createId(request),
      ...request,
      status: 'Pending',
    };

    this.writeApplications([application, ...this.readApplications()]);
    return of(application).pipe(delay(450));
  }

  getApplications(): Observable<VolunteerApplication[]> {
    // TODO: Replace placeholder storage with GET /api/applications when backend is available.
    if (this.useBackendApi) {
      return this.http.get<ApiResponse<VolunteerApplication[]>>(
        this.applicationsUrl,
        { headers: this.headers() }
      ).pipe(map((response) => response.data));
    }

    return of(this.readApplications()).pipe(delay(350));
  }

  updateStatus(id: string, status: ApplicationStatus): Observable<VolunteerApplication> {
    // TODO: Replace placeholder storage with PATCH /api/applications/:id/status when backend is available.
    if (this.useBackendApi) {
      return this.http.patch<ApiResponse<VolunteerApplication>>(
        `${this.applicationsUrl}/${id}/status`,
        { status },
        { headers: this.headers() }
      ).pipe(map((response) => response.data));
    }

    const applications = this.readApplications();
    const index = applications.findIndex((application) => application.id === id);

    if (index < 0) {
      return throwError(() => new Error('Application not found.'));
    }

    const updatedApplication = { ...applications[index], status };
    applications[index] = updatedApplication;
    this.writeApplications(applications);
    return of(updatedApplication).pipe(delay(300));
  }

  hasApplication(opportunityId: string, volunteerUserId: string): boolean {
    return this.readApplications().some((application) =>
      application.opportunityId === opportunityId &&
      application.volunteerUserId === volunteerUserId
    );
  }

  private headers(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  private readApplications(): VolunteerApplication[] {
    if (typeof localStorage === 'undefined') return [];

    try {
      const applications = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
      return Array.isArray(applications) ? applications : [];
    } catch {
      return [];
    }
  }

  private writeApplications(applications: VolunteerApplication[]): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(this.storageKey, JSON.stringify(applications));
  }

  private createId(request: VolunteerApplicationRequest): string {
    return `${request.volunteerUserId}-${request.opportunityId}-${Date.now()}`;
  }
}
