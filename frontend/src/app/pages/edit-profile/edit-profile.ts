import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-profile.html',
  styleUrl: './edit-profile.css'
})
export class EditProfile implements OnInit {

  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  saving = false;

  successMessage = '';
  errorMessage = '';

  user = {
    fullName: '',
    email: '',
    location: '',
    skills: '',
    bio: ''
  };

  ngOnInit(): void {
    this.loadProfile();
  }

  private getHeaders(): HttpHeaders {
    const token =
      typeof localStorage === 'undefined'
        ? ''
        : localStorage.getItem('token');

    return new HttpHeaders(
      token
        ? {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
        : {
          'Content-Type': 'application/json'
        }
    );
  }

  loadProfile(): void {
    this.loading = true;
    this.errorMessage = '';

    this.http.get<any>(
      'http://localhost:5000/api/profile',
      {
        headers: this.getHeaders()
      }
    ).subscribe({

      next: (response) => {
        console.log('Edit Profile loaded:', response);

        const data = response?.data;

        if (!data) {
          this.errorMessage =
            'Profile data was not returned by the server.';
          this.loading = false;
          this.cdr.detectChanges();
          return;
        }

        this.user = {
          fullName: data.fullName || '',
          email: data.email || '',
          location: data.location || '',
          skills: Array.isArray(data.skills)
            ? data.skills.join(', ')
            : data.skills || '',
          bio: data.bio || ''
        };

        this.loading = false;
        this.cdr.detectChanges();
      },

      error: (error) => {
        console.error(
          'Failed to load profile:',
          error
        );

        this.errorMessage =
          error.error?.message ||
          'Unable to load your profile.';

        this.loading = false;
        this.cdr.detectChanges();
      }

    });
  }

  saveProfile(): void {

    if (!this.user.fullName.trim()) {
      this.errorMessage =
        'Full name is required.';
      return;
    }

    this.saving = true;
    this.successMessage = '';
    this.errorMessage = '';

    const skills = this.user.skills
      .split(',')
      .map(skill => skill.trim())
      .filter(skill => skill.length > 0);

    const body = {
      fullName: this.user.fullName.trim(),
      location: this.user.location.trim(),
      skills,
      bio: this.user.bio.trim()
    };

    this.http.put<any>(
      'http://localhost:5000/api/profile',
      body,
      {
        headers: this.getHeaders()
      }
    ).subscribe({

      next: (response) => {
        console.log(
          'Edit Profile updated:',
          response
        );

        const data = response?.data;

        if (data) {
          this.user = {
            fullName: data.fullName || '',
            email: data.email || '',
            location: data.location || '',
            skills: Array.isArray(data.skills)
              ? data.skills.join(', ')
              : data.skills || '',
            bio: data.bio || ''
          };
        }

        this.successMessage =
          response?.message ||
          'Profile updated successfully.';

        this.saving = false;
        this.cdr.detectChanges();
      },

      error: (error) => {
        console.error(
          'Failed to update profile:',
          error
        );

        this.errorMessage =
          error.error?.message ||
          'Unable to update profile.';

        this.saving = false;
        this.cdr.detectChanges();
      }

    });
  }

  cancel(): void {
    this.router.navigate(['/dashboard']);
  }
}