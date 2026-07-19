import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly loginForm = this.formBuilder.nonNullable.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    rememberMe: [false]
  });

  protected submitted = false;
  protected isSubmitting = false;
  protected errorMessage = '';

  protected get username() {
    return this.loginForm.controls.username;
  }

  protected get password() {
    return this.loginForm.controls.password;
  }

  protected showError(controlName: 'username' | 'password'): boolean {
    const control = this.loginForm.controls[controlName];
    return control.invalid && (control.touched || this.submitted);
  }

  protected async onSubmit(): Promise<void> {
    this.submitted = true;
    this.errorMessage = '';

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    try {
      const { username, password } = this.loginForm.getRawValue();

      const response = await this.authService.login({
        username,
        password
      });

      if (response.token) {
        this.authService.saveToken(response.token, response.role || response.user?.role);
      }

      await this.redirectIfRouteExists('my-profile');
    } catch (error) {
      this.errorMessage =
        error instanceof Error ? error.message : 'Login failed';

      alert(this.errorMessage);
    } finally {
      this.isSubmitting = false;
    }
  }

  private async redirectIfRouteExists(path: string): Promise<void> {
    if (this.router.config.some(route => route.path === path)) {
      await this.router.navigate([path]);
    }
  }
}
