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
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);

  opportunity?: Opportunity;
  loading = false;
  canManageOpportunity = false;

  async ngOnInit(): Promise<void> {
    
    this.loading = true;
    this.canManageOpportunity = ['Admin', 'NGO'].includes(this.opportunityService.getUserRole() ?? '');

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      await this.router.navigate(['/opportunities']);
      return;
    }

    try {
      const opportunity = await this.opportunityService.getById(id);
      this.opportunity = opportunity;

      if (!opportunity) {
        this.snackBar.open('Opportunity not found.', 'Close', { duration: 3500 });
        await this.router.navigate(['/opportunities']);
        return;
      }
    } catch (error) {
      console.error('Opportunity detail load failed:', error);
      this.snackBar.open(
        error instanceof Error ? error.message : 'Unable to complete action.',
        'Close',
        { duration: 3500 }
      );

      await this.router.navigate(['/opportunities']);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }
  delete(): void {
    if (!this.opportunity) return;

    this.dialog.open(DeleteOpportunityDialog, { data: { title: this.opportunity.title }, width: '420px' })
      .afterClosed()
      .subscribe(async (confirmed) => {
        if (!confirmed) return;

        try {
          const deleted = await this.opportunityService.delete(this.opportunity!.id);
          if (deleted) {
            this.snackBar.open('Opportunity deleted successfully.', 'Close', { duration: 3500 });
            await this.router.navigate(['/opportunities']);
          } else {
            this.snackBar.open('Unable to complete action.', 'Close', { duration: 3500 });
          }
        } catch {
          this.snackBar.open('Unable to complete action.', 'Close', { duration: 3500 });
        }
      });
  }
}
