import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-opportunity-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './opportunity-list.html',
  styleUrl: './opportunity-list.css'
})
export class OpportunityList {

  constructor(private router: Router) {}

  searchText = '';
  selectedLocation = 'All';

  opportunities = [
    {
      id: 1,
      title: 'Beach Cleanup Drive',
      category: 'Environment',
      description: 'Help remove plastic waste from the beach and spread awareness.',
      location: 'Marina Beach, Chennai',
      eventDate: '2026-08-02',
      requiredVolunteers: 40,
      skillsRequired: ['Waste Sorting', 'Teamwork']
    },
    {
      id: 2,
      title: 'Community Health Camp',
      category: 'Healthcare',
      description: 'Support doctors and assist visitors during the health camp.',
      location: 'Adyar Community Hall, Chennai',
      eventDate: '2026-08-09',
      requiredVolunteers: 20,
      skillsRequired: ['Communication', 'First Aid']
    },
    {
      id: 3,
      title: 'Weekend Reading Mentors',
      category: 'Education',
      description: 'Guide school children through reading and storytelling.',
      location: 'Velachery Learning Centre',
      eventDate: '2026-08-16',
      requiredVolunteers: 15,
      skillsRequired: ['Teaching', 'Storytelling']
    },
    {
      id: 4,
      title: 'Street Animal Care Day',
      category: 'Animal Welfare',
      description: 'Help rescue teams care for street animals.',
      location: 'Besant Nagar, Chennai',
      eventDate: '2026-08-23',
      requiredVolunteers: 25,
      skillsRequired: ['Animal Handling', 'Compassion']
    },
    {
      id: 5,
      title: 'Neighbourhood Food Drive',
      category: 'Community Service',
      description: 'Collect and distribute food supplies to needy families.',
      location: 'T. Nagar, Chennai',
      eventDate: '2026-08-30',
      requiredVolunteers: 30,
      skillsRequired: ['Packing', 'Logistics']
    }
  ];

  get filteredOpportunities() {
    return this.opportunities.filter(op => {

      const search =
        op.title.toLowerCase().includes(this.searchText.toLowerCase());

      const location =
        this.selectedLocation === 'All' ||
        op.location === this.selectedLocation;

      return search && location;
    });
  }

  viewDetails(id: number) {
    this.router.navigate(['/opportunities', id]);
  }

}