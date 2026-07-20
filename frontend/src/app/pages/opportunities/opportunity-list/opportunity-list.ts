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

import { OPPORTUNITY_STATE_CITIES, OPPORTUNITY_STATUSES, Opportunity, OpportunityStatus } from '../opportunity.model';
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
  selectedStatus: OpportunityStatus | '' = '';
  selectedState = '';
  selectedCity = '';
  readonly statuses = OPPORTUNITY_STATUSES;
  readonly stateCities = OPPORTUNITY_STATE_CITIES;
  readonly placeholderImage = 'images/opportunity-placeholder.svg';

  ngOnInit(): void {
    this.loadOpportunities();
  }

  private loadOpportunities(): void {
    this.loading = true;
    const request = this.selectedStatus
      ? this.opportunitiesService.getByStatus(this.selectedStatus)
      : this.opportunitiesService.getAll();

    request.subscribe({
      next: (opportunities) => {
        this.opportunities = opportunities;
        this.applyFilters();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load opportunities:', error);
        this.opportunities = [];
        this.filteredOpportunities = [];
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onStatusChange(): void {
    this.loadOpportunities();
  }

  onStateChange(): void {
    this.selectedCity = '';
    this.applyFilters();
  }

  applyFilters(): void {
    const search = this.searchText.toLowerCase().trim();
    const searchableOpportunities = this.opportunities.filter((opportunity) => {
      const matchesSearch = !search ||
        opportunity.title.toLowerCase().includes(search) ||
        opportunity.description.toLowerCase().includes(search) ||
        opportunity.city.toLowerCase().includes(search) ||
        opportunity.state.toLowerCase().includes(search) ||
        opportunity.requiredSkills.some((skill) => skill.toLowerCase().includes(search));
      const matchesStatus = !this.selectedStatus || (opportunity.status || 'Open') === this.selectedStatus;
      const matchesState = !this.selectedState || opportunity.state === this.selectedState;
      return matchesSearch && matchesStatus && matchesState;
    });

    if (!this.selectedCity) {
      this.filteredOpportunities = searchableOpportunities;
      return;
    }

    const cityMatches = searchableOpportunities.filter((opportunity) => opportunity.city === this.selectedCity);
    this.filteredOpportunities = cityMatches.length ? cityMatches : searchableOpportunities;
  }

  availableStates(): string[] {
    return [...new Set([
      ...this.stateCities.map((option) => option.state),
      ...this.opportunities.map((opportunity) => opportunity.state),
    ].filter(Boolean))].sort();
  }

  availableCities(): string[] {
    if (!this.selectedState) return [];
    const configuredCities = this.stateCities.find((option) => option.state === this.selectedState)?.cities ?? [];
    const opportunityCities = this.opportunities
      .filter((opportunity) => opportunity.state === this.selectedState)
      .map((opportunity) => opportunity.city);
    return [...new Set([...configuredCities, ...opportunityCities].filter(Boolean))].sort();
  }

  usePlaceholder(event: Event): void {
    const image = event.target as HTMLImageElement;
    if (!image.src.endsWith(this.placeholderImage)) image.src = this.placeholderImage;
  }

  canManageOpportunities(): boolean { return this.authService.canManageOpportunities(); }
}
