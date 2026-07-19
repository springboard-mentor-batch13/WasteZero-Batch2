import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, tap } from 'rxjs';

import { Opportunity, OpportunityDraft, OpportunityStatus } from './opportunity.model';

interface ApiResponse<T> { success: boolean; message?: string; data: T; }

interface OpportunityApiModel {
  _id: string;
  title: string;
  description: string;
  requiredSkills?: string[];
  duration: string;
  location: string;
  category?: Opportunity['category'];
  eventDate?: string;
  requiredVolunteers?: number;
  imageUrl?: string | null;
  status?: string;
  createdAt?: string;
  ngoId?: string;
  postedBy?: Opportunity['postedBy'];
}

@Injectable({ providedIn: 'root' })
export class OpportunityService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:5000/api/opportunities';

  getAll(): Observable<Opportunity[]> {
    return this.http.get<ApiResponse<OpportunityApiModel[]>>(this.apiUrl, { headers: this.headers() }).pipe(
      tap((response) => {
        console.log('Fetched opportunities:', response);
        console.log('Number of opportunities received:', response.data.length);
      }),
      map((response) => response.data.map((opportunity) => this.fromApi(opportunity)))
    );
  }

  getById(id: string): Observable<Opportunity> {
    return this.http.get<ApiResponse<OpportunityApiModel>>(`${this.apiUrl}/${id}`, { headers: this.headers() }).pipe(
      tap((response) => console.log('Opportunity:', response.data)),
      map((response) => this.fromApi(response.data))
    );
  }

  getByStatus(status: OpportunityStatus): Observable<Opportunity[]> {
    const params = new HttpParams().set('status', status);
    return this.http.get<ApiResponse<OpportunityApiModel[]>>(`${this.apiUrl}/filter`, { headers: this.headers(), params }).pipe(
      map((response) => response.data.map((opportunity) => this.fromApi(opportunity)))
    );
  }

  create(draft: OpportunityDraft): Observable<Opportunity> {
    return this.http.post<ApiResponse<OpportunityApiModel>>(this.apiUrl, this.toFormData(draft), { headers: this.headers() }).pipe(
      map((response) => this.fromApi(response.data))
    );
  }

  update(id: string, draft: OpportunityDraft): Observable<Opportunity> {
    return this.http.put<ApiResponse<OpportunityApiModel>>(`${this.apiUrl}/${id}`, this.toFormData(draft), { headers: this.headers() }).pipe(
      map((response) => this.fromApi(response.data))
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`, { headers: this.headers() }).pipe(map(() => undefined));
  }

  private headers(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  private fromApi(opportunity: OpportunityApiModel): Opportunity {
    return {
      id: opportunity._id,
      title: opportunity.title,
      description: opportunity.description,
      location: opportunity.location,
      category: opportunity.category ?? 'Community Service',
      eventDate: opportunity.eventDate ?? opportunity.duration,
      requiredVolunteers: opportunity.requiredVolunteers ?? 0,
      skillsRequired: opportunity.requiredSkills ?? [],
      imageUrl: opportunity.imageUrl ?? undefined,
      status: opportunity.status ?? 'Open',
      createdAt: opportunity.createdAt,
      ngoId: opportunity.ngoId,
      // Older records were created while the form incorrectly submitted the
      // event date as duration. Do not present that date as a duration.
      duration: opportunity.duration && opportunity.duration !== opportunity.eventDate
        ? opportunity.duration
        : undefined,
      postedBy: opportunity.postedBy
    };
  }

  private toFormData(draft: OpportunityDraft): FormData {
    const formData = new FormData();
    formData.append('title', draft.title);
    formData.append('status', draft.status);
    formData.append('description', draft.description);
    formData.append('location', draft.location);
    formData.append('eventDate', draft.eventDate);
    formData.append('requiredVolunteers', String(draft.requiredVolunteers));
    formData.append('requiredSkills', JSON.stringify(draft.skillsRequired));
    formData.append('duration', draft.duration || '');
    formData.append('removeImage', String(!!draft.removeImage));
    if (draft.imageFile) formData.append('image', draft.imageFile);
    return formData;
  }
}
