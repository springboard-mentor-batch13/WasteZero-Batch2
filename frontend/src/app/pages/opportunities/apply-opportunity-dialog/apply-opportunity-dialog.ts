import { Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import { OpportunityApplication } from '../opportunity.model';

interface ApplyDialogData {
  opportunityTitle: string;
  fullName?: string;
  email?: string;
}

@Component({
  selector: 'app-apply-opportunity-dialog',
  standalone: true,
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    ReactiveFormsModule
  ],
  templateUrl: './apply-opportunity-dialog.html',
  styleUrl: './apply-opportunity-dialog.css'
})
export class ApplyOpportunityDialog {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly dialogRef = inject(MatDialogRef<ApplyOpportunityDialog, OpportunityApplication | undefined>);
  readonly data = inject<ApplyDialogData>(MAT_DIALOG_DATA);

  readonly form = this.fb.group({
    fullName: [this.data.fullName || '', [Validators.required, Validators.maxLength(80)]],
    email: [this.data.email || '', [Validators.required, Validators.email, Validators.maxLength(120)]],
    phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s()]{7,20}$/)]],
    motivation: ['', [Validators.required, Validators.maxLength(600)]],
    relevantSkills: ['', [Validators.required, Validators.maxLength(240)]],
    availability: ['', [Validators.required, Validators.maxLength(240)]]
  });

  cancel(): void {
    this.dialogRef.close();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.dialogRef.close(this.form.getRawValue());
  }

  errorMessage(controlName: keyof ApplyOpportunityDialog['form']['controls']): string {
    const control = this.form.controls[controlName];
    if (control.hasError('required')) return 'This field is required.';
    if (control.hasError('email')) return 'Enter a valid email address.';
    if (control.hasError('pattern')) return 'Enter a valid phone number.';
    if (control.hasError('maxlength')) return 'Please shorten this response.';
    return '';
  }
}
