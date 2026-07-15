import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import { RouterLink } from '@angular/router';

import { Opportunity } from '../opportunity.model';
import { OpportunityService } from '../opportunity.service';

import { MatSelectModule } from '@angular/material/select';

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
    RouterLink,
    MatSelectModule,
  ],
  templateUrl: './opportunity-list.html',
  styleUrl: './opportunity-list.css'
})
export class OpportunityList {

  private readonly opportunitiesService = inject(OpportunityService);

  opportunities: Opportunity[] = [];
  filteredOpportunities: Opportunity[] = [];

  searchText = '';

  selectedCategory = '';

 categories: string[] = [];

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
  this.opportunities = this.opportunitiesService.getAll();
  this.filteredOpportunities = [...this.opportunities];

  this.categories = [
    ...new Set(this.opportunities.map(o => o.category))
  ];
}

  
searchOpportunities(): void {

  const search = this.searchText.toLowerCase().trim();

  this.filteredOpportunities = this.opportunities.filter(opportunity => {

    const matchesSearch =
      opportunity.title.toLowerCase().includes(search) ||
      opportunity.location.toLowerCase().includes(search) ||
      opportunity.category.toLowerCase().includes(search);

    const matchesCategory =
      !this.selectedCategory ||
      opportunity.category === this.selectedCategory;

    return matchesSearch && matchesCategory;
  });

}
}