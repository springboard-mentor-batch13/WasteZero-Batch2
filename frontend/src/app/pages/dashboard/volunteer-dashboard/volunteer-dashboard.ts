import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
  inject
} from '@angular/core';
import { Router } from '@angular/router';

import {
  ApplicationService,
  VolunteerDashboardStats
} from '../../applications/application.service';

import {
  MatchingService,
  MatchedOpportunity
} from './matching.service';

@Component({
  selector: 'app-volunteer-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './volunteer-dashboard.html',
  styleUrl: './volunteer-dashboard.css'
})
export class VolunteerDashboard implements OnInit {

  @Input() userName = '';

  private readonly applicationService = inject(ApplicationService);
  private readonly matchingService = inject(MatchingService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  stats: VolunteerDashboardStats = {
    availableOpportunities: 0,
    myApplications: 0,
    completedOpportunities: 0,
    pendingOpportunities: 0
  };

  matches: MatchedOpportunity[] = [];

  loading = true;
  matchesLoading = true;

  errorMessage = '';
  matchErrorMessage = '';

  ngOnInit(): void {
    this.loadDashboardStats();
    this.loadMatches();
  }

  private loadDashboardStats(): void {
    this.loading = true;
    this.errorMessage = '';

    this.applicationService
      .getVolunteerDashboardStats()
      .subscribe({
        next: (stats) => {
          this.stats = stats;
          this.loading = false;
          this.cdr.detectChanges();
        },

        error: (error) => {
          console.error(
            'Failed to load volunteer dashboard statistics:',
            error
          );

          this.errorMessage =
            'Unable to load dashboard statistics.';

          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  private loadMatches(): void {
    this.matchesLoading = true;
    this.matchErrorMessage = '';

    this.matchingService
      .getMatches()
      .subscribe({
        next: (matches) => {
          this.matches = matches;
          this.matchesLoading = false;
          this.cdr.detectChanges();
        },

        error: (error) => {
          console.error(
            'Failed to load opportunity matches:',
            error
          );

          this.matchErrorMessage =
            'Unable to load recommended opportunities.';

          this.matchesLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  viewOpportunity(id: string): void {
    this.router.navigate(['/opportunities', id]);
  }

  browseOpportunities(): void {
    this.router.navigate(['/opportunities']);
  }

  updateProfile(): void {
    this.router.navigate(['/edit-profile']);
  }
}