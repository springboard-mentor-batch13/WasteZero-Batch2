import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-verify-reset-otp',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './verify-reset-otp.html',
  styleUrl: './verify-reset-otp.css',
})
export class VerifyResetOtp {

  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected submitted = false;
  protected isSubmitting = false;
  protected errorMessage = '';

  protected readonly email =
    history.state?.email ?? '';

  protected readonly otpForm =
    this.fb.nonNullable.group({
      otp: [
        '',
        [
          Validators.required,
          Validators.minLength(6),
          Validators.maxLength(6)
        ]
      ]
    });

  protected get otp() {
    return this.otpForm.controls.otp;
  }

  protected showError(): boolean {
    return this.otp.invalid &&
      (this.otp.touched || this.submitted);
  }

  protected async onSubmit(): Promise<void> {

    this.submitted = true;
    this.errorMessage = '';

    if (this.otpForm.invalid) {
      this.otpForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    try {

      const { otp } =
        this.otpForm.getRawValue();

      await this.authService.verifyResetOTP({
        email: this.email,
        otp
      });

      alert('OTP verified successfully.');

      await this.router.navigate(
        ['/reset-password'],
        {
          state: {
            email: this.email,
            otp
          }
        }
      );

    } catch (error) {

      this.errorMessage =
        error instanceof Error
          ? error.message
          : 'OTP verification failed';

      alert(this.errorMessage);

    } finally {

      this.isSubmitting = false;

    }

  }

}