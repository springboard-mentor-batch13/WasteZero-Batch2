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
import { DeleteOpportunityDialog } from '../delete-opportunity-dialog/delete-opportunity-dialog';
import { Opportunity, OpportunityJoinRequest } from '../opportunity.model';
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
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);

  opportunity?: Opportunity;
  loading = true;
  errorMessage = '';
  sendingJoinRequest = false;
  private readonly recentlySentOpportunityIds = new Set<string>();
  private readonly joinRequestStorageKey = 'wastezero.joinRequests';
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
    if (!this.opportunity || !this.canManageOpportunities()) return;

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
      this.snackBar.open('Request Already Sent', 'Close', { duration: 3500 });
      return;
    }

    const user = this.authService.getUser();
    if (!user?.id || !user.fullName || !user.email) {
      this.snackBar.open('Unable to send join request. Please sign in again.', 'Close', { duration: 3500 });
      return;
    }

    const request: OpportunityJoinRequest = {
      opportunityId: this.opportunity.id,
      volunteerUserId: user.id,
      volunteerFullName: user.fullName,
      volunteerEmail: user.email,
      timestamp: new Date().toISOString(),
    };

    this.sendingJoinRequest = true;
    this.opportunityService.joinOpportunity(request).subscribe({
      next: () => {
        this.markJoinRequestSent(request.opportunityId);
        this.recentlySentOpportunityIds.add(request.opportunityId);
        this.sendingJoinRequest = false;
        this.snackBar.open('Join request sent successfully.', 'Close', { duration: 3500 });
        this.cdr.detectChanges();
      },
      error: (error: { error?: { message?: string } }) => {
        console.error('Failed to send join request:', error);
        this.sendingJoinRequest = false;
        this.snackBar.open(error.error?.message || 'Unable to send join request.', 'Close', { duration: 3500 });
        this.cdr.detectChanges();
      }
    });
  }

  hasJoinRequest(opportunityId: string): boolean {
    const userId = this.authService.getUser()?.id;
    if (!userId) return false;
    return this.readJoinRequests().includes(this.joinRequestKey(opportunityId, userId));
  }

  joinButtonText(opportunityId: string): string {
    if (this.sendingJoinRequest) return 'Sending...';
    if (this.recentlySentOpportunityIds.has(opportunityId)) return 'Request Sent';
    if (this.hasJoinRequest(opportunityId)) return 'Request Already Sent';
    return 'Apply / Join Opportunity';
  }
  async apply(): Promise<void> {
  if (!this.opportunity || !this.isVolunteer()) {
    return;
  }

  const user = this.authService.getUser();
  const { ApplyOpportunityDialog } = await import(
    '../apply-opportunity-dialog/apply-opportunity-dialog'
  );

  this.dialog
    .open(ApplyOpportunityDialog, {
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
      if (!application || !this.opportunity) {
        return;
      }

      this.opportunityService.apply(this.opportunity.id, application).subscribe({
        next: () => {
          this.snackBar.open(
            'Application submitted successfully.',
            'Close',
            { duration: 3500 }
          );
        },
        error: (error: any) => {
          console.error('Failed to submit application:', error);
          this.snackBar.open(
            error.error?.message || 'Unable to submit application.',
            'Close',
            { duration: 3500 }
          );
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

  private markJoinRequestSent(opportunityId: string): void {
    const userId = this.authService.getUser()?.id;
    if (!userId || typeof localStorage === 'undefined') return;

    const requests = new Set(this.readJoinRequests());
    requests.add(this.joinRequestKey(opportunityId, userId));
    localStorage.setItem(this.joinRequestStorageKey, JSON.stringify([...requests]));
  }

  private readJoinRequests(): string[] {
    if (typeof localStorage === 'undefined') return [];

    try {
      const savedRequests = JSON.parse(localStorage.getItem(this.joinRequestStorageKey) || '[]');
      return Array.isArray(savedRequests) ? savedRequests.filter((request) => typeof request === 'string') : [];
    } catch {
      return [];
    }
  }

  private joinRequestKey(opportunityId: string, userId: string): string {
    return `${userId}:${opportunityId}`;
  }
}
