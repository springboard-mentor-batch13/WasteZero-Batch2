import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';
import { Router } from '@angular/router';

import { ApplicationService } from '../application.service';
import { VolunteerApplication } from '../application.model';

@Component({
  selector: 'app-my-applications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-applications.html',
  styleUrl: './my-applications.css'
})
export class MyApplicationsComponent implements OnInit {

  private readonly applicationService = inject(ApplicationService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  applications: VolunteerApplication[] = [];

  loading = true;
  errorMessage = '';

  ngOnInit(): void {
    this.loadApplications();
  }

  private loadApplications(): void {
    this.loading = true;
    this.errorMessage = '';

    this.applicationService
      .getMyApplications()
      .subscribe({
        next: (applications) => {
          this.applications = applications;
          this.loading = false;
          this.cdr.detectChanges();
        },

        error: (error) => {
          console.error(
            'Failed to load volunteer applications:',
            error
          );

          this.errorMessage =
            'Unable to load your applications.';

          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  viewOpportunity(opportunityId: string): void {
    if (!opportunityId) {
      return;
    }

    this.router.navigate([
      '/opportunities',
      opportunityId
    ]);
  }

  browseOpportunities(): void {
    this.router.navigate(['/opportunities']);
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}