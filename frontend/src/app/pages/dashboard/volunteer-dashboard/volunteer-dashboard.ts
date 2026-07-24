import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
  inject
} from '@angular/core';

import {
  ApplicationService,
  VolunteerDashboardStats
} from '../../applications/application.service';

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
  private readonly cdr = inject(ChangeDetectorRef);

  stats: VolunteerDashboardStats = {
    availableOpportunities: 0,
    myApplications: 0,
    completedOpportunities: 0,
    pendingOpportunities: 0
  };

  loading = true;
  errorMessage = '';

  ngOnInit(): void {
    this.loadDashboardStats();
  }

  private loadDashboardStats(): void {
    this.loading = true;
    this.errorMessage = '';

    this.applicationService.getVolunteerDashboardStats().subscribe({
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

        this.errorMessage = 'Unable to load dashboard statistics.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}