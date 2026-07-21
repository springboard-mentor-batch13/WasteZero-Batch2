import { Injectable } from '@angular/core';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface ResendOtpRequest {
  email: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface VerifyResetOtpRequest {
  email: string;
  otp: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  role?: string;
  user?: {
    id: string;
    fullName: string;
    username: string;
    email: string;
    role: string;
    location?: string;
    skills?: string[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly apiUrl = 'http://localhost:5000/api/auth';
  private readonly tokenKey = 'token';
  private readonly roleKey = 'role';

  async login(payload: LoginRequest): Promise<AuthResponse> {
    return this.post<AuthResponse>('/login', payload);
  }

  // Registration OTP
  async register(payload: RegisterRequest): Promise<AuthResponse> {
    return this.post<AuthResponse>(
      '/send-register-otp',
      payload
    );
  }

  async verifyOtp(payload: VerifyOtpRequest): Promise<AuthResponse> {
    return this.post<AuthResponse>(
      '/verify-register-otp',
      payload
    );
  }

  async resendOtp(payload: ResendOtpRequest): Promise<AuthResponse> {
    return this.post<AuthResponse>(
      '/resend-otp',
      payload
    );
  }

  // Forgot Password
  async forgotPassword(payload: ForgotPasswordRequest): Promise<AuthResponse> {
    return this.post<AuthResponse>(
      '/forgot-password',
      payload
    );
  }

  async verifyResetOtp(payload: VerifyResetOtpRequest): Promise<AuthResponse> {
    return this.post<AuthResponse>(
      '/verify-reset-otp',
      payload
    );
  }

  async resetPassword(payload: ResetPasswordRequest): Promise<AuthResponse> {
    return this.post<AuthResponse>(
      '/reset-password',
      payload
    );
  }
    saveToken(token: string, role?: string): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.setItem(this.tokenKey, token);

    const resolvedRole = role || this.getRoleFromToken(token);
    if (resolvedRole) {
      localStorage.setItem(this.roleKey, resolvedRole);
    }
  }

  saveUser(user: AuthResponse['user']): void {
    if (typeof localStorage === 'undefined' || !user) {
      return;
    }

    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem(this.roleKey, user.role);
  }

  getUser(): AuthResponse['user'] | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  getRole(): string | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    return localStorage.getItem(this.roleKey);
  }

  getUserRole(): string {
    if (typeof localStorage === 'undefined') {
      return '';
    }

    const token = localStorage.getItem(this.tokenKey);
    if (!token) {
      return '';
    }

    return localStorage.getItem(this.roleKey) || this.getRoleFromToken(token);
  }

  isLoggedIn(): boolean {
    if (typeof localStorage === 'undefined') {
      return false;
    }

    return !!localStorage.getItem(this.tokenKey);
  }

  canManageOpportunities(): boolean {
    const role = this.getRole();
    return role === 'Admin' || role === 'NGO';
  }

  logout(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.roleKey);
    localStorage.removeItem('user');
  }

  clearSession(): void {
    this.logout();
  }
    private async post<TResponse>(
    endpoint: string,
    payload: unknown
  ): Promise<TResponse> {

    const response = await fetch(`${this.apiUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await this.parseJson<AuthResponse>(response);

    if (!response.ok || data.success === false) {
      throw new Error(
        data.message || 'Authentication request failed'
      );
    }

    return data as TResponse;
  }

  private getRoleFromToken(token: string): string {
    try {
      const payload = token.split('.')[1];

      if (!payload) {
        return '';
      }

      const decoded = JSON.parse(
        atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
      );

      return typeof decoded.role === 'string'
        ? decoded.role
        : '';

    } catch {
      return '';
    }
  }

  private async parseJson<TResponse>(
    response: Response
  ): Promise<TResponse> {

    try {
      return await response.json() as TResponse;

    } catch {
      return {
        success: false,
        message: 'Unable to read authentication response'
      } as TResponse;
    }
  }
}