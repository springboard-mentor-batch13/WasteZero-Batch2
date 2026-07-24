import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
  inject
} from '@angular/core';

import {
  AdminDashboardStats,
  OpportunityService
} from '../../opportunities/opportunity.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboard implements OnInit {

  @Input() userName = '';

  private readonly opportunityService = inject(OpportunityService);

  private readonly cdr = inject(ChangeDetectorRef);

  stats: AdminDashboardStats = {
    totalUsers: 0,
    totalOpportunities: 0,
    adminOpportunities: 0,
    ngoOpportunities: 0
  };

  loading = true;
  errorMessage = '';

  ngOnInit(): void {
    this.loadDashboardStats();
  }

  private loadDashboardStats(): void {
  this.loading = true;
  this.errorMessage = '';

  this.opportunityService.getAdminDashboardStats().subscribe({
    next: (stats) => {
      console.log('Admin dashboard stats:', stats);

      this.stats = stats;
      this.loading = false;

      this.cdr.detectChanges();
    },

    error: (error) => {
      console.error(
        'Failed to load Admin dashboard statistics:',
        error
      );

      this.errorMessage = 'Unable to load dashboard statistics.';
      this.loading = false;

      this.cdr.detectChanges();
    }
  });
}
}