import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';

import { Opportunity } from '../opportunity.model';
import { OpportunityService } from '../opportunity.service';
import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-opportunity-list',
  standalone: true,
  imports: [DatePipe, FormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule, RouterLink],
  templateUrl: './opportunity-list.html',
  styleUrl: './opportunity-list.css'
})
export class OpportunityList implements OnInit {
  private readonly opportunitiesService = inject(OpportunityService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly authService = inject(AuthService);

  opportunities: Opportunity[] = [];
  filteredOpportunities: Opportunity[] = [];
  loading = true;
  searchText = '';
  selectedStatus = '';
  selectedLocation = '';
  statuses: string[] = [];
  locations: string[] = [];
  readonly placeholderImage = 'images/opportunity-placeholder.svg';

  ngOnInit(): void {
    this.loadOpportunities();
  }

  private loadOpportunities(): void {
    this.opportunitiesService.getAll().subscribe({
      next: (opportunities) => {
        this.opportunities = opportunities;
        this.statuses = [...new Set(opportunities.map((opportunity) => opportunity.status || 'Open'))];
        this.locations = [...new Set(opportunities.map((opportunity) => opportunity.location))];
        this.applyFilters();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load opportunities:', error);
        this.opportunities = [];
        this.filteredOpportunities = [];
        this.statuses = [];
        this.locations = [];
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilters(): void {
    const search = this.searchText.toLowerCase().trim();
    this.filteredOpportunities = this.opportunities.filter((opportunity) => {
      const matchesSearch = !search ||
        opportunity.title.toLowerCase().includes(search) ||
        opportunity.location.toLowerCase().includes(search) ||
        opportunity.category.toLowerCase().includes(search);
      const matchesStatus = !this.selectedStatus || (opportunity.status || 'Open') === this.selectedStatus;
      const matchesLocation = !this.selectedLocation || opportunity.location === this.selectedLocation;
      return matchesSearch && matchesStatus && matchesLocation;
    });
  }

  usePlaceholder(event: Event): void {
    const image = event.target as HTMLImageElement;
    if (!image.src.endsWith(this.placeholderImage)) image.src = this.placeholderImage;
  }

  canManageOpportunities(): boolean { return this.authService.canManageOpportunities(); }
}
