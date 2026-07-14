import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-delete-opportunity-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './delete-opportunity-dialog.html',
  styleUrl: './delete-opportunity-dialog.css'
})
export class DeleteOpportunityDialog {
  readonly dialogRef = inject(MatDialogRef<DeleteOpportunityDialog>);
  readonly data = inject<{ title: string }>(MAT_DIALOG_DATA);
  loading = false;

  confirm(): void {
    this.loading = true;
    window.setTimeout(() => this.dialogRef.close(true), 350);
  }
}
