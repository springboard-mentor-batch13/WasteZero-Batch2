import { DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { DeleteOpportunityDialog } from '../delete-opportunity-dialog/delete-opportunity-dialog';
import { Opportunity } from '../opportunity.model';
import { OpportunityService } from '../opportunity.service';

@Component({ selector: 'app-opportunity-detail', standalone: true, imports: [DatePipe, MatButtonModule, MatCardModule, MatChipsModule, MatIconModule, RouterLink], templateUrl: './opportunity-detail.html', styleUrl: './opportunity-detail.css' })
export class OpportunityDetail implements OnInit {
  private readonly route = inject(ActivatedRoute); private readonly router = inject(Router); private readonly opportunities = inject(OpportunityService); private readonly dialog = inject(MatDialog); private readonly snackBar = inject(MatSnackBar);
  opportunity?: Opportunity;
  ngOnInit(): void { this.opportunity = this.opportunities.getById(Number(this.route.snapshot.paramMap.get('id'))); if (!this.opportunity) this.router.navigate(['/opportunities']); }
  delete(): void { if (!this.opportunity) return; this.dialog.open(DeleteOpportunityDialog, { data: { title: this.opportunity.title }, width: '400px' }).afterClosed().subscribe((confirmed) => { if (confirmed && this.opportunities.delete(this.opportunity!.id)) { this.snackBar.open('Opportunity deleted successfully.', 'Close', { duration: 3500 }); this.router.navigate(['/opportunities']); } }); }
}
