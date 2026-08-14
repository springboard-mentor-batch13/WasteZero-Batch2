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
        class="confirm-button"
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
      color: var(--wz-text-primary);
    }

    mat-icon {
      margin-right: 6px;
    }

    .confirm-button {
      --mdc-filled-button-container-color: var(--wz-primary);
      --mdc-filled-button-label-text-color: var(--wz-text-on-primary);
      --mat-filled-button-state-layer-color: var(--wz-text-on-primary);
      background: var(--wz-primary) !important;
      color: var(--wz-text-on-primary) !important;
      font-weight: 650;
    }

    .confirm-button.destructive {
      --mdc-filled-button-container-color: var(--wz-danger);
      --mdc-filled-button-label-text-color: #ffffff;
      background: var(--wz-danger) !important;
      color: #ffffff !important;
    }

    .confirm-button mat-icon {
      color: currentColor !important;
    }

    :host-context(body.dark-theme) button[mat-button] {
      color: #f1f6f3 !important;
    }

    :host-context(body.dark-theme) .confirm-button:not(.destructive) {
      --mdc-filled-button-container-color: #35b866;
      --mdc-filled-button-label-text-color: #07140d;
      background: #35b866 !important;
      color: #07140d !important;
    }

    :host-context(body.dark-theme) .confirm-button.destructive {
      --mdc-filled-button-container-color: #ef5b5b;
      --mdc-filled-button-label-text-color: #1b0606;
      background: #ef5b5b !important;
      color: #1b0606 !important;
    }
  `]
})
export class AdminConfirmDialog {
  readonly dialogRef = inject(MatDialogRef<AdminConfirmDialog, boolean>);
  readonly data = inject<AdminConfirmDialogData>(MAT_DIALOG_DATA);
}
