import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { DeleteOpportunityDialog } from '../delete-opportunity-dialog/delete-opportunity-dialog';
import { Opportunity, OpportunityApplication } from '../opportunity.model';
import { OpportunityService } from '../opportunity.service';
import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-opportunity-detail',
  standalone: true,
  imports: [DatePipe, MatButtonModule, MatCardModule, MatChipsModule, MatIconModule, RouterLink],
  templateUrl: './opportunity-detail.html',
  styleUrl: './opportunity-detail.css'
})
export class OpportunityDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly opportunities = inject(OpportunityService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly authService = inject(AuthService);

  opportunity?: Opportunity;
  loading = true;
  errorMessage = '';
  readonly placeholderImage = 'images/opportunity-placeholder.svg';

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (!id) {
        this.loading = false;
        this.errorMessage = 'Unable to load opportunity details.';
        return;
      }

      this.loading = true;
      this.errorMessage = '';
      this.opportunities.getById(id).subscribe({
        next: (opportunity) => {
          console.log('Loaded opportunity details:', opportunity);
          this.opportunity = opportunity;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Failed to load opportunity:', error);
          this.loading = false;
          this.errorMessage = 'Unable to load opportunity details.';
          this.cdr.detectChanges();
        }
      });
    });
  }

  delete(): void {
    if (!this.opportunity || !this.canManageOpportunities()) return;
    this.dialog.open(DeleteOpportunityDialog, { data: { title: this.opportunity.title }, width: '420px' })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.opportunities.delete(this.opportunity!.id).subscribe({
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

  async apply(): Promise<void> {
    if (!this.opportunity || !this.isVolunteer()) return;

    const user = this.authService.getUser();
    const { ApplyOpportunityDialog } = await import('../apply-opportunity-dialog/apply-opportunity-dialog');

    this.dialog.open(ApplyOpportunityDialog, {
      data: {
        opportunityTitle: this.opportunity.title,
        fullName: user?.fullName,
        email: user?.email
      },
      width: '640px',
      maxWidth: '94vw'
    })
      .afterClosed()
      .subscribe((application?: OpportunityApplication) => {
        if (!application || !this.opportunity) return;

        this.opportunities.apply(this.opportunity.id, application).subscribe({
          next: () => {
            this.snackBar.open('Application submitted successfully.', 'Close', { duration: 3500 });
          },
          error: (error) => {
            console.error('Failed to submit application:', error);
            this.snackBar.open(error.error?.message || 'Unable to submit application.', 'Close', { duration: 3500 });
          }
        });
      });
  }

  usePlaceholder(event: Event): void {
    const image = event.target as HTMLImageElement;
    if (!image.src.endsWith(this.placeholderImage)) image.src = this.placeholderImage;
  }

  postedByName(postedBy?: Opportunity['postedBy']): string {
    if (typeof postedBy === 'string') return postedBy;
    return postedBy?.name || postedBy?.email || 'Unknown User';
  }

  postedByRole(postedBy?: Opportunity['postedBy']): string {
    if (typeof postedBy === 'object' && postedBy?.role) return postedBy.role;
    // TODO: Backend should include postedBy.role so the creator can be labeled as NGO or Admin.
    return 'Role unavailable';
  }

  canManageOpportunities(): boolean { return this.authService.canManageOpportunities(); }

  isVolunteer(): boolean { return this.authService.getUserRole() === 'Volunteer'; }
}
