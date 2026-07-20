import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { Opportunity, OpportunityDraft, OpportunityStatus } from './opportunity.model';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface OpportunityApiModel {
  _id: string;
  ngoId?: string;
  postedBy?: Opportunity['postedBy'];
  title: string;
  description: string;
  requiredSkills?: string[];
  duration: string;
  city?: string;
  state?: string;
  date?: string;
  status?: OpportunityStatus;
  imageUrl?: string | null;
  createdAt?: string;
  location?: string;
  eventDate?: string;
}

@Injectable({ providedIn: 'root' })
export class OpportunityService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:5000/api/opportunities';

  getAll(): Observable<Opportunity[]> {
    return this.http.get<ApiResponse<OpportunityApiModel[]>>(this.apiUrl, { headers: this.headers() }).pipe(
      map((response) => response.data.map((opportunity) => this.fromApi(opportunity)))
    );
  }

  getById(id: string): Observable<Opportunity> {
    return this.http.get<ApiResponse<OpportunityApiModel>>(`${this.apiUrl}/${id}`, { headers: this.headers() }).pipe(
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
    const legacyPlace = this.parseLegacyPlace(opportunity.location);

    return {
      id: opportunity._id,
      ngoId: opportunity.ngoId,
      postedBy: opportunity.postedBy,
      title: opportunity.title,
      description: opportunity.description,
      requiredSkills: opportunity.requiredSkills ?? [],
      duration: opportunity.duration,
      city: opportunity.city || legacyPlace.city,
      state: opportunity.state || legacyPlace.state,
      date: this.toDate(opportunity.date || opportunity.eventDate || opportunity.createdAt),
      status: opportunity.status ?? 'Open',
      imageUrl: opportunity.imageUrl ?? undefined,
      createdAt: opportunity.createdAt,
    };
  }

  private toFormData(draft: OpportunityDraft): FormData {
    const formData = new FormData();
    formData.append('title', draft.title);
    formData.append('description', draft.description);
    formData.append('requiredSkills', JSON.stringify(draft.requiredSkills));
    formData.append('duration', draft.duration);
    formData.append('city', draft.city);
    formData.append('state', draft.state);
    formData.append('date', this.toIsoDate(draft.date));
    formData.append('status', draft.status);
    formData.append('imageUrl', draft.imageUrl ?? '');
    formData.append('removeImage', String(!!draft.removeImage));
    if (draft.imageFile) formData.append('image', draft.imageFile);
    return formData;
  }

  private toDate(date?: string): Date {
    if (!date) return new Date();
    const [year, month, day] = date.split('T')[0].split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private toIsoDate(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  private parseLegacyPlace(location?: string): { city: string; state: string } {
    if (!location?.trim()) return { city: 'Not specified', state: 'Not specified' };
    const parts = location.split(',').map((part) => part.trim()).filter(Boolean);
    return {
      city: parts.at(-1) || location,
      state: 'Not specified',
    };
  }
}
