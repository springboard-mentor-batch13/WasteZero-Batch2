import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, of, throwError } from 'rxjs';

import { NgoPickupRequest, NgoPickupStatus } from './ngo-pickup-request.model';

@Injectable({
  providedIn: 'root',
})
export class NgoPickupRequestService {
  private readonly requestsSubject = new BehaviorSubject<NgoPickupRequest[]>([
    {
      id: 'PU-1024',
      volunteerName: 'Aarav Sharma',
      volunteerPhone: '+91 98765 43210',
      wasteType: 'Dry Waste',
      pickupAddress: '14 Green Avenue, near City Library, Pune',
      pickupArea: 'Shivajinagar',
      pickupDate: '2026-08-04',
      pickupTime: '10:00 AM',
      notes: 'Cardboard boxes are bundled and kept near the gate.',
      status: 'Pending',
      createdAt: '2026-07-29T09:15:00.000Z',
    },
    {
      id: 'PU-1025',
      volunteerName: 'Meera Iyer',
      volunteerPhone: '+91 99887 76655',
      wasteType: 'Organic Waste',
      pickupAddress: '27 Lake Road, Baner, Pune',
      pickupArea: 'Baner',
      pickupDate: '2026-08-05',
      pickupTime: '02:30 PM',
      notes: 'Please call before arrival. Waste is packed in reusable bins.',
      status: 'Accepted',
      createdAt: '2026-07-30T12:40:00.000Z',
    },
    {
      id: 'PU-1026',
      volunteerName: 'Kabir Khan',
      volunteerPhone: '+91 90000 45678',
      wasteType: 'E-waste',
      pickupAddress: '8 Market Street, Kothrud, Pune',
      pickupArea: 'Kothrud',
      pickupDate: '2026-08-07',
      pickupTime: '11:15 AM',
      notes: 'Includes two keyboards, old chargers, and one router.',
      status: 'Rejected',
      createdAt: '2026-07-31T08:05:00.000Z',
    },
    {
      id: 'PU-1027',
      volunteerName: 'Nisha Patel',
      volunteerPhone: '+91 91234 56780',
      wasteType: 'Plastic Waste',
      pickupAddress: '3 Sunrise Apartments, Aundh, Pune',
      pickupArea: 'Aundh',
      pickupDate: '2026-08-01',
      pickupTime: '09:00 AM',
      notes: 'Bottles have been cleaned and sorted.',
      status: 'Completed',
      createdAt: '2026-07-28T16:20:00.000Z',
    },
    {
      id: 'PU-1028',
      volunteerName: 'Rohan Desai',
      volunteerPhone: '+91 90123 45678',
      wasteType: 'Mixed Recyclables',
      pickupAddress: '52 Community Hall Road, Viman Nagar, Pune',
      pickupArea: 'Viman Nagar',
      pickupDate: '2026-08-06',
      pickupTime: '04:00 PM',
      notes: 'Paper, glass, and cans are separated into labeled bags.',
      status: 'Pending',
      createdAt: '2026-08-01T07:30:00.000Z',
    },
  ]);

  getAssignedRequests(): Observable<NgoPickupRequest[]> {
    // TODO: Replace mock BehaviorSubject with Get Assigned Pickup Requests API when the NGO pickup backend is available.
    return this.requestsSubject.asObservable();
  }

  getRequestById(id: string): Observable<NgoPickupRequest> {
    // TODO: Replace mock lookup with Get Pickup Request Details API when the NGO pickup backend is available.
    const request = this.requestsSubject.value.find((item) => item.id === id);

    if (!request) {
      return throwError(() => new Error('Pickup request not found.'));
    }

    return of({ ...request });
  }

  acceptRequest(id: string): Observable<NgoPickupRequest> {
    // TODO: Replace mock update with Accept Pickup API when the NGO pickup backend is available.
    return this.updateMockStatus(id, 'Accepted');
  }

  rejectRequest(id: string): Observable<NgoPickupRequest> {
    // TODO: Replace mock update with Reject Pickup API when the NGO pickup backend is available.
    return this.updateMockStatus(id, 'Rejected');
  }

  search(searchText: string): Observable<NgoPickupRequest[]> {
    const search = searchText.trim().toLowerCase();

    return this.getAssignedRequests().pipe(
      map((requests) =>
        requests.filter((request) =>
          !search ||
          request.volunteerName.toLowerCase().includes(search) ||
          request.id.toLowerCase().includes(search)
        )
      )
    );
  }

  filter(
    status: NgoPickupStatus | 'All',
    wasteType: string,
    searchText = ''
  ): Observable<NgoPickupRequest[]> {
    const search = searchText.trim().toLowerCase();

    return this.getAssignedRequests().pipe(
      map((requests) =>
        requests.filter((request) => {
          const matchesStatus = status === 'All' || request.status === status;
          const matchesWasteType = wasteType === 'All' || request.wasteType === wasteType;
          const matchesSearch =
            !search ||
            request.volunteerName.toLowerCase().includes(search) ||
            request.id.toLowerCase().includes(search);

          return matchesStatus && matchesWasteType && matchesSearch;
        })
      )
    );
  }

  private updateMockStatus(
    id: string,
    status: Extract<NgoPickupStatus, 'Accepted' | 'Rejected'>
  ): Observable<NgoPickupRequest> {
    const requests = this.requestsSubject.value;
    const index = requests.findIndex((request) => request.id === id);

    if (index < 0) {
      return throwError(() => new Error('Pickup request not found.'));
    }

    const updatedRequest = {
      ...requests[index],
      status,
    };

    this.requestsSubject.next(
      requests.map((request) => request.id === id ? updatedRequest : request)
    );

    return of({ ...updatedRequest });
  }
}
