import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../auth/auth.service';
import { ApplicationService } from '../../applications/application.service';
import {
  ApplicationStatus,
  VolunteerApplicationRequest
} from '../../applications/application.model';
import { DeleteOpportunityDialog } from '../delete-opportunity-dialog/delete-opportunity-dialog';
import { Opportunity } from '../opportunity.model';
import { OpportunityService } from '../opportunity.service';

@Component({
  selector: 'app-opportunity-detail',
  standalone: true,
  imports: [DatePipe, MatButtonModule, MatCardModule, MatChipsModule, MatIconModule, MatProgressSpinnerModule, RouterLink],
  templateUrl: './opportunity-detail.html',
  styleUrl: './opportunity-detail.css'
})
export class OpportunityDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly opportunityService = inject(OpportunityService);
  private readonly applicationService = inject(ApplicationService);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);

  opportunity?: Opportunity;
  loading = true;
  errorMessage = '';
  sendingJoinRequest = false;

applicationStatusLoading = false;
applicationStatusError = '';
applicationStatus: ApplicationStatus | null = null;

appliedOpportunityIds = new Set<string>();
  readonly placeholderImage = 'images/opportunity-placeholder.svg';

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (!id) {
        this.loading = false;
        this.errorMessage = 'Unable to load opportunity details.';
        this.router.navigate(['/opportunities']);
        return;
      }

      this.loading = true;
      this.errorMessage = '';
      this.opportunityService.getById(id).subscribe({
        next: (opportunity) => {
          this.opportunity = opportunity;
          this.sendingJoinRequest = false;
          this.loading = false;
          if (this.isVolunteer()) this.loadApplicationState(opportunity.id);
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Failed to load opportunity:', error);
          this.loading = false;
          this.errorMessage = error.error?.message || 'Unable to load opportunity details.';
          this.snackBar.open(this.errorMessage, 'Close', { duration: 3500 });
          this.cdr.detectChanges();
        }
      });
    });
  }

  delete(): void {
    if (!this.opportunity || !this.canManageSelectedOpportunity()) return;

    this.dialog.open(DeleteOpportunityDialog, { data: { title: this.opportunity.title }, width: '420px' })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) return;

        this.opportunityService.delete(this.opportunity!.id).subscribe({
          next: () => {
            this.snackBar.open('Opportunity deleted successfully.', 'Close', { duration: 3500 });
            this.router.navigate(['/opportunities']);
          },
          error: (error) => {
            console.error('Failed to delete opportunity:', error);
            this.snackBar.open(error.error?.message || 'Unable to complete action.', 'Close', { duration: 3500 });
          }
        });
      });
  }

  apply(): void {
    if (!this.opportunity || !this.isVolunteer()) return;
    if (this.hasJoinRequest(this.opportunity.id)) {
      this.snackBar.open('Already Applied', 'Close', { duration: 3500 });
      return;
    }

    const user = this.authService.getUser();
    if (!user?.id) {
      this.snackBar.open('Unable to submit application. Please sign in again.', 'Close', { duration: 3500 });
      return;
    }

    const request: VolunteerApplicationRequest = {
      opportunityId: this.opportunity.id,
    };

    this.sendingJoinRequest = true;
    this.applicationService.apply(request).subscribe({
      next: () => {
        this.appliedOpportunityIds.add(request.opportunityId);
        this.sendingJoinRequest = false;
        this.snackBar.open('Application submitted successfully.', 'Close', { duration: 3500 });
        this.cdr.detectChanges();
      },
      error: (error: { error?: { message?: string } }) => {
        console.error('Failed to submit application:', error);
        if (error.error?.message?.toLowerCase().includes('already applied')) {
          this.appliedOpportunityIds.add(request.opportunityId);
        }
        this.sendingJoinRequest = false;
        this.snackBar.open(error.error?.message || 'Unable to submit application.', 'Close', { duration: 3500 });
        this.cdr.detectChanges();
      }
    });
  }

  hasJoinRequest(opportunityId: string): boolean {
    return this.appliedOpportunityIds.has(opportunityId);
  }

  joinButtonText(opportunityId: string): string {
    if (this.sendingJoinRequest) return 'Sending...';
    if (this.hasJoinRequest(opportunityId)) return 'Already Applied';
    return 'Apply / Join Opportunity';
  }

  usePlaceholder(event: Event): void {
    const image = event.target as HTMLImageElement;
    if (!image.src.endsWith(this.placeholderImage)) image.src = this.placeholderImage;
  }

  postedByName(postedBy?: Opportunity['postedBy']): string {
    if (typeof postedBy === 'string') return postedBy;
    return postedBy?.username || postedBy?.name || postedBy?.fullName || postedBy?.email || 'Unknown User';
  }

  postedByRole(postedBy?: Opportunity['postedBy']): string {
    if (typeof postedBy === 'object' && postedBy?.role) return postedBy.role;
    return 'Role unavailable';
  }

  canManageOpportunities(): boolean { return this.authService.canManageOpportunities(); }

  canManageSelectedOpportunity(): boolean {
    if (!this.opportunity || !this.canManageOpportunities()) return false;
    if (this.authService.getUserRole() === 'Admin') return true;
    const userId = this.authService.getUser()?.id;
    return !!userId && this.opportunity.ngoId === userId;
  }

  isVolunteer(): boolean { return this.authService.getUserRole() === 'Volunteer'; }

  private loadApplicationState(opportunityId: string): void {
  this.applicationStatusLoading = true;
  this.applicationStatusError = '';
  this.applicationStatus = null;

  this.applicationService.hasApplication(opportunityId).subscribe({
    next: (result) => {

      if (result.applied && result.application) {
        this.appliedOpportunityIds.add(opportunityId);

        this.applicationStatus = result.application.status;
      } else {
        this.appliedOpportunityIds.delete(opportunityId);
        this.applicationStatus = null;
      }

      this.applicationStatusLoading = false;
      this.cdr.detectChanges();
    },

    error: (error) => {
      console.error('Failed to check application status:', error);

      this.applicationStatusLoading = false;
      this.applicationStatusError =
        error.error?.message || 'Unable to load application status.';

      this.cdr.detectChanges();
    }
  });
}
}
