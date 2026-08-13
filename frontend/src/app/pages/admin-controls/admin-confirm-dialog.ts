import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface AdminConfirmDialogData {
  title: string;
  message: string;
  confirmLabel: string;
  confirmIcon: string;
  destructive?: boolean;
}

@Component({
  selector: 'app-admin-confirm-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="dialogRef.close(false)">Cancel</button>
      <button
        mat-flat-button
        type="button"
        [class.destructive]="data.destructive"
        [color]="data.destructive ? 'warn' : 'primary'"
        (click)="dialogRef.close(true)">
        <mat-icon>{{ data.confirmIcon }}</mat-icon>
        {{ data.confirmLabel }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host {
      display: block;
      color: var(--wz-text-primary);
    }

    p {
      color: var(--wz-text-secondary);
      margin: 0;
      max-width: 420px;
      line-height: 1.5;
    }

    button {
      min-height: 40px;
      border-radius: 8px;
    }

    mat-icon {
      margin-right: 6px;
    }
  `]
})
export class AdminConfirmDialog {
  readonly dialogRef = inject(MatDialogRef<AdminConfirmDialog, boolean>);
  readonly data = inject<AdminConfirmDialogData>(MAT_DIALOG_DATA);
}
