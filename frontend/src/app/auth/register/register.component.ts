import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';
import { passwordMatchValidator } from '../validators/password-match.validator';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly registerForm = this.formBuilder.nonNullable.group(
    {
      fullName: ['', [Validators.required, Validators.minLength(2)]],

      // NEW FIELD
      username: ['', [Validators.required, Validators.minLength(3)]],

      email: ['', [Validators.required, Validators.email]],

      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/)
        ]
      ],

      confirmPassword: ['', [Validators.required]],

      role: ['', Validators.required],

      termsAccepted: [false, [Validators.requiredTrue]]
    },
    {
      validators: passwordMatchValidator('password', 'confirmPassword')
    }
  );

  protected submitted = false;
  protected isSubmitting = false;
  protected errorMessage = '';

  protected get fullName() {
    return this.registerForm.controls.fullName;
  }

  protected get username() {
    return this.registerForm.controls.username;
  }

  protected get email() {
    return this.registerForm.controls.email;
  }

  protected get password() {
    return this.registerForm.controls.password;
  }

  protected get confirmPassword() {
    return this.registerForm.controls.confirmPassword;
  }

  protected get role() {
    return this.registerForm.controls.role;
  }

  protected showError(
    controlName:
      | 'fullName'
      | 'username'
      | 'email'
      | 'password'
      | 'confirmPassword'
      | 'role'
      | 'termsAccepted'
  ): boolean {
    const control = this.registerForm.controls[controlName];
    return control.invalid && (control.touched || this.submitted);
  }

  protected showPasswordMismatch(): boolean {
    return (
      this.registerForm.hasError('passwordMismatch') &&
      (this.confirmPassword.touched || this.submitted)
    );
  }

  protected async onSubmit(): Promise<void> {
    this.submitted = true;
    this.errorMessage = '';

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    try {
      const {
        fullName,
        username,
        email,
        password,
        confirmPassword,
        role
      } = this.registerForm.getRawValue();

      await this.authService.register({
  fullName,
  username,
  email,
  password,
  confirmPassword,
  role
});


// save email for OTP verification
localStorage.setItem('email', email);


// go to OTP page
await this.redirectIfRouteExists('otp-verification');

    } catch (error) {
      this.errorMessage =
        error instanceof Error ? error.message : 'Registration failed';

      alert(this.errorMessage);
    } finally {
      this.isSubmitting = false;
    }
  }

  private async redirectIfRouteExists(path: string): Promise<void> {
    if (this.router.config.some((route) => route.path === path)) {
      await this.router.navigate([path]);
    }
  }
}