import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Pickup {
  _id: string;
  wasteType: string;
  pickupAddress: string;
  state: string;
  city: string;
  area: string;
  pickupDate: string;
  pickupTime: string;
  status: string;
  ngo?: {
    _id: string;
    fullName: string;
    username: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PickupService {

  private apiUrl = 'http://localhost:5000/api/pickups';

  constructor(private http: HttpClient) {}

  private getHeaders() {
    const token = localStorage.getItem('token');

    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`
      })
    };
  }

  getMyPickups(): Observable<any> {
    return this.http.get(
      this.apiUrl,
      this.getHeaders()
    );
  }

  getAssignedPickups(): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/assigned`,
      this.getHeaders()
    );
  }

  acceptPickup(id: string): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/${id}/accept`,
      {},
      this.getHeaders()
    );
  }

  rejectPickup(id: string): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/${id}/reject`,
      {},
      this.getHeaders()
    );
  }

  startPickup(id: string): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/${id}/start`,
      {},
      this.getHeaders()
    );
  }

  completePickup(id: string): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/${id}/complete`,
      {},
      this.getHeaders()
    );
  }

  withdrawPickup(id: string): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/${id}/withdraw`,
      {},
      this.getHeaders()
    );
  }

  deletePickup(id: string): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/${id}`,
      this.getHeaders()
    );
  }
getPickupById(id: string): Observable<any> {
  return this.http.get(
    `${this.apiUrl}/${id}`,
    this.getHeaders()
  );
}
}