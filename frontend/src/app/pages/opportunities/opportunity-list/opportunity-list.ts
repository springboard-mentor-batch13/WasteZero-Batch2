import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../auth/auth.service';
import { OPPORTUNITY_CATEGORIES, OPPORTUNITY_STATE_CITIES, OPPORTUNITY_STATUSES, Opportunity, OpportunityStatus } from '../opportunity.model';
import { OpportunityService } from '../opportunity.service';

@Component({
  selector: 'app-opportunity-list',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    RouterLink,
  ],
  templateUrl: './opportunity-list.html',
  styleUrl: './opportunity-list.css'
})
export class OpportunityList implements OnInit {
  private readonly opportunitiesService = inject(OpportunityService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);

  opportunities: Opportunity[] = [];
  filteredOpportunities: Opportunity[] = [];
  loading = true;
  errorMessage = '';
  searchText = '';
  selectedStatus: OpportunityStatus | '' = '';
  selectedState = '';
  selectedCity = '';
  selectedCategory = '';
  readonly statuses = OPPORTUNITY_STATUSES;
  readonly categories = OPPORTUNITY_CATEGORIES;
  readonly stateCities = OPPORTUNITY_STATE_CITIES;
  readonly placeholderImage = 'images/opportunity-placeholder.svg';

  ngOnInit(): void {
    this.loadOpportunities();
  }

  private loadOpportunities(): void {
    this.loading = true;
    this.errorMessage = '';

    this.opportunitiesService.getAll().subscribe({
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
        this.errorMessage = error.error?.message || 'Unable to load opportunities.';
        this.loading = false;
        this.showMessage(this.errorMessage);
        this.cdr.detectChanges();
      }
    });
  }

  onStatusChange(): void {
    this.applyFilters();
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
        opportunity.category.toLowerCase().includes(search) ||
        opportunity.location.toLowerCase().includes(search) ||
        opportunity.city.toLowerCase().includes(search) ||
        opportunity.state.toLowerCase().includes(search) ||
        opportunity.requiredSkills.some((skill) => skill.toLowerCase().includes(search));
      const matchesStatus = !this.selectedStatus || (opportunity.status || 'Open') === this.selectedStatus;
      const matchesState = !this.selectedState || opportunity.state === this.selectedState;
      const matchesCity = !this.selectedCity || opportunity.city === this.selectedCity;
      const matchesCategory = !this.selectedCategory || opportunity.category === this.selectedCategory;
      return matchesSearch && matchesStatus && matchesState && matchesCity && matchesCategory;
    });

    this.filteredOpportunities = searchableOpportunities;
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

  canManageOpportunities(): boolean {
    return this.authService.canManageOpportunities();
  }

  private showMessage(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3500 });
  }
}
