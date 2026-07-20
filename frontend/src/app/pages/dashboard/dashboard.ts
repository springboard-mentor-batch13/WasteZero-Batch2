import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';

import { DashboardStats, OpportunityService } from '../opportunities/opportunity.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  private readonly opportunities = inject(OpportunityService);
  private readonly cdr = inject(ChangeDetectorRef);

  opportunityStats?: DashboardStats;

  async ngOnInit(): Promise<void> {
    try {
      this.opportunityStats = await this.opportunities.getDashboardStats();
    } catch (error) {
      console.error('Failed to load opportunity dashboard stats:', error);
      this.opportunityStats = undefined;
    } finally {
      this.cdr.detectChanges();
    }
  }
}
