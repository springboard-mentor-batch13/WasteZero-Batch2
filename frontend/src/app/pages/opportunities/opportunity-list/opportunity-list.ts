import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';

import { DeleteOpportunityDialog } from '../delete-opportunity-dialog/delete-opportunity-dialog';
import { Opportunity } from '../opportunity.model';
import { OpportunityService } from '../opportunity.service';

@Component({
  selector: 'app-opportunity-list', standalone: true,
  imports: [DatePipe, MatButtonModule, MatCardModule, MatChipsModule, MatIconModule, RouterLink],
  templateUrl: './opportunity-list.html', styleUrl: './opportunity-list.css'
})
export class OpportunityList {
  private readonly opportunitiesService = inject(OpportunityService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  opportunities: Opportunity[] = [];

  ngOnInit(): void { this.load(); }

  delete(opportunity: Opportunity): void {
    this.dialog.open(DeleteOpportunityDialog, { data: { title: opportunity.title }, width: '400px' })
      .afterClosed().subscribe((confirmed) => {
        if (!confirmed) return;
        if (this.opportunitiesService.delete(opportunity.id)) {
          this.snackBar.open('Opportunity deleted successfully.', 'Close', { duration: 3500 });
          this.load();
        } else this.snackBar.open('Unable to complete action.', 'Close', { duration: 3500 });
      });
  }

  private load(): void { this.opportunities = this.opportunitiesService.getAll(); }
}
