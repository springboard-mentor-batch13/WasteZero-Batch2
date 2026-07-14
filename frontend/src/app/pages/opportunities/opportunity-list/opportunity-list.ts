import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import { Opportunity } from '../opportunity.model';
import { OpportunityService } from '../opportunity.service';

@Component({
  selector: 'app-opportunity-list', standalone: true,
  imports: [DatePipe, MatButtonModule, MatCardModule, MatIconModule, RouterLink],
  templateUrl: './opportunity-list.html', styleUrl: './opportunity-list.css'
})
export class OpportunityList {
  private readonly opportunitiesService = inject(OpportunityService);

  opportunities: Opportunity[] = [];

  ngOnInit(): void { this.load(); }

  private load(): void { this.opportunities = this.opportunitiesService.getAll(); }
}
