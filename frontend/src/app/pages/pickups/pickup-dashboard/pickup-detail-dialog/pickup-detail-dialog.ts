import { Component, Inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

import { Pickup } from '../../pickup.service';
@Component({
  selector: 'app-pickup-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule
  ],
  templateUrl: './pickup-detail-dialog.html',
  styleUrl: './pickup-detail-dialog.css'
})
export class PickupDetailDialogComponent {

  constructor(

    public dialogRef: MatDialogRef<PickupDetailDialogComponent>,

    @Inject(MAT_DIALOG_DATA)
    public pickup: Pickup

  ) {}

  close(): void {

    this.dialogRef.close();

  }

  getProgressStep(): number {

    switch (this.pickup.status) {

      case 'Pending':
        return 1;

      case 'Accepted':
        return 2;

      case 'In Progress':
        return 3;

      case 'Completed':
        return 4;

      default:
        return 1;

    }

  }

}