import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
  inject
} from '@angular/core';

import {
  DashboardStats,
  OpportunityService
} from '../../opportunities/opportunity.service';

@Component({
  selector: 'app-ngo-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ngo-dashboard.html',
  styleUrl: './ngo-dashboard.css'
})
export class NgoDashboard implements OnInit {

  @Input() userName = '';

  private readonly opportunityService = inject(OpportunityService);
  private readonly cdr = inject(ChangeDetectorRef);

  stats: DashboardStats = {
    totalOpportunities: 0,
    openOpportunities: 0,
    closedOpportunities: 0,
    inProgressOpportunities: 0,
    myOpportunities: 0,
    totalApplications: 0,
    myOpportunityApplications: 0,
    completedDrives: 0,
    myCompletedDrives: 0
  };

  loading = true;
  errorMessage = '';

  ngOnInit(): void {

    const cachedStats =
      this.opportunityService.getCachedDashboardStats();

    if (cachedStats) {

      this.stats = cachedStats;
      this.loading = false;

      // Immediately update the screen with cached values
      this.cdr.detectChanges();

      // Get fresh statistics in background
      this.loadDashboardStats(true);

    } else {

      this.loadDashboardStats();
    }
  }

  private loadDashboardStats(forceRefresh = false): void {

    const hasCache =
      !!this.opportunityService.getCachedDashboardStats();

    if (!hasCache) {
      this.loading = true;
    }

    this.errorMessage = '';

    this.opportunityService
      .getDashboardStats(forceRefresh)
      .subscribe({

        next: (stats) => {

          console.log('NGO dashboard stats received:', stats);

          this.stats = stats;
          this.loading = false;

          // Force Angular to update the cards
          this.cdr.detectChanges();
        },

        error: (error) => {

          console.error(
            'Failed to load NGO dashboard statistics:',
            error
          );

          this.errorMessage =
            'Unable to load dashboard statistics.';

          this.loading = false;

          this.cdr.detectChanges();
        }
      });
  }
}