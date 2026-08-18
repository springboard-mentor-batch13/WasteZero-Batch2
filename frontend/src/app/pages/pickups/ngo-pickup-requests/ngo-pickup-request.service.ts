import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders
} from '@angular/common/http';

import {
  Injectable,
  inject
} from '@angular/core';

import {
  Observable,
  map
} from 'rxjs';

import { API_BASE_URL } from '../../../core/api/api-config';

import {
  NgoPickupRequest,
  NgoPickupStatus,
  PickupApiStatus
} from './ngo-pickup-request.model';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
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
  area?: string;
  city?: string;
  state?: string;
  pickupArea?: string;
  location?: string;

  pickupDate?: string;
  preferredPickupDate?: string;

  pickupTime?: string;
  preferredPickupTime?: string;

  notes?: string;

  status?: PickupApiStatus;

  createdAt?: string;

  proofImage?: string;
  completionRemarks?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NgoPickupRequestService {

  private readonly http = inject(HttpClient);

  private readonly apiBaseUrl =
    inject(API_BASE_URL);

  private readonly pickupsUrl =
    `${this.apiBaseUrl}/pickups`;

  getAssignedRequests(): Observable<NgoPickupRequest[]> {

    return this.http
      .get<ApiResponse<PickupApiModel[]>>(
        `${this.pickupsUrl}/assigned`,
        this.httpOptions()
      )
      .pipe(
        map(response =>
          (response.data ?? []).map(
            pickup => this.fromApi(pickup)
          )
        )
      );
  }

  getRequestById(
    id: string
  ): Observable<NgoPickupRequest> {

    return this.http
      .get<ApiResponse<PickupApiModel>>(
        `${this.pickupsUrl}/${id}`,
        this.httpOptions()
      )
      .pipe(
        map(response =>
          this.fromApi(response.data)
        )
      );
  }

  acceptRequest(
    id: string
  ): Observable<NgoPickupRequest> {

    return this.http
      .patch<ApiResponse<PickupApiModel>>(
        `${this.pickupsUrl}/${id}/accept`,
        {},
        this.httpOptions()
      )
      .pipe(
        map(response =>
          this.fromApi(response.data)
        )
      );
  }

  rejectRequest(
    id: string
  ): Observable<NgoPickupRequest> {

    return this.http
      .patch<ApiResponse<PickupApiModel>>(
        `${this.pickupsUrl}/${id}/reject`,
        {},
        this.httpOptions()
      )
      .pipe(
        map(response =>
          this.fromApi(response.data)
        )
      );
  }

  completeRequest(
    id: string
  ): Observable<NgoPickupRequest> {

    return this.http
      .patch<ApiResponse<PickupApiModel>>(
        `${this.pickupsUrl}/${id}/complete`,
        {},
        this.httpOptions()
      )
      .pipe(
        map(response =>
          this.fromApi(response.data)
        )
      );
  }

  approvePickupProof(
    id: string
  ): Observable<NgoPickupRequest> {

    return this.http
      .patch<ApiResponse<PickupApiModel>>(
        `${this.pickupsUrl}/${id}/approve-proof`,
        {},
        this.httpOptions()
      )
      .pipe(
        map(response =>
          this.fromApi(response.data)
        )
      );
  }

  rejectPickupProof(
    id: string
  ): Observable<NgoPickupRequest> {

    return this.http
      .patch<ApiResponse<PickupApiModel>>(
        `${this.pickupsUrl}/${id}/reject-proof`,
        {},
        this.httpOptions()
      )
      .pipe(
        map(response =>
          this.fromApi(response.data)
        )
      );
  }

  private fromApi(
    pickup: PickupApiModel
  ): NgoPickupRequest {

    const volunteer =
      this.resolveVolunteer(pickup);

    const pickupDate =
      pickup.pickupDate ||
      pickup.preferredPickupDate ||
      pickup.createdAt ||
      '';

    return {

      id:
        pickup._id ||
        pickup.id ||
        pickup.pickupId ||
        pickup.requestId ||
        '',

      volunteerId:
        volunteer.id,

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

      wasteType:
        pickup.wasteType ||
        'Not specified',

      pickupAddress:
        pickup.pickupAddress ||
        pickup.address ||
        'Not specified',

      pickupArea:
        `${pickup.area || ''}, ${pickup.city || ''}, ${pickup.state || ''}`
          .replace(/^,\s*|,\s*$/g, '')
          .trim(),

      pickupDate,

      pickupTime:
        pickup.pickupTime ||
        pickup.preferredPickupTime ||
        'Not specified',

      notes:
        pickup.notes ||
        '',

      status:
        this.toUiStatus(pickup.status),

      backendStatus:
        pickup.status,

      createdAt:
        pickup.createdAt ||
        pickupDate,

      proofImage:
        pickup.proofImage || '',

      completionRemarks:
        pickup.completionRemarks || ''

    };
  }

  private resolveVolunteer(
    pickup: PickupApiModel
  ): {
    id?: string;
    name?: string;
    contact?: string;
  } {

    const candidate =
      pickup.volunteer ||
      pickup.volunteerId ||
      pickup.user;

    if (!candidate) {
      return {};
    }

    if (typeof candidate === 'string') {
      return {
        id: candidate
      };
    }

    return {

      id:
        candidate._id ||
        candidate.id,

      name:
        candidate.fullName ||
        candidate.username ||
        candidate.email,

      contact:
        candidate.phone ||
        candidate.contact ||
        candidate.mobile

    };
  }

  
  private toUiStatus(
  status?: PickupApiStatus
): NgoPickupStatus {

  switch (status) {

    case 'Pending':
      return 'Pending';

    case 'Accepted':
    case 'Assigned':
      return 'Accepted';

    case 'In Progress':
      return 'In Progress';

    case 'Rescheduled':
      return 'Rescheduled';

    case 'Waiting for NGO Approval':
      return 'Waiting for NGO Approval';

    // Backend keeps "Unfinished Pickup",
    // but frontend displays a more meaningful status.
    case 'Unfinished Pickup':
      return 'Proof Rejected';

    case 'Completed':
      return 'Completed';

    case 'Rejected':
    case 'Cancelled':
      return 'Rejected';

    default:
      return 'Pending';
  }
}

  getUserFriendlyError(
    error: unknown
  ): string {

    if (
      !(error instanceof HttpErrorResponse)
    ) {
      return 'Something went wrong. Please try again.';
    }

    if (error.status === 401) {
      return 'Your session has expired.';
    }

    if (error.status === 403) {
      return 'You are not authorized.';
    }

    if (error.status === 404) {
      return 'Pickup request not found.';
    }

    if (error.status >= 500) {
      return 'Server error. Please try again later.';
    }

    if (
      error.error &&
      typeof error.error === 'object' &&
      'message' in error.error
    ) {
      return error.error.message;
    }

    return 'Unable to process request.';
  }

  private httpOptions(): {
    headers: HttpHeaders;
  } {

    const token =
      localStorage.getItem('token');

    return {

      headers: token

        ? new HttpHeaders({
            Authorization: `Bearer ${token}`
          })

        : new HttpHeaders()

    };
  }
}