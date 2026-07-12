import { Injectable } from '@angular/core';

import { Opportunity, OpportunityDraft } from './opportunity.model';

@Injectable({ providedIn: 'root' })
export class OpportunityService {
  private nextId = 6;
  private opportunities: Opportunity[] = [
    { id: 1, title: 'Beach Cleanup Drive', category: 'Environment', description: 'Help our coastal team remove plastic waste and sort recyclable materials from the shoreline.', location: 'Marina Beach, Chennai', eventDate: '2026-08-02', requiredVolunteers: 40, skillsRequired: ['Waste sorting', 'Teamwork'] },
    { id: 2, title: 'Community Health Camp', category: 'Healthcare', description: 'Support a free health screening camp by welcoming visitors and assisting the medical team.', location: 'Adyar Community Hall, Chennai', eventDate: '2026-08-09', requiredVolunteers: 20, skillsRequired: ['First aid', 'Communication'] },
    { id: 3, title: 'Weekend Reading Mentors', category: 'Education', description: 'Mentor school children through reading activities, storytelling sessions and simple learning games.', location: 'Velachery Learning Centre', eventDate: '2026-08-16', requiredVolunteers: 15, skillsRequired: ['Teaching', 'Storytelling'] },
    { id: 4, title: 'Street Animal Care Day', category: 'Animal Welfare', description: 'Assist local rescuers with feeding, grooming and creating care kits for community animals.', location: 'Besant Nagar, Chennai', eventDate: '2026-08-23', requiredVolunteers: 25, skillsRequired: ['Animal handling', 'Compassion'] },
    { id: 5, title: 'Neighbourhood Food Drive', category: 'Community Service', description: 'Collect, pack and distribute essential food supplies to families in our local community.', location: 'T. Nagar, Chennai', eventDate: '2026-08-30', requiredVolunteers: 30, skillsRequired: ['Packing', 'Logistics'] }
  ];

  // TODO: Replace these in-memory methods with backend API calls when available.
  getAll(): Opportunity[] {
    return this.opportunities.map((opportunity) => this.copy(opportunity));
  }

  getById(id: number): Opportunity | undefined {
    const opportunity = this.opportunities.find((item) => item.id === id);
    return opportunity ? this.copy(opportunity) : undefined;
  }

  create(draft: OpportunityDraft): Opportunity {
    const opportunity = { ...draft, id: this.nextId++, skillsRequired: [...draft.skillsRequired] };
    this.opportunities = [...this.opportunities, opportunity];
    return this.copy(opportunity);
  }

  update(id: number, draft: OpportunityDraft): Opportunity | undefined {
    const index = this.opportunities.findIndex((item) => item.id === id);
    if (index < 0) return undefined;

    const opportunity = { ...draft, id, skillsRequired: [...draft.skillsRequired] };
    this.opportunities = this.opportunities.map((item, itemIndex) => itemIndex === index ? opportunity : item);
    return this.copy(opportunity);
  }

  delete(id: number): boolean {
    const initialLength = this.opportunities.length;
    this.opportunities = this.opportunities.filter((item) => item.id !== id);
    return this.opportunities.length !== initialLength;
  }

  private copy(opportunity: Opportunity): Opportunity {
    return { ...opportunity, skillsRequired: [...opportunity.skillsRequired] };
  }
}
