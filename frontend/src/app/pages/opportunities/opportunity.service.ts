import { Injectable } from '@angular/core';
import { Opportunity, OpportunityDraft } from './opportunity.model';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
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

  private readonly apiUrl = 'http://localhost:5000/api/opportunities';

  private getToken(): string {
    if (typeof localStorage === 'undefined') {
      return '';
    }

    return localStorage.getItem('token') || '';
  }

  private parseJwtPayload(): any {
    const token = this.getToken();
    if (!token) return null;

    const parts = token.split('.');
    if (parts.length !== 3) return null;

    try {
      const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const decoded = JSON.parse(decodeURIComponent(Array.prototype.map.call(atob(payload), (c: string) => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`).join('')));
      return decoded;
    } catch {
      return null;
    }
  }

  getUserRole(): string | null {
    if (typeof localStorage !== 'undefined') {
      const storedRole = localStorage.getItem('role');
      if (storedRole) {
        return storedRole;
      }
    }

    const payload = this.parseJwtPayload();
    if (!payload) return null;
    return payload.role ?? payload.user?.role ?? null;
  }

  private getHeaders(): HeadersInit {
    const token = this.getToken();
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }

    return {
      Authorization: `Bearer ${token}`
    };
  }

  private mapBackendToFrontend(data: any): Opportunity {
    const id = data?._id?.toString?.() ?? data?.id?.toString?.() ?? '';

    return {
      id,
      title: data?.title ?? '',
      category: data?.category ?? '',
      description: data?.description ?? '',
      location: data?.location ?? '',
      eventDate: data?.eventDate ?? data?.duration ?? '',
      requiredVolunteers: Number(data?.requiredVolunteers ?? 0),
      skillsRequired: this.normalizeSkills(data?.requiredSkills ?? data?.skillsRequired),
      imagePreviewUrl: data?.imagePreviewUrl ?? data?.imageUrl,
      imageFile: undefined
    };
  }

  private createFormData(draft: OpportunityDraft): FormData {
    const formData = new FormData();

    formData.append('title', draft.title);
    formData.append('category', draft.category);
    formData.append('description', draft.description);
    formData.append('duration', draft.eventDate);
    formData.append('location', draft.location);
    formData.append('requiredVolunteers', String(draft.requiredVolunteers));
    formData.append('requiredSkills', draft.skillsRequired.join(','));
    formData.append('status', 'Open');

    if (draft.imageFile) {
      formData.append('image', draft.imageFile);
    }

    return formData;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const result = isJson
      ? await response.json() as ApiResponse<T>
      : { success: response.ok, message: await response.text() } as ApiResponse<T>;

    if (!response.ok || result.success === false) {
      throw new Error(result.message || this.getErrorMessage(response.status));
    }

    return (result as any).data ?? (result as unknown as T);
  }

  private getErrorMessage(status: number): string {
    switch (status) {
      case 401:
        return 'Please log in again.';
      case 403:
        return 'You are not authorized to perform this action.';
      case 404:
        return 'Opportunity not found.';
      case 500:
      default:
        return 'Unable to complete action.';
    }
  }

  private normalizeSkills(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.map((skill) => String(skill)).filter(Boolean);
    }

    if (typeof value === 'string') {
      return value.split(',').map((skill) => skill.trim()).filter(Boolean);
    }

    return [];
  }

  async getAll(): Promise<Opportunity[]> {
    const response = await fetch(this.apiUrl, {
      method: 'GET',
      headers: this.getHeaders()
    });

    const data = await this.handleResponse<any[]>(response);
    return (data ?? []).map((item) => this.mapBackendToFrontend(item));
  }

  async getById(id: string): Promise<Opportunity | undefined> {
    const response = await fetch(`${this.apiUrl}/${encodeURIComponent(id)}`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    const data = await this.handleResponse<any>(response);
    return this.mapBackendToFrontend(data);
  }

  async create(draft: OpportunityDraft): Promise<Opportunity> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: this.getHeaders(),
      body: this.createFormData(draft)
    });

    const data = await this.handleResponse<any>(response);
    return this.mapBackendToFrontend(data);
  }

  async update(id: string, draft: OpportunityDraft): Promise<Opportunity | undefined> {
    const response = await fetch(`${this.apiUrl}/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: this.createFormData(draft)
    });

    const data = await this.handleResponse<any>(response);
    return this.mapBackendToFrontend(data);
  }

  async delete(id: string): Promise<boolean> {
    const response = await fetch(`${this.apiUrl}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });

    await this.handleResponse<unknown>(response);
    return true;
  }

  async search(keyword: string): Promise<Opportunity[]> {
    const response = await fetch(`${this.apiUrl}/search?keyword=${encodeURIComponent(keyword)}`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    const data = await this.handleResponse<any[]>(response);
    return (data ?? []).map((item) => this.mapBackendToFrontend(item));
  }

  async filter(location = '', status = '', skill = '', category = ''): Promise<Opportunity[]> {
    const params = new URLSearchParams();
    if (location) params.set('location', location);
    if (status) params.set('status', status);
    if (skill) params.set('skill', skill);
    if (category) params.set('category', category);

    const query = params.toString();
    const response = await fetch(`${this.apiUrl}/filter${query ? `?${query}` : ''}`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    const data = await this.handleResponse<any[]>(response);
    return (data ?? []).map((item) => this.mapBackendToFrontend(item));
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const response = await fetch(`${this.apiUrl}/dashboard/stats`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    return this.handleResponse<DashboardStats>(response);
  }
}
