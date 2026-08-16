import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);
import {
  ChartConfiguration,
  ChartData
} from 'chart.js';

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
  imports: [CommonModule, BaseChartDirective],
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

  // -----------------------------
  // User Analytics - Doughnut Chart
  // -----------------------------
  userChartType: 'doughnut' = 'doughnut';

  userChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [
      {
        data: []
      }
    ]
  };

  userChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  };

  // -----------------------------
  // Opportunity Analytics - Bar Chart
  // -----------------------------
  opportunityChartType: 'bar' = 'bar';

  opportunityChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        label: 'Opportunities',
        data: []
      }
    ]
  };

  opportunityChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    },
    plugins: {
      legend: {
        display: false
      }
    }
  };

  // -----------------------------
  // Volunteer Responses - Doughnut Chart
  // -----------------------------
  volunteerChartType: 'doughnut' = 'doughnut';

  volunteerChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [
      {
        data: []
      }
    ]
  };

  volunteerChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  };

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
        this.updateUserChart(data);
      },
      error: (error) => {
        console.error('Failed to load user report:', error);
      }
    });

    this.reportsService.getOpportunityReport().subscribe({
      next: (data) => {
        this.opportunitiesReport = data;
        this.updateOpportunityChart(data);
      },
      error: (error) => {
        console.error('Failed to load opportunity report:', error);
      }
    });

    this.reportsService.getVolunteerResponseReport().subscribe({
      next: (data) => {
        this.volunteerResponses = data;
        this.updateVolunteerChart(data);
      },
      error: (error) => {
        console.error('Failed to load volunteer response report:', error);
      }
    });
  }

  private updateUserChart(data: UserReport[]): void {
    this.userChartData = {
      labels: data.map(item => item._id),
      datasets: [
        {
          data: data.map(item => item.totalUsers)
        }
      ]
    };
  }

  private updateOpportunityChart(data: OpportunityReport[]): void {
    if (!data.length) {
      this.opportunityChartData = {
        labels: [],
        datasets: [
          {
            label: 'Opportunities',
            data: []
          }
        ]
      };
      return;
    }

    const opportunity = data[0];

    this.opportunityChartData = {
      labels: ['Open', 'Closed', 'In Progress', 'Removed'],
      datasets: [
        {
          label: 'Opportunities',
          data: [
            opportunity.open,
            opportunity.closed,
            opportunity.inProgress,
            opportunity.removed
          ]
        }
      ]
    };
  }

  private updateVolunteerChart(data: VolunteerResponseReport[]): void {
    this.volunteerChartData = {
      labels: data.map(item => item._id),
      datasets: [
        {
          data: data.map(item => item.totalApplications)
        }
      ]
    };
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