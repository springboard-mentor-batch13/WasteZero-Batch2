import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule
} from '@angular/material/dialog';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { PickupService } from '../../pickup.service';
@Component({
  selector: 'app-proof-upload-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule
  ],
  templateUrl: './proof-upload-dialog.html',
  styleUrl: './proof-upload-dialog.css'
})
export class ProofUploadDialogComponent {

  private pickupService = inject(PickupService);
  private snackBar = inject(MatSnackBar);

  selectedFile: File | null = null;

  imagePreview: string | null = null;

  remarks = '';

  uploading = false;

  constructor(

    public dialogRef: MatDialogRef<ProofUploadDialogComponent>,

    @Inject(MAT_DIALOG_DATA)
    public pickup: any

  ) {}

  onFileSelected(event: Event): void {

    const input = event.target as HTMLInputElement;

    if (!input.files?.length) {

      return;

    }

    this.selectedFile = input.files[0];

    const reader = new FileReader();

    reader.onload = () => {

      this.imagePreview = reader.result as string;

    };

    reader.readAsDataURL(this.selectedFile);

  }

  submit(): void {

    if (!this.selectedFile) {

      this.snackBar.open(

        'Please choose an image.',

        'Close',

        {
          duration: 3000
        }

      );

      return;

    }

    const formData = new FormData();

    formData.append(

      'proofImage',

      this.selectedFile

    );

    formData.append(

      'remarks',

      this.remarks

    );

    this.uploading = true;

    this.pickupService.submitPickupProof(

      this.pickup._id,

      formData

    ).subscribe({

      next: () => {

        this.uploading = false;

        this.snackBar.open(

          'Pickup proof submitted successfully.',

          'Close',

          {
            duration: 3000
          }

        );

        this.dialogRef.close(true);

      },

      error: (error) => {

        console.error(error);

        this.uploading = false;

        this.snackBar.open(

          'Unable to submit pickup proof.',

          'Close',

          {
            duration: 3000
          }

        );

      }

    });

  }

  cancel(): void {

    this.dialogRef.close();

  }

}