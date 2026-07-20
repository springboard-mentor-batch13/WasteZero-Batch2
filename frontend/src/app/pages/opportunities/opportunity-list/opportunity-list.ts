import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
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

import { Opportunity } from '../opportunity.model';
import { OpportunityService } from '../opportunity.service';

@Component({
  selector: 'app-opportunity-list',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    RouterLink,
    MatSelectModule,
  ],
  templateUrl: './opportunity-list.html',
  styleUrl: './opportunity-list.css'
})
export class OpportunityList {

  private readonly opportunitiesService = inject(OpportunityService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);

  opportunities: Opportunity[] = [];
  filteredOpportunities: Opportunity[] = [];
  userRole: string | null = null;
  canCreateOpportunity = false;
  loading = false;
  hasLoaded = false;
  errorMessage = '';

  searchText = '';
  selectedCategory = '';
  categories: string[] = [];
  private searchTimeout?: ReturnType<typeof setTimeout>;

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  private async load(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';
    this.hasLoaded = false;

    try {
      this.userRole = this.opportunitiesService.getUserRole();
      this.updateCreateOpportunityVisibility();

      const opportunities = await this.opportunitiesService.getAll();
      this.opportunities = opportunities;
      this.filteredOpportunities = [...opportunities];
      this.categories = [...new Set(opportunities.map((opportunity) => opportunity.category).filter(Boolean))];
    } catch (error) {
      console.error('Failed to load opportunities:', error);
      this.opportunities = [];
      this.filteredOpportunities = [];
      this.categories = [];
      this.errorMessage = error instanceof Error ? error.message : 'Unable to load opportunities.';
      this.showMessage(this.errorMessage);
    } finally {
      this.hasLoaded = true;
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  updateCreateOpportunityVisibility(): void {
    this.canCreateOpportunity = this.userRole === 'Admin' || this.userRole === 'NGO';
  }

  triggerSearch(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      void this.searchOpportunities();
    }, 250);
  }

  async searchOpportunities(): Promise<void> {
    const search = this.searchText.trim().toLowerCase();

    try {
      if (search) {
        const results = await this.opportunitiesService.search(search);
        this.filteredOpportunities = this.selectedCategory
          ? results.filter((opportunity) => opportunity.category === this.selectedCategory)
          : results;
      } else if (this.selectedCategory) {
        const results = await this.opportunitiesService.filter('', '', '', this.selectedCategory);
        this.filteredOpportunities = results;
      } else {
        this.filteredOpportunities = [...this.opportunities];
      }
    } catch (error) {
      console.error('Search error:', error);
      this.filteredOpportunities = [];
      this.showMessage(error instanceof Error ? error.message : 'Unable to complete action.');
    } finally {
      this.cdr.detectChanges();
    }
  }

  private showMessage(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3500 });
  }
}
