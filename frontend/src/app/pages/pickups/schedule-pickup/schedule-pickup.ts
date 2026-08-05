import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { API_BASE_URL } from '../../../core/api/api-config';

@Component({
  selector: 'app-schedule-pickup',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatSnackBarModule,
  ],
  templateUrl: './schedule-pickup.html',
  styleUrl: './schedule-pickup.css',
})
export class SchedulePickup {

  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly snackBar = inject(MatSnackBar);

  private readonly pickupsUrl = `${this.apiBaseUrl}/pickups`;

  readonly wasteTypes = [
    'Plastic',
    'Paper',
    'Glass',
    'Metal',
    'Organic',
    'E-Waste',
    'Mixed',
  ];

  readonly pickupTimes = [
    '09:00 AM - 11:00 AM',
    '11:00 AM - 01:00 PM',
    '01:00 PM - 03:00 PM',
    '03:00 PM - 05:00 PM',
    '05:00 PM - 07:00 PM'
  ];

  readonly states = [
  'Andhra Pradesh',
  'Delhi',
  'Gujarat',
  'Karnataka',
  'Kerala',
  'Maharashtra',
  'Rajasthan',
  'Tamil Nadu',
  'Telangana',
  'Uttar Pradesh',
  'West Bengal'
];

  
   

  readonly cities: Record<string, string[]> = {

  'Andhra Pradesh': [
    'Guntur',
    'Nellore',
    'Vijayawada',
    'Visakhapatnam'
  ],

  'Delhi': [
    'Delhi',
    'New Delhi'
  ],

  'Gujarat': [
    'Ahmedabad',
    'Rajkot',
    'Surat',
    'Vadodara'
  ],

  'Karnataka': [
    'Bengaluru',
    'Hubballi',
    'Mangaluru',
    'Mysuru'
  ],

  'Kerala': [
    'Kochi',
    'Kozhikode',
    'Thiruvananthapuram',
    'Thrissur'
  ],

  'Maharashtra': [
    'Mumbai',
    'Nagpur',
    'Nashik',
    'Pune'
  ],

  'Rajasthan': [
    'Jaipur',
    'Jodhpur',
    'Kota',
    'Udaipur'
  ],

  'Tamil Nadu': [
    'Chennai',
    'Coimbatore',
    'Madurai',
    'Tiruchirappalli'
  ],

  'Telangana': [
    'Hyderabad',
    'Karimnagar',
    'Nizamabad',
    'Warangal'
  ],

  'Uttar Pradesh': [
    'Kanpur',
    'Lucknow',
    'Noida',
    'Varanasi'
  ],

  'West Bengal': [
    'Durgapur',
    'Howrah',
    'Kolkata',
    'Siliguri'
  ]

};

  currentCities: string[] = [];

readonly minPickupDate = new Date();
  pickup = {
    wasteType: '',
    pickupAddress: '',
    state: '',
    city: '',
    area: '',
    pickupDate: '',
    pickupTime: '',
  };

  submitting = false;

  submitPickup(form: NgForm): void {

    if (form.invalid || this.submitting) {
      form.control.markAllAsTouched();

      this.snackBar.open(
        'Please fill all required fields.',
        'Close',
        {
          duration: 3000,
        }
      );

      return;
    }

    this.submitting = true;

    this.http
      .post(
        this.pickupsUrl,
        this.pickup,
        this.httpOptions()
      )
      .subscribe({

        next: () => {

          this.snackBar.open(
            'Pickup request submitted successfully.',
            'Close',
            {
              duration: 3000,
            }
          );

          form.resetForm({
            wasteType: '',
            pickupAddress: '',
            state: '',
            city: '',
            area: '',
            pickupDate: '',
            pickupTime: '',
          });

          this.submitting = false;

        },

        error: (error: unknown) => {

          this.submitting = false;

          this.snackBar.open(
            this.getUserFriendlyError(error),
            'Close',
            {
              duration: 4000,
            }
          );

        },

      });

  }

  onStateChange(): void {

    this.currentCities =
      this.cities[this.pickup.state] || [];

    this.pickup.city = '';

  }

  private getUserFriendlyError(error: unknown): string {

    if (!(error instanceof HttpErrorResponse)) {
      return 'Unable to schedule pickup.';
    }

    if (error.status === 401) {
      return 'Please login again.';
    }

    if (error.status === 404) {
      return error.error?.message || 'No NGO available for this location.';
    }

    if (error.status >= 500) {
      return 'Server error. Please try again later.';
    }

    if (
      error.error &&
      typeof error.error === 'object' &&
      'message' in error.error &&
      typeof error.error.message === 'string'
    ) {
      return error.error.message;
    }

    return 'Unable to schedule pickup.';
  }

  private httpOptions(): { headers: HttpHeaders } {

    const token =
      typeof localStorage === 'undefined'
        ? ''
        : localStorage.getItem('token');

    return {
      headers: token
        ? new HttpHeaders({
            Authorization: `Bearer ${token}`,
          })
        : new HttpHeaders(),
    };

  }

}
