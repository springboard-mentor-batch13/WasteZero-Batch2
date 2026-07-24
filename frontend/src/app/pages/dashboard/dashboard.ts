import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';

import { AuthService } from '../../auth/auth.service';
import { AdminDashboard } from './admin-dashboard/admin-dashboard';
import { NgoDashboard } from './ngo-dashboard/ngo-dashboard';
import { VolunteerDashboard } from './volunteer-dashboard/volunteer-dashboard';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    AdminDashboard,
    NgoDashboard,
    VolunteerDashboard
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {

  private readonly authService = inject(AuthService);

  user: any = null;
  role = '';

  ngOnInit(): void {
    this.user = this.authService.getUser();
    this.role = this.user?.role || this.authService.getRole() || '';
  }

  get isAdmin(): boolean {
    return this.role === 'Admin';
  }

  get isNGO(): boolean {
    return this.role === 'NGO';
  }

  get isVolunteer(): boolean {
    return this.role === 'Volunteer';
  }
}