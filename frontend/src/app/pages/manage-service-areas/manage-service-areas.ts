import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-manage-service-areas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-service-areas.html',
  styleUrl: './manage-service-areas.css'
})
export class ManageServiceAreas implements OnInit {

  constructor(private http: HttpClient) {}

  state = '';
  city = '';

  serviceAreas: string[] = [];

  newArea = '';

  ngOnInit(): void {
    this.loadServiceAreas();
  }

  getHeaders() {
    const token = localStorage.getItem('token');

    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    });
  }

  loadServiceAreas() {

    this.http.get(
      'http://localhost:5000/api/profile/service-areas',
      { headers: this.getHeaders() }
    ).subscribe({

      next: (response: any) => {

        this.state = response.data.state || '';

        this.city = response.data.city || '';

        this.serviceAreas = response.data.serviceAreas || [];

      },

      error: (error) => {
        console.error(error);
      }

    });

  }

  addArea() {

    const area = this.newArea.trim();

    if (!area) return;

    if (this.serviceAreas.includes(area)) {
      alert('Service Area already exists.');
      return;
    }

    this.serviceAreas.push(area);

    this.newArea = '';

  }

  removeArea(index: number) {

    this.serviceAreas.splice(index, 1);

  }

  save() {

    const body = {

      state: this.state,

      city: this.city,

      serviceAreas: this.serviceAreas

    };

    this.http.put(
      'http://localhost:5000/api/profile/service-areas',
      body,
      { headers: this.getHeaders() }
    ).subscribe({

      next: () => {

        alert('Service Areas Updated Successfully!');

      },

      error: (error) => {

        console.error(error);

        alert('Unable to save.');

      }

    });

  }

}