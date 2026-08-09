import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { Opportunity } from '../../opportunities/opportunity.model';

export interface MatchDetails {
  locationMatch: boolean;
  sameCity: boolean;
  sameState: boolean;
  matchedWasteTypes: string[];
}

export interface MatchedOpportunity extends Opportunity {
  matchScore: number;
  matchDetails: MatchDetails;
  wasteTypes: string[];
}

interface MatchApiOpportunity {
  _id: string;
  ngoId?: string | { _id?: string };
  postedBy?: Opportunity['postedBy'];

  title: string;
  category?: string;
  description: string;

  requiredSkills?: string[];
  wasteTypes?: string[];

  duration?: string;
  city?: string;
  state?: string;

  date?: string;
  eventDate?: string;
  location?: string;

  requiredVolunteers?: number;
  status?: Opportunity['status'];

  imageUrl?: string;
  createdAt?: string;

  matchScore: number;
  matchDetails: MatchDetails;
}

interface MatchResponse {
  success: boolean;
  count: number;
  message?: string;
  data: MatchApiOpportunity[];
}

export interface MatchingPreferences {
  city: string;
  state: string;
  preferredWasteTypes: string[];
}

interface ProfileResponse {
  success: boolean;
  message?: string;
  data: {
    city?: string;
    state?: string;
    preferredWasteTypes?: string[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class MatchingService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    'http://localhost:5001/api/matches';

  private readonly profileApiUrl =
    'http://localhost:5001/api/profile';

  getMatches(): Observable<MatchedOpportunity[]> {

    return this.http
      .get<MatchResponse>(
        this.apiUrl,
        {
          headers: this.headers()
        }
      )
      .pipe(
        map(response =>
          response.data
            .map(opportunity =>
              this.fromApi(opportunity)
            )
            .sort((a, b) => b.matchScore - a.matchScore)
        )
      );
  }

  getPreferences(): Observable<MatchingPreferences> {
    return this.http
      .get<ProfileResponse>(
        this.profileApiUrl,
        {
          headers: this.headers()
        }
      )
      .pipe(
        map(response => ({
          city: response.data.city || '',
          state: response.data.state || '',
          preferredWasteTypes:
            response.data.preferredWasteTypes || []
        }))
      );
  }

  savePreferences(
    preferences: MatchingPreferences
  ): Observable<MatchingPreferences> {
    return this.http
      .put<ProfileResponse>(
        this.profileApiUrl,
        preferences,
        {
          headers: this.headers()
        }
      )
      .pipe(
        map(response => ({
          city: response.data.city || '',
          state: response.data.state || '',
          preferredWasteTypes:
            response.data.preferredWasteTypes || []
        }))
      );
  }

  private headers(): HttpHeaders {

    const token =
      typeof localStorage === 'undefined'
        ? ''
        : localStorage.getItem('token');

    return new HttpHeaders(
      token
        ? {
          Authorization: `Bearer ${token}`
        }
        : {}
    );
  }

  private fromApi(
    opportunity: MatchApiOpportunity
  ): MatchedOpportunity {

    const date =
      opportunity.date
        ? new Date(opportunity.date)
        : new Date();

    return {
      id: opportunity._id,

      ngoId:
        typeof opportunity.ngoId === 'string'
          ? opportunity.ngoId
          : opportunity.ngoId?._id,

      postedBy: opportunity.postedBy,

      title: opportunity.title,
      category: opportunity.category || '',
      description: opportunity.description,

      requiredSkills: opportunity.requiredSkills || [],
      skillsRequired: opportunity.requiredSkills || [],
      wasteTypes: opportunity.wasteTypes || [],

      duration: opportunity.duration || '',

      city: opportunity.city || '',
      state: opportunity.state || '',

      date,

      eventDate:
        opportunity.eventDate ||
        opportunity.date ||
        '',

      location:
        opportunity.location ||
        [opportunity.city, opportunity.state]
          .filter(Boolean)
          .join(', '),

      requiredVolunteers:
        opportunity.requiredVolunteers || 1,

      status:
        opportunity.status || 'Open',

      imageUrl: opportunity.imageUrl,
      imagePreviewUrl: opportunity.imageUrl,

      createdAt: opportunity.createdAt,

      matchScore: opportunity.matchScore,
      matchDetails: opportunity.matchDetails
    };
  }
}