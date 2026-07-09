import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../auth.service';

@Component({
  selector: 'app-otp-verification',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './otp-verification.html',
  styleUrl: './otp-verification.css',
})
export class OtpVerification {
  otp = '';
  email = '';
  isLoading = false;

  private authService = inject(AuthService);
  private router = inject(Router);

  constructor() {
    this.email = localStorage.getItem('email') ?? '';
  }

  async verifyOtp() {
    if (this.otp.length !== 6) {
      alert('Please enter a valid 6-digit OTP');
      return;
    }

    this.isLoading = true;

    try {
      const response = await this.authService.verifyOtp({
        email: this.email,
        otp: this.otp
      });

      alert(response.message);

      this.router.navigate(['/login']);

    } catch (error: any) {
      alert(error.message);
    } finally {
      this.isLoading = false;
    }
  }

  async resendOtp() {
    try {
      const response = await this.authService.resendOtp({
        email: this.email
      });

      alert(response.message);
    } catch (error: any) {
      alert(error.message);
    }
  }
}