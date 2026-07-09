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



  saveToken(token: string): void {

    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.setItem(this.tokenKey, token);
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
}