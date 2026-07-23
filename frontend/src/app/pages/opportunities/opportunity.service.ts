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
  id?: string;
  ngoId?: string | { _id?: string };
  postedBy?: Opportunity['postedBy'];
  title: string;
  category?: string;
  description: string;
  requiredSkills?: string[] | string;
  skillsRequired?: string[] | string;
  duration?: string;
  city?: string;
  state?: string;
  date?: string;
  eventDate?: string;
  location?: string;
  requiredVolunteers?: number | string;
  status?: OpportunityStatus;
  imageUrl?: string | null;
  imagePreviewUrl?: string | null;
  createdAt?: string;
}

export interface DashboardStats {
  totalOpportunities: number;
  openOpportunities: number;
  closedOpportunities: number;
  inProgressOpportunities: number;
}

@Injectable({
  providedIn: 'root'
})
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
    return this.filter('', status);
  }

  search(keyword: string): Observable<Opportunity[]> {
    const params = new HttpParams().set('keyword', keyword);
    return this.http.get<ApiResponse<OpportunityApiModel[]>>(`${this.apiUrl}/search`, { headers: this.headers(), params }).pipe(
      map((response) => response.data.map((opportunity) => this.fromApi(opportunity)))
    );
  }

  filter(location = '', status: OpportunityStatus | '' = '', skill = '', category = ''): Observable<Opportunity[]> {
    let params = new HttpParams();
    if (location) params = params.set('location', location);
    if (status) params = params.set('status', status);
    if (skill) params = params.set('skill', skill);
    if (category) params = params.set('category', category);

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

  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<ApiResponse<DashboardStats>>(`${this.apiUrl}/dashboard/stats`, { headers: this.headers() }).pipe(
      map((response) => response.data)
    );
  }

  private headers(): HttpHeaders {
    const token = typeof localStorage === 'undefined' ? '' : localStorage.getItem('token');
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  private fromApi(opportunity: OpportunityApiModel): Opportunity {
    const legacyPlace = this.parseLegacyPlace(opportunity.location);
    const requiredSkills = this.normalizeSkills(opportunity.requiredSkills ?? opportunity.skillsRequired);
    const date = this.toDate(opportunity.date || opportunity.eventDate || opportunity.createdAt);
    const city = opportunity.city || legacyPlace.city;
    const state = opportunity.state || legacyPlace.state;
    const location = opportunity.location || [city, state].filter(Boolean).join(', ');
    const imageUrl = opportunity.imageUrl ?? opportunity.imagePreviewUrl ?? undefined;

    return {
      id: opportunity._id || opportunity.id || '',
      ngoId: this.toId(opportunity.ngoId),
      postedBy: opportunity.postedBy,
      title: opportunity.title,
      category: opportunity.category || '',
      description: opportunity.description,
      requiredSkills,
      skillsRequired: requiredSkills,
      duration: opportunity.duration || '',
      city,
      state,
      date,
      eventDate: opportunity.eventDate || this.toIsoDate(date),
      location,
      requiredVolunteers: Number(opportunity.requiredVolunteers ?? 1),
      status: opportunity.status ?? 'Open',
      imageUrl,
      imagePreviewUrl: imageUrl,
      createdAt: opportunity.createdAt,
    };
  }

  private toFormData(draft: OpportunityDraft): FormData {
    const date = draft.date instanceof Date ? draft.date : this.toDate(String(draft.date));
    const location = draft.location || [draft.city, draft.state].filter(Boolean).join(', ');
    const requiredSkills = draft.requiredSkills?.length ? draft.requiredSkills : draft.skillsRequired ?? [];

    const formData = new FormData();
    formData.append('title', draft.title);
    formData.append('category', draft.category);
    formData.append('description', draft.description);
    formData.append('requiredSkills', JSON.stringify(requiredSkills));
    formData.append('duration', draft.duration);
    formData.append('city', draft.city);
    formData.append('state', draft.state);
    formData.append('date', this.toIsoDate(date));
    formData.append('location', location);
    formData.append('eventDate', draft.eventDate || this.toIsoDate(date));
    formData.append('requiredVolunteers', String(draft.requiredVolunteers));
    formData.append('status', draft.status);
    formData.append('imageUrl', draft.imageUrl ?? '');
    formData.append('removeImage', String(!!draft.removeImage));
    if (draft.imageFile) formData.append('image', draft.imageFile);
    return formData;
  }

  private normalizeSkills(value: unknown): string[] {
    if (Array.isArray(value)) return value.map((skill) => String(skill).trim()).filter(Boolean);
    if (typeof value === 'string') return value.split(',').map((skill) => skill.trim()).filter(Boolean);
    return [];
  }

  private toId(value?: string | { _id?: string }): string | undefined {
    if (!value) return undefined;
    return typeof value === 'string' ? value : value._id;
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
      city: parts[0] || location,
      state: parts[1] || 'Not specified',
    };
  }
}
