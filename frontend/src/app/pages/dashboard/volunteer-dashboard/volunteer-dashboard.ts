import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
  inject
} from '@angular/core';
import { Router } from '@angular/router';

import {
  ApplicationService,
  VolunteerDashboardStats
} from '../../applications/application.service';

import {
  MatchingService,
  MatchedOpportunity,
  MatchingPreferences
} from './matching.service';

@Component({
  selector: 'app-volunteer-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './volunteer-dashboard.html',
  styleUrl: './volunteer-dashboard.css'
})
export class VolunteerDashboard implements OnInit {

  @Input() userName = '';

  private readonly applicationService = inject(ApplicationService);
  private readonly matchingService = inject(MatchingService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  stats: VolunteerDashboardStats = {
    availableOpportunities: 0,
    myApplications: 0,
    completedOpportunities: 0,
    pendingOpportunities: 0
  };

  matches: MatchedOpportunity[] = [];

  preferences: MatchingPreferences = {
  state: '',
  city: '',
  preferredWasteTypes: []
};

hasPreferences = false;
showPreferenceForm = false;
preferencesLoading = true;
savingPreferences = false;
preferenceErrorMessage = '';

expandedOpportunityId: string | null = null;

readonly wasteTypes = [
  'Plastic',
  'Organic',
  'E-Waste',
  'Paper',
  'Glass',
  'Metal',
  'Mixed'
];

readonly stateCities: Record<string, string[]> = {
  'Andhra Pradesh': [
    'Visakhapatnam',
    'Vijayawada',
    'Guntur',
    'Nellore'
  ],
  'Delhi': [
    'New Delhi',
    'Delhi'
  ],
  'Gujarat': [
    'Ahmedabad',
    'Surat',
    'Vadodara',
    'Rajkot'
  ],
  'Karnataka': [
    'Bengaluru',
    'Mysuru',
    'Mangaluru',
    'Hubballi'
  ],
  'Kerala': [
    'Kochi',
    'Thiruvananthapuram',
    'Kozhikode',
    'Thrissur'
  ],
  'Maharashtra': [
    'Mumbai',
    'Pune',
    'Nagpur',
    'Nashik'
  ],
  'Rajasthan': [
    'Jaipur',
    'Jodhpur',
    'Udaipur',
    'Kota'
  ],
  'Tamil Nadu': [
    'Chennai',
    'Coimbatore',
    'Madurai',
    'Tiruchirappalli'
  ],
  'Telangana': [
    'Hyderabad',
    'Warangal',
    'Karimnagar',
    'Nizamabad'
  ],
  'Uttar Pradesh': [
    'Lucknow',
    'Kanpur',
    'Noida',
    'Varanasi'
  ],
  'West Bengal': [
    'Kolkata',
    'Howrah',
    'Durgapur',
    'Siliguri'
  ]
};

  loading = true;
  matchesLoading = true;

  errorMessage = '';
  matchErrorMessage = '';

  ngOnInit(): void {
  this.loadDashboardStats();
  this.loadPreferences();
}

  private loadDashboardStats(): void {
    this.loading = true;
    this.errorMessage = '';

    this.applicationService
      .getVolunteerDashboardStats()
      .subscribe({
        next: (stats) => {
          this.stats = stats;
          this.loading = false;
          this.cdr.detectChanges();
        },

        error: (error) => {
          console.error(
            'Failed to load volunteer dashboard statistics:',
            error
          );

          this.errorMessage =
            'Unable to load dashboard statistics.';

          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  private loadPreferences(): void {
  this.preferencesLoading = true;
  this.preferenceErrorMessage = '';

  this.matchingService
    .getPreferences()
    .subscribe({
      next: (preferences) => {
        this.preferences = preferences;

        this.hasPreferences =
          !!preferences.state &&
          !!preferences.city &&
          preferences.preferredWasteTypes.length > 0;

        this.preferencesLoading = false;

        if (this.hasPreferences) {
          this.loadMatches();
        } else {
          this.matches = [];
          this.matchesLoading = false;
        }

        this.cdr.detectChanges();
      },

      error: (error) => {
        console.error(
          'Failed to load matching preferences:',
          error
        );

        this.preferenceErrorMessage =
          'Unable to load matching preferences.';

        this.preferencesLoading = false;
        this.matchesLoading = false;

        this.cdr.detectChanges();
      }
    });
}
get states(): string[] {
  return Object.keys(this.stateCities);
}

get availableCities(): string[] {
  return this.preferences.state
    ? this.stateCities[this.preferences.state] || []
    : [];
}

onStateChange(): void {
  this.preferences.city = '';
}
isWasteTypeSelected(wasteType: string): boolean {
  return this.preferences.preferredWasteTypes.includes(wasteType);
}

toggleWasteType(wasteType: string): void {
  const selected =
    this.preferences.preferredWasteTypes.includes(wasteType);

  if (selected) {
    this.preferences.preferredWasteTypes =
      this.preferences.preferredWasteTypes.filter(
        type => type !== wasteType
      );
  } else {
    this.preferences.preferredWasteTypes = [
      ...this.preferences.preferredWasteTypes,
      wasteType
    ];
  }
}
openPreferenceForm(): void {
  this.showPreferenceForm = true;
  this.preferenceErrorMessage = '';
}

cancelPreferenceForm(): void {
  this.showPreferenceForm = false;

  if (this.hasPreferences) {
    this.loadPreferences();
  }
}
savePreferences(): void {
  if (
    !this.preferences.state ||
    !this.preferences.city ||
    this.preferences.preferredWasteTypes.length === 0
  ) {
    this.preferenceErrorMessage =
      'Please select state, city and at least one waste type.';
    return;
  }

  this.savingPreferences = true;
  this.preferenceErrorMessage = '';

  this.matchingService
    .savePreferences(this.preferences)
    .subscribe({
      next: (savedPreferences) => {
        this.preferences = savedPreferences;
        this.hasPreferences = true;
        this.showPreferenceForm = false;
        this.savingPreferences = false;

        // Immediately refresh recommendations
        this.loadMatches();

        this.cdr.detectChanges();
      },

      error: (error) => {
        console.error(
          'Failed to save matching preferences:',
          error
        );

        this.preferenceErrorMessage =
          'Unable to save preferences. Please try again.';

        this.savingPreferences = false;
        this.cdr.detectChanges();
      }
    });
}
toggleOpportunity(id: string): void {
  this.expandedOpportunityId =
    this.expandedOpportunityId === id
      ? null
      : id;
}

isOpportunityExpanded(id: string): boolean {
  return this.expandedOpportunityId === id;
}
  private loadMatches(): void {
    this.matchesLoading = true;
    this.matchErrorMessage = '';

    this.matchingService
      .getMatches()
      .subscribe({
        next: (matches) => {
          this.matches = matches;
          this.matchesLoading = false;
          this.cdr.detectChanges();
        },

        error: (error) => {
          console.error(
            'Failed to load opportunity matches:',
            error
          );

          this.matchErrorMessage =
            'Unable to load recommended opportunities.';

          this.matchesLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  viewOpportunity(id: string): void {
    this.router.navigate(['/opportunities', id]);
  }

  browseOpportunities(): void {
    this.router.navigate(['/opportunities']);
  }

  updateProfile(): void {
    this.router.navigate(['/edit-profile']);
  }

  myApplications(): void {
  this.router.navigate(['/my-applications']);
}
}