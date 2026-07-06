import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { passwordMatchValidator } from '../validators/password-match.validator';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  private readonly formBuilder = inject(FormBuilder);

  protected readonly registerForm = this.formBuilder.nonNullable.group(
    {
      fullName: ['', [Validators.required, Validators.minLength(2)]],
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
      termsAccepted: [false, [Validators.requiredTrue]]
    },
    {
      validators: passwordMatchValidator('password', 'confirmPassword')
    }
  );

  protected submitted = false;

  protected get fullName() {
    return this.registerForm.controls.fullName;
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

  protected showError(controlName: 'fullName' | 'email' | 'password' | 'confirmPassword' | 'termsAccepted'): boolean {
    const control = this.registerForm.controls[controlName];
    return control.invalid && (control.touched || this.submitted);
  }

  protected showPasswordMismatch(): boolean {
    return this.registerForm.hasError('passwordMismatch') && (this.confirmPassword.touched || this.submitted);
  }

  protected onSubmit(): void {
    this.submitted = true;

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    console.log('Registration form submitted', this.registerForm.getRawValue());
  }
}
