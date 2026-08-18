import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  inject,
  ElementRef,
  ViewChild
} from '@angular/core';

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

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';


@Component({
  selector: 'app-reports',
  standalone: true,

  imports: [
    CommonModule,
    BaseChartDirective
  ],

  templateUrl: './reports.html',

  styleUrl: './reports.css'
})
export class Reports implements OnInit {

  private readonly reportsService =
    inject(ReportsService);


  // =====================================================
  // PDF REPORT CONTENT
  // =====================================================

  @ViewChild('reportContent')
  reportContent!: ElementRef<HTMLDivElement>;


  // =====================================================
  // REPORT DATA
  // =====================================================

  dashboard: DashboardReport | null = null;

  usersReport: UserReport[] = [];

  opportunitiesReport: OpportunityReport[] = [];

  volunteerResponses: VolunteerResponseReport[] = [];


  // =====================================================
  // PAGE STATE
  // =====================================================

  loading = true;

  errorMessage = '';

  pdfLoading = false;

  today = new Date();


  // =====================================================
  // USER ANALYTICS - DOUGHNUT CHART
  // =====================================================

  userChartType: 'doughnut' = 'doughnut';

  userChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [
      {
        data: []
      }
    ]
  };

  userChartOptions:
    ChartConfiguration<'doughnut'>['options'] = {

    responsive: true,

    maintainAspectRatio: false,

    animation: false,

    plugins: {
      legend: {
        position: 'bottom'
      }
    }

  };


  // =====================================================
  // OPPORTUNITY ANALYTICS - BAR CHART
  // =====================================================

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

  opportunityChartOptions:
    ChartConfiguration<'bar'>['options'] = {

    responsive: true,

    maintainAspectRatio: false,

    animation: false,

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


  // =====================================================
  // VOLUNTEER RESPONSES - DOUGHNUT CHART
  // =====================================================

  volunteerChartType: 'doughnut' = 'doughnut';

  volunteerChartData: ChartData<'doughnut'> = {
    labels: [],

    datasets: [
      {
        data: []
      }
    ]
  };

  volunteerChartOptions:
    ChartConfiguration<'doughnut'>['options'] = {

    responsive: true,

    maintainAspectRatio: false,

    animation: false,

    plugins: {

      legend: {
        position: 'bottom'
      }

    }

  };


  // =====================================================
  // INITIALIZATION
  // =====================================================

  ngOnInit(): void {

    this.loadReports();

  }


  // =====================================================
  // LOAD ALL REPORTS
  // =====================================================

  private loadReports(): void {

    this.loading = true;

    this.errorMessage = '';


    // -----------------------------------------------------
    // Dashboard statistics
    // -----------------------------------------------------

    this.reportsService
      .getDashboardStats()
      .subscribe({

        next: (data) => {

          this.dashboard = data;

          this.loading = false;

        },

        error: (error) => {

          console.error(
            'Failed to load dashboard report:',
            error
          );

          this.errorMessage =
            'Unable to load reports.';

          this.loading = false;

        }

      });


    // -----------------------------------------------------
    // User report
    // -----------------------------------------------------

    this.reportsService
      .getUserReport()
      .subscribe({

        next: (data) => {

          this.usersReport = data;

          this.updateUserChart(data);

        },

        error: (error) => {

          console.error(
            'Failed to load user report:',
            error
          );

        }

      });


    // -----------------------------------------------------
    // Opportunity report
    // -----------------------------------------------------

    this.reportsService
      .getOpportunityReport()
      .subscribe({

        next: (data) => {

          this.opportunitiesReport = data;

          this.updateOpportunityChart(data);

        },

        error: (error) => {

          console.error(
            'Failed to load opportunity report:',
            error
          );

        }

      });


    // -----------------------------------------------------
    // Volunteer response report
    // -----------------------------------------------------

    this.reportsService
      .getVolunteerResponseReport()
      .subscribe({

        next: (data) => {

          this.volunteerResponses = data;

          this.updateVolunteerChart(data);

        },

        error: (error) => {

          console.error(
            'Failed to load volunteer response report:',
            error
          );

        }

      });

  }


  // =====================================================
  // UPDATE USER CHART
  // =====================================================

  private updateUserChart(
    data: UserReport[]
  ): void {

    this.userChartData = {

      labels: data.map(
        item => item._id
      ),

      datasets: [
        {
          data: data.map(
            item => item.totalUsers
          )
        }
      ]

    };

  }


  // =====================================================
  // UPDATE OPPORTUNITY CHART
  // =====================================================

  private updateOpportunityChart(
    data: OpportunityReport[]
  ): void {

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

      labels: [
        'Open',
        'Closed',
        'In Progress',
        'Removed'
      ],

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


  // =====================================================
  // UPDATE VOLUNTEER RESPONSE CHART
  // =====================================================

  private updateVolunteerChart(
    data: VolunteerResponseReport[]
  ): void {

    this.volunteerChartData = {

      labels: data.map(
        item => item._id
      ),

      datasets: [
        {
          data: data.map(
            item => item.totalApplications
          )
        }
      ]

    };

  }


  // =====================================================
  // DOWNLOAD COMPLETE PDF REPORT
  // =====================================================

  async downloadPdf(): Promise<void> {

    if (
      this.loading ||
      !this.dashboard ||
      !this.reportContent
    ) {

      return;

    }


    if (this.pdfLoading) {

      return;

    }


    this.pdfLoading = true;


    try {

      /*
       * Give Angular/Chart.js a moment to finish
       * rendering before taking the screenshot.
       */

      await new Promise<void>(
        resolve => {

          setTimeout(
            () => resolve(),
            500
          );

        }
      );


      const element =
        this.reportContent.nativeElement;


      /*
       * Hide CSV buttons and other elements
       * that should not appear in the PDF.
       */

      element.classList.add(
        'pdf-export-mode'
      );


      /*
       * Convert the complete report to an image.
       *
       * scale: 2 gives better PDF quality.
       */

      const canvas =
        await html2canvas(
          element,
          {

            scale: 2,

            useCORS: true,

            allowTaint: true,

            backgroundColor: '#f4faf6',

            logging: false,

            windowWidth:
              element.scrollWidth

          }
        );


      /*
       * Remove PDF export class after capture.
       */

      element.classList.remove(
        'pdf-export-mode'
      );


      /*
       * Create A4 PDF.
       */

      const pdf =
        new jsPDF(
          'p',
          'mm',
          'a4'
        );


      const pageWidth =
        pdf.internal.pageSize.getWidth();


      const pageHeight =
        pdf.internal.pageSize.getHeight();


      const margin = 10;


      const usableWidth =
        pageWidth - (
          margin * 2
        );


      const imageWidth =
        usableWidth;


      const imageHeight =
        (
          canvas.height *
          imageWidth
        ) /
        canvas.width;


      const imageData =
        canvas.toDataURL(
          'image/png',
          1.0
        );


      let heightLeft =
        imageHeight;


      let position =
        margin;


      /*
       * First page.
       */

      pdf.addImage(

        imageData,

        'PNG',

        margin,

        position,

        imageWidth,

        imageHeight

      );


      heightLeft -=
        pageHeight - (
          margin * 2
        );


      /*
       * Additional pages.
       */

      while (
        heightLeft > 0
      ) {

        position =
          heightLeft -
          imageHeight +
          margin;


        pdf.addPage();


        pdf.addImage(

          imageData,

          'PNG',

          margin,

          position,

          imageWidth,

          imageHeight

        );


        heightLeft -=
          pageHeight - (
            margin * 2
          );

      }


      /*
       * Add page numbers.
       */

      const totalPages =
        pdf.getNumberOfPages();


      for (
        let page = 1;
        page <= totalPages;
        page++
      ) {

        pdf.setPage(page);

        pdf.setFontSize(8);

        pdf.setTextColor(
          100,
          100,
          100
        );

        pdf.text(

          `WasteZero Analytics Report | Page ${page} of ${totalPages}`,

          pageWidth / 2,

          pageHeight - 5,

          {
            align: 'center'
          }

        );

      }


      /*
       * Generate filename using today's date.
       */

      const today =
        new Date()
          .toISOString()
          .split('T')[0];


      pdf.save(
        `WasteZero_Analytics_Report_${today}.pdf`
      );

    }

    catch (error) {

      console.error(
        'PDF generation failed:',
        error
      );

      this.errorMessage =
        'Unable to generate PDF report. Please try again.';

    }

    finally {

      if (this.reportContent) {

        this.reportContent
          .nativeElement
          .classList.remove(
            'pdf-export-mode'
          );

      }

      this.pdfLoading = false;

    }

  }


  // =====================================================
  // EXISTING CSV DOWNLOADS
  // =====================================================
  // These are intentionally kept so your old
  // functionality is not removed.
  // =====================================================


  downloadUsersReport(): void {

    this.reportsService
      .downloadUsersReport()
      .subscribe({

        next: (blob) => {

          this.downloadFile(
            blob,
            'users_report.csv'
          );

        },

        error: (error) => {

          console.error(
            'Users report download failed:',
            error
          );

        }

      });

  }


  downloadOpportunitiesReport(): void {

    this.reportsService
      .downloadOpportunitiesReport()
      .subscribe({

        next: (blob) => {

          this.downloadFile(
            blob,
            'opportunities_report.csv'
          );

        },

        error: (error) => {

          console.error(
            'Opportunities report download failed:',
            error
          );

        }

      });

  }


  downloadApplicationsReport(): void {

    this.reportsService
      .downloadApplicationsReport()
      .subscribe({

        next: (blob) => {

          this.downloadFile(
            blob,
            'applications_report.csv'
          );

        },

        error: (error) => {

          console.error(
            'Applications report download failed:',
            error
          );

        }

      });

  }


  // =====================================================
  // GENERIC FILE DOWNLOAD
  // =====================================================

  private downloadFile(
    blob: Blob,
    filename: string
  ): void {

    const url =
      window.URL.createObjectURL(
        blob
      );


    const link =
      document.createElement('a');


    link.href = url;

    link.download = filename;


    document.body.appendChild(
      link
    );


    link.click();


    document.body.removeChild(
      link
    );


    window.URL.revokeObjectURL(
      url
    );

  }

}