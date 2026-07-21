import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';

import { AuthService } from '../../auth/auth.service';
import { DashboardStats, OpportunityService } from '../opportunities/opportunity.service';
import { AdminDashboard } from './admin-dashboard/admin-dashboard';
import { NgoDashboard } from './ngo-dashboard/ngo-dashboard';
import { VolunteerDashboard } from './volunteer-dashboard/volunteer-dashboard';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, AdminDashboard, NgoDashboard, VolunteerDashboard],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly opportunities = inject(OpportunityService);
  private readonly cdr = inject(ChangeDetectorRef);

  user: any = null;
  role = '';
  opportunityStats?: DashboardStats;

  ngOnInit(): void {
    this.user = this.authService.getUser();
    this.role = this.user?.role || this.authService.getRole() || '';
    this.loadOpportunityStats();
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

  private loadOpportunityStats(): void {
    this.opportunities.getDashboardStats().subscribe({
      next: (stats) => {
        this.opportunityStats = stats;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load opportunity dashboard stats:', error);
        this.opportunityStats = undefined;
        this.cdr.detectChanges();
      }
    });
  }
}
