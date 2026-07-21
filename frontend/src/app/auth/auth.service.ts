import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

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
  private readonly userKey = 'user';
  private readonly opportunityManagerRoles = ['NGO', 'Admin'];
  private readonly currentUserSubject = new BehaviorSubject<AuthResponse['user'] | null>(this.readStoredUser());
  readonly currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key === this.userKey || event.key === this.roleKey || event.key === this.tokenKey) {
          this.currentUserSubject.next(this.readStoredUser());
        }
      });
    }
  }


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


  // Forgot password
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
    if (resolvedRole) localStorage.setItem(this.roleKey, resolvedRole);
  }

  canManageOpportunities(): boolean {
    return this.opportunityManagerRoles.includes(this.getUserRole());
  }

  getUserRole(): string {
    if (typeof localStorage === 'undefined') return '';

    const token = localStorage.getItem(this.tokenKey);
    if (!token) return '';

    return localStorage.getItem(this.roleKey) || this.getRoleFromToken(token);
  }

  clearSession(): void {
    if (typeof localStorage === 'undefined') return;

    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.roleKey);
    localStorage.removeItem(this.userKey);
    this.currentUserSubject.next(null);
  }

  saveAuthSession(response: AuthResponse): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    if (response.token) {
      this.saveToken(response.token);
    }

    if (response.role) {
      localStorage.setItem('role', response.role);
    }

    if (response.user?.role) {
      localStorage.setItem('role', response.user.role);
    }
  }



  private async post<TResponse>(
    endpoint: string,
    payload: unknown
  ): Promise<TResponse> {


    const response = await fetch(`${this.apiUrl}${endpoint}`, {

      method:'POST',

      headers:{
        'Content-Type':'application/json'
      },

      body:JSON.stringify(payload)

    });


    const data =
      await this.parseJson<AuthResponse>(response);


    if(!response.ok || data.success===false){
      throw new Error(
        data.message || 'Authentication request failed'
      );
    }


    return data as TResponse;

  }

  private getRoleFromToken(token: string): string {
    try {
      const payload = token.split('.')[1];
      if (!payload) return '';
      const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      return typeof decoded.role === 'string' ? decoded.role : '';
    } catch {
      return '';
    }
  }



  private async parseJson<TResponse>(
    response:Response
  ):Promise<TResponse>{

    try{

      return await response.json() as TResponse;

    }catch{

      return {
        success:false,
        message:'Unable to read authentication response'
      } as TResponse;

    }
  }
  saveUser(user: AuthResponse['user']): void {
  if (typeof localStorage === 'undefined' || !user) {
    return;
  }

  localStorage.setItem(this.userKey, JSON.stringify(user));
  localStorage.setItem(this.roleKey, user.role);
  this.currentUserSubject.next(user);
}

getUser(): AuthResponse['user'] | null {
  return this.currentUserSubject.value || this.readStoredUser();
}

getRole(): string | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  return localStorage.getItem('role');
}

logout(): void {
  this.clearSession();
}

private readStoredUser(): AuthResponse['user'] | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  try {
    const user = localStorage.getItem(this.userKey);
    return user ? JSON.parse(user) : null;
  } catch {
    localStorage.removeItem(this.userKey);
    return null;
  }
}

isLoggedIn(): boolean {
  if (typeof localStorage === 'undefined') {
    return false;
  }

  return !!localStorage.getItem(this.tokenKey);
}

}
