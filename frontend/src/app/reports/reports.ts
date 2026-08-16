import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
  DashboardReport,
  OpportunityReport,
  ReportsService,
  UserReport,
  VolunteerResponseReport
} from './reports.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports.html',
  styleUrl: './reports.css'
})
export class Reports implements OnInit {

  private readonly reportsService = inject(ReportsService);

  dashboard: DashboardReport | null = null;
  usersReport: UserReport[] = [];
  opportunitiesReport: OpportunityReport[] = [];
  volunteerResponses: VolunteerResponseReport[] = [];

  loading = true;
  errorMessage = '';

  ngOnInit(): void {
    this.loadReports();
  }

  private loadReports(): void {
    this.loading = true;
    this.errorMessage = '';

    this.reportsService.getDashboardStats().subscribe({
      next: (data) => {
        this.dashboard = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load dashboard report:', error);
        this.errorMessage = 'Unable to load reports.';
        this.loading = false;
      }
    });

    this.reportsService.getUserReport().subscribe({
      next: (data) => {
        this.usersReport = data;
      },
      error: (error) => {
        console.error('Failed to load user report:', error);
      }
    });

    this.reportsService.getOpportunityReport().subscribe({
      next: (data) => {
        this.opportunitiesReport = data;
      },
      error: (error) => {
        console.error('Failed to load opportunity report:', error);
      }
    });

    this.reportsService.getVolunteerResponseReport().subscribe({
      next: (data) => {
        this.volunteerResponses = data;
      },
      error: (error) => {
        console.error('Failed to load volunteer response report:', error);
      }
    });
  }

  downloadUsersReport(): void {
    this.reportsService.downloadUsersReport().subscribe({
      next: (blob) => this.downloadFile(blob, 'users_report.csv'),
      error: (error) => console.error('Users report download failed:', error)
    });
  }

  downloadOpportunitiesReport(): void {
    this.reportsService.downloadOpportunitiesReport().subscribe({
      next: (blob) =>
        this.downloadFile(blob, 'opportunities_report.csv'),
      error: (error) =>
        console.error('Opportunities report download failed:', error)
    });
  }

  downloadApplicationsReport(): void {
    this.reportsService.downloadApplicationsReport().subscribe({
      next: (blob) =>
        this.downloadFile(blob, 'applications_report.csv'),
      error: (error) =>
        console.error('Applications report download failed:', error)
    });
  }

  private downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();

    window.URL.revokeObjectURL(url);
  }
}