import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-opportunity-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './opportunity-details.html',
  styleUrl: './opportunity-details.css',
})
export class OpportunityDetails implements OnInit {

  opportunity: any;

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

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {

    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.opportunity = this.opportunities.find(
      item => item.id === id
    );

  }

}