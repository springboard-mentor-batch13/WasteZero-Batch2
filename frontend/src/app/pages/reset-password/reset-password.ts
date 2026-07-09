import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPassword {

  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected submitted = false;
  protected isSubmitting = false;
  protected errorMessage = '';

  protected readonly email = history.state?.email ?? '';
  protected readonly otp = history.state?.otp ?? '';

  protected readonly resetPasswordForm = this.fb.nonNullable.group({
    newPassword: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/)
      ]
    ],
    confirmPassword: ['', Validators.required]
  });

  protected get newPassword() {
    return this.resetPasswordForm.controls.newPassword;
  }

  protected get confirmPassword() {
    return this.resetPasswordForm.controls.confirmPassword;
  }

  protected showError(
    controlName: 'newPassword' | 'confirmPassword'
  ): boolean {
    const control = this.resetPasswordForm.controls[controlName];

    return control.invalid &&
      (control.touched || this.submitted);
  }

  protected showPasswordMismatch(): boolean {

    return (
      this.confirmPassword.value !== '' &&
      this.newPassword.value !== this.confirmPassword.value
    );

  }

  protected async onSubmit(): Promise<void> {

    this.submitted = true;
    this.errorMessage = '';

    if (
      this.resetPasswordForm.invalid ||
      this.showPasswordMismatch()
    ) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    try {

      const {
        newPassword,
        confirmPassword
      } = this.resetPasswordForm.getRawValue();

      await this.authService.resetPassword({
        email: this.email,
        otp: this.otp,
        newPassword,
        confirmPassword
      });

      alert('Password reset successfully.');

      await this.router.navigate(['/login']);

    } catch (error) {

      this.errorMessage =
        error instanceof Error
          ? error.message
          : 'Password reset failed';

      alert(this.errorMessage);

    } finally {

      this.isSubmitting = false;

    }

  }

}