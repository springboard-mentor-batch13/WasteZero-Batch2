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
    'Dry Waste',
    'Wet Waste',
    'Plastic Waste',
    'E-waste',
    'Organic Waste',
    'Mixed Recyclables',
  ];

  readonly minPickupDate = new Date().toISOString().slice(0, 10);

  pickup = {
    wasteType: '',
    pickupAddress: '',
    pickupDate: '',
  };

  submitting = false;

  submitPickup(form: NgForm): void {
    if (form.invalid || this.submitting) {
      form.control.markAllAsTouched();
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
          this.snackBar.open('Pickup scheduled. NGOs have been notified.', 'Close', {
            duration: 3500,
          });
          form.resetForm({
            wasteType: '',
            pickupAddress: '',
            pickupDate: '',
          });
        },
        error: (error: unknown) => {
          this.snackBar.open(this.getUserFriendlyError(error), 'Close', {
            duration: 4000,
          });
        },
        complete: () => {
          this.submitting = false;
        },
      });
  }

  private getUserFriendlyError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'Unable to schedule pickup. Please try again.';
    }

    if (error.status === 401) {
      return 'Your session has expired. Please log in again.';
    }

    if (error.status >= 500) {
      return 'Server error while scheduling pickup. Please try again later.';
    }

    if (
      error.error &&
      typeof error.error === 'object' &&
      'message' in error.error &&
      typeof error.error.message === 'string'
    ) {
      return error.error.message;
    }

    return 'Unable to schedule pickup. Please check the details and try again.';
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
