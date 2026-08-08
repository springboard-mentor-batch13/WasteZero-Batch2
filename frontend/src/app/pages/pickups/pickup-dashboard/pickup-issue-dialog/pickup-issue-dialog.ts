import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-pickup-issue-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule
  ],
  templateUrl: './pickup-issue-dialog.html',
  styleUrl: './pickup-issue-dialog.css'
})
export class PickupIssueDialogComponent {

  reason = '';

  remarks = '';

  newPickupDate: Date | null = null;

  newPickupTime = '';

  reasons = [
    'Volunteer Not Available',
    'Address Not Found',
    'Waste Not Available',
    'Vehicle Issue',
    'Weather Conditions',
    'Safety Issue',
    'Other'
  ];

  // Same pickup time slots as Schedule Pickup
  timeSlots = [
    '09:00 AM - 11:00 AM',
    '11:00 AM - 01:00 PM',
    '01:00 PM - 03:00 PM',
    '03:00 PM - 05:00 PM',
    '05:00 PM - 07:00 PM'
  ];

  constructor(
    public dialogRef: MatDialogRef<PickupIssueDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public pickup: any
  ) {}

  submit(): void {

    this.dialogRef.close({
      reason: this.reason,
      remarks: this.remarks,
      pickupDate: this.newPickupDate,
      pickupTime: this.newPickupTime
    });

  }

  cancel(): void {

    this.dialogRef.close();

  }

}