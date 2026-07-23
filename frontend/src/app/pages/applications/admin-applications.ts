import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';

import { ApplicationService } from './application.service';
import { ApplicationStatus, VolunteerApplication } from './application.model';

@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule,
  ],
  templateUrl: './admin-applications.html',
  styleUrl: './admin-applications.css'
})
export class ApplicationsComponent implements OnInit {
  private readonly applicationsService = inject(ApplicationService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);

  applications: VolunteerApplication[] = [];
  loading = true;
  errorMessage = '';
  searchText = '';
  selectedStatus: ApplicationStatus | '' = '';
  updatingApplicationId = '';
  readonly statuses: ApplicationStatus[] = ['Pending', 'Accepted', 'Rejected'];
  readonly displayedColumns = ['fullName', 'email', 'opportunityTitle', 'appliedDate', 'status', 'actions'];

  ngOnInit(): void {
    this.loadApplications();
  }

  get filteredApplications(): VolunteerApplication[] {
    const search = this.searchText.toLowerCase().trim();

    return this.applications.filter((application) => {
      const matchesStatus = !this.selectedStatus || application.status === this.selectedStatus;
      const matchesSearch = !search ||
        application.fullName.toLowerCase().includes(search) ||
        application.email.toLowerCase().includes(search) ||
        application.opportunityTitle.toLowerCase().includes(search);

      return matchesStatus && matchesSearch;
    });
  }

  loadApplications(): void {
    this.loading = true;
    this.errorMessage = '';

    this.applicationsService.getApplications().subscribe({
      next: (applications) => {
        this.applications = applications;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load volunteer applications:', error);
        this.applications = [];
        this.loading = false;
        this.errorMessage = error.error?.message || 'Unable to load volunteer applications right now.';
        this.cdr.detectChanges();
      }
    });
  }

  updateStatus(application: VolunteerApplication, status: ApplicationStatus): void {
    this.updatingApplicationId = application.id;

    this.applicationsService.updateStatus(application.id, status).subscribe({
      next: () => {
        this.snackBar.open(`Application ${status.toLowerCase()} successfully.`, 'Close', { duration: 3500 });
        this.updatingApplicationId = '';
        this.loadApplications();
      },
      error: (error) => {
        console.error('Failed to update application status:', error);
        this.updatingApplicationId = '';
        this.snackBar.open(error.error?.message || 'Unable to update application status.', 'Close', { duration: 3500 });
        this.cdr.detectChanges();
      }
    });
  }
}
