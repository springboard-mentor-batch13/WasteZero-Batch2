import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule
} from '@angular/material/dialog';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-pickup-action-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ],
  templateUrl: './pickup-action-dialog.html',
  styleUrl: './pickup-action-dialog.css'
})
export class PickupActionDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<PickupActionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public pickup: any
  ) {}

  submitProof(): void {

    this.dialogRef.close('proof');

  }

  unableToComplete(): void {

    this.dialogRef.close('unable');

  }

  cancel(): void {

    this.dialogRef.close();

  }

}