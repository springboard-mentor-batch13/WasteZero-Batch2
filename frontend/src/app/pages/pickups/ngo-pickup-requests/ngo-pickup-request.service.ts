import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { API_BASE_URL } from '../../../core/api/api-config';
import {
  NgoPickupRequest,
  NgoPickupStatus,
  PickupApiStatus,
} from './ngo-pickup-request.model';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  notification?: unknown;
}

interface PickupUserApiModel {
  _id?: string;
  id?: string;
  fullName?: string;
  username?: string;
  email?: string;
  phone?: string;
  contact?: string;
  mobile?: string;
}

interface PickupApiModel {
  _id?: string;
  id?: string;
  pickupId?: string;
  requestId?: string;
  user?: string | PickupUserApiModel;
  volunteer?: string | PickupUserApiModel;
  volunteerId?: string | PickupUserApiModel;
  volunteerName?: string;
  volunteerPhone?: string;
  volunteerContact?: string;
  contact?: string;
  wasteType?: string;
  pickupAddress?: string;
  address?: string;
  pickupArea?: string;
  area?: string;
  location?: string;
  pickupDate?: string;
  preferredPickupDate?: string;
  pickupTime?: string;
  preferredPickupTime?: string;
  notes?: string;
  status?: PickupApiStatus;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class NgoPickupRequestService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly pickupsUrl = `${this.apiBaseUrl}/pickups`;

  getAssignedRequests(): Observable<NgoPickupRequest[]> {
    return this.http
      .get<ApiResponse<PickupApiModel[]>>(this.pickupsUrl, this.httpOptions())
      .pipe(
        map((response) =>
          (response.data ?? []).map((pickup) => this.fromApi(pickup))
        )
      );
  }

  getRequestById(id: string): Observable<NgoPickupRequest> {
    return this.http
      .get<ApiResponse<PickupApiModel>>(
        `${this.pickupsUrl}/${id}`,
        this.httpOptions()
      )
      .pipe(map((response) => this.fromApi(response.data)));
  }

  acceptRequest(id: string): Observable<NgoPickupRequest> {
    return this.updateStatus(id, 'Assigned');
  }

  rejectRequest(id: string): Observable<NgoPickupRequest> {
    return this.updateStatus(id, 'Cancelled');
  }

  updateStatus(
    id: string,
    status: Extract<PickupApiStatus, 'Assigned' | 'Cancelled'>
  ): Observable<NgoPickupRequest> {
    return this.http
      .put<ApiResponse<PickupApiModel>>(
        `${this.pickupsUrl}/${id}`,
        { status },
        this.httpOptions()
      )
      .pipe(map((response) => this.fromApi(response.data)));
  }

  getUserFriendlyError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'Something went wrong. Please try again.';
    }

    if (error.status === 401) {
      return 'Your session has expired. Please log in again.';
    }

    if (error.status === 403) {
      return 'You do not have permission to manage this pickup request.';
    }

    if (error.status === 404) {
      return 'Pickup request was not found.';
    }

    if (error.status >= 500) {
      return 'Server error while processing the pickup request. Please try again later.';
    }

    const message = this.readErrorMessage(error);
    return message || 'Unable to process the pickup request. Please try again.';
  }

  private fromApi(pickup: PickupApiModel): NgoPickupRequest {
    const volunteer = this.resolveVolunteer(pickup);
    const pickupDate =
      pickup.preferredPickupDate || pickup.pickupDate || pickup.createdAt || '';

    return {
      id: pickup._id || pickup.id || pickup.pickupId || pickup.requestId || '',
      volunteerId: volunteer.id,
      volunteerName:
        pickup.volunteerName ||
        volunteer.name ||
        'Volunteer',
      volunteerPhone:
        pickup.volunteerPhone ||
        pickup.volunteerContact ||
        pickup.contact ||
        volunteer.contact ||
        '',
      wasteType: pickup.wasteType || 'Not specified',
      pickupAddress: pickup.pickupAddress || pickup.address || 'Not specified',
      pickupArea:
        pickup.pickupArea ||
        pickup.area ||
        this.resolveArea(pickup.location || pickup.pickupAddress || pickup.address),
      pickupDate,
      pickupTime: pickup.preferredPickupTime || pickup.pickupTime || 'Not specified',
      notes: pickup.notes || '',
      status: this.toUiStatus(pickup.status),
      backendStatus: pickup.status,
      createdAt: pickup.createdAt || pickupDate,
    };
  }

  private resolveVolunteer(pickup: PickupApiModel): {
    id?: string;
    name?: string;
    contact?: string;
  } {
    const candidate = pickup.volunteer || pickup.volunteerId || pickup.user;

    if (!candidate) {
      return {};
    }

    if (typeof candidate === 'string') {
      return { id: candidate };
    }

    return {
      id: candidate._id || candidate.id,
      name: candidate.fullName || candidate.username || candidate.email,
      contact: candidate.phone || candidate.contact || candidate.mobile,
    };
  }

  private resolveArea(value?: string): string {
    if (!value?.trim()) {
      return 'Not specified';
    }

    return value.split(',').map((part) => part.trim()).filter(Boolean).at(-1) || value;
  }

  private toUiStatus(status?: PickupApiStatus): NgoPickupStatus {
    if (status === 'Assigned' || status === 'Accepted') {
      return 'Accepted';
    }

    if (status === 'Cancelled' || status === 'Rejected') {
      return 'Rejected';
    }

    if (status === 'Completed') {
      return 'Completed';
    }

    return 'Pending';
  }

  private readErrorMessage(error: HttpErrorResponse): string {
    if (typeof error.error === 'string') {
      return error.error;
    }

    if (
      error.error &&
      typeof error.error === 'object' &&
      'message' in error.error &&
      typeof error.error.message === 'string'
    ) {
      return error.error.message;
    }

    return '';
  }

  private httpOptions(): { headers: HttpHeaders } {
    const token =
      typeof localStorage === 'undefined' ? '' : localStorage.getItem('token');

    return {
      headers: token
        ? new HttpHeaders({ Authorization: `Bearer ${token}` })
        : new HttpHeaders(),
    };
  }
}
