import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {

  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected submitted = false;
  protected isSubmitting = false;
  protected errorMessage = '';

  protected readonly forgotPasswordForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });

  protected get email() {
    return this.forgotPasswordForm.controls.email;
  }

  protected showError(): boolean {
    return this.email.invalid &&
      (this.email.touched || this.submitted);
  }

  protected async onSubmit(): Promise<void> {

    this.submitted = true;
    this.errorMessage = '';

    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    try {

      const { email } = this.forgotPasswordForm.getRawValue();

      await this.authService.forgotPassword(email);

      alert('OTP has been sent successfully.');

      await this.router.navigate(
        ['/verify-reset-otp'],
        {
          state: { email }
        }
      );

    } catch (error) {

      this.errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to send OTP';

      alert(this.errorMessage);

    } finally {
      this.isSubmitting = false;
    }

  }

}