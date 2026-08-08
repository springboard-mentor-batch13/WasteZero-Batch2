import { CommonModule, DatePipe } from '@angular/common';
import {
  Component,
  Inject,
  OnInit,
  inject,
  ChangeDetectorRef
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule
} from '@angular/material/dialog';

import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import {
  MatSnackBar,
  MatSnackBarModule
} from '@angular/material/snack-bar';

import {
  NGO_PICKUP_STATUSES,
  NGO_PICKUP_WASTE_TYPES,
  NgoPickupRequest,
  NgoPickupStatus
} from './ngo-pickup-request.model';

import { NgoPickupRequestService } from './ngo-pickup-request.service';


type PickupAction = 'accept' | 'reject';


@Component({
  selector: 'app-ngo-pickup-requests',
  standalone: true,

  imports: [
    CommonModule,
    DatePipe,
    FormsModule,

    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSnackBarModule
  ],

  templateUrl: './ngo-pickup-requests.html',
  styleUrl: './ngo-pickup-requests.css'
})
export class NgoPickupRequests implements OnInit {

  private readonly pickupService =
    inject(NgoPickupRequestService);

  private readonly dialog =
    inject(MatDialog);

  private readonly snackBar =
    inject(MatSnackBar);

  private readonly cdr =
    inject(ChangeDetectorRef);


  requests: NgoPickupRequest[] = [];

  filteredRequests: NgoPickupRequest[] = [];


  loading = false;

  errorMessage = '';


  searchText = '';

  selectedStatus: NgoPickupStatus | 'All' = 'All';

  selectedWasteType = 'All';


  updatingRequestIds = new Set<string>();


  readonly statuses = NGO_PICKUP_STATUSES;

  readonly wasteTypes = NGO_PICKUP_WASTE_TYPES;


  // ============================================================
  // INITIALIZATION
  // ============================================================

  ngOnInit(): void {
    this.loadRequests();
  }


  // ============================================================
  // LOAD REQUESTS
  // ============================================================

  loadRequests(): void {

    this.loading = true;

    this.errorMessage = '';


    this.pickupService
      .getAssignedRequests()
      .subscribe({

        next: (requests) => {

          console.log(
            'NGO Pickup Requests:',
            requests
          );


          this.requests = requests || [];

          this.applyFilters();


          this.loading = false;

          this.cdr.detectChanges();
        },


        error: (error: unknown) => {

          console.error(
            'Failed to load NGO pickup requests:',
            error
          );


          this.requests = [];

          this.filteredRequests = [];


          this.errorMessage =
            this.pickupService.getUserFriendlyError(error);


          this.showMessage(
            this.errorMessage
          );


          this.loading = false;

          this.cdr.detectChanges();
        }

      });
  }


  // ============================================================
  // FILTERS
  // ============================================================

  applyFilters(): void {

    const search =
      this.searchText
        .trim()
        .toLowerCase();


    this.filteredRequests =
      this.requests.filter((request) => {


        const matchesStatus =
          this.selectedStatus === 'All' ||
          request.status === this.selectedStatus;


        const matchesWasteType =
          this.selectedWasteType === 'All' ||
          request.wasteType === this.selectedWasteType;


        const volunteerName =
          request.volunteerName
            ?.toLowerCase() || '';


        const requestId =
          request.id
            ?.toLowerCase() || '';


        const matchesSearch =
          !search ||
          volunteerName.includes(search) ||
          requestId.includes(search);


        return (
          matchesStatus &&
          matchesWasteType &&
          matchesSearch
        );

      });
  }


  // ============================================================
  // VIEW DETAILS
  // ============================================================

  viewDetails(
    request: NgoPickupRequest
  ): void {

    this.pickupService
      .getRequestById(request.id)
      .subscribe({

        next: (details) => {

          this.dialog.open(
            NgoPickupDetailsDialog,
            {
              data: details,

              width: 'min(680px, 94vw)',

              maxWidth: '95vw',

              panelClass:
                'pickup-dialog-panel'
            }
          );

        },


        error: (error: unknown) => {

          this.showMessage(
            this.pickupService
              .getUserFriendlyError(error)
          );

        }

      });
  }


  // ============================================================
  // CHECK WHETHER NGO CAN ACCEPT / REJECT
  // ============================================================

  canTakeAction(
    request: NgoPickupRequest
  ): boolean {

    /*
     * NGO can accept/reject:
     *
     * 1. Pending
     * 2. Rescheduled
     *
     * Rescheduled is intentionally included because
     * the volunteer reported an issue and the pickup
     * has been rescheduled. The NGO must review it again.
     */

    return (
      request.status === 'Pending' ||
      request.status === 'Rescheduled'
    );
  }


  // ============================================================
  // ACCEPT / REJECT BUTTON CLICK
  // ============================================================

  confirmAction(
    request: NgoPickupRequest,
    action: PickupAction
  ): void {

    /*
     * Do not allow actions for:
     *
     * Accepted
     * In Progress
     * Completed
     * Rejected
     */

    if (
      !this.canTakeAction(request) ||
      this.isUpdating(request)
    ) {
      return;
    }


    this.updateStatus(
      request,
      action
    );
  }


  // ============================================================
  // STATUS CSS CLASS
  // ============================================================

  statusClass(
    status: NgoPickupStatus
  ): string {

    return `status-${status
      .toLowerCase()
      .replace(/\s+/g, '-')}`;
  }


  // ============================================================
  // TRACK BY
  // ============================================================

  trackById(
    _: number,
    request: NgoPickupRequest
  ): string {

    return request.id;
  }


  // ============================================================
  // CHECK WHETHER REQUEST IS UPDATING
  // ============================================================

  isUpdating(
    request: NgoPickupRequest
  ): boolean {

    return this.updatingRequestIds
      .has(request.id);
  }


  // ============================================================
  // ACCEPT / REJECT REQUEST
  // ============================================================

  private updateStatus(
    request: NgoPickupRequest,
    action: PickupAction
  ): void {


    const update$ =
      action === 'accept'

        ? this.pickupService
            .acceptRequest(request.id)

        : this.pickupService
            .rejectRequest(request.id);


    this.updatingRequestIds
      .add(request.id);


    this.cdr.detectChanges();


    update$.subscribe({

      next: () => {

        /*
         * Do not manually assume the new status.
         * Reload from backend so the NGO dashboard
         * always displays the actual database status.
         */

        this.showMessage(

          action === 'accept'

            ? 'Pickup request accepted successfully.'

            : 'Pickup request rejected.'
        );


        this.loadRequests();
      },


      error: (error: unknown) => {

        console.error(
          'Pickup status update failed:',
          error
        );


        this.showMessage(
          this.pickupService
            .getUserFriendlyError(error)
        );


        this.updatingRequestIds
          .delete(request.id);


        this.cdr.detectChanges();
      },


      complete: () => {

        this.updatingRequestIds
          .delete(request.id);

      }

    });
  }


  // ============================================================
  // REPLACE REQUEST LOCALLY
  // ============================================================

  private replaceRequest(
    updatedRequest: NgoPickupRequest
  ): void {

    this.requests =
      this.requests.map(
        (request) =>
          request.id === updatedRequest.id
            ? updatedRequest
            : request
      );


    this.applyFilters();


    this.cdr.detectChanges();
  }


  // ============================================================
  // SHOW MESSAGE
  // ============================================================

  private showMessage(
    message: string
  ): void {

    this.snackBar.open(
      message,
      'Close',
      {
        duration: 3500
      }
    );
  }

}


/* ================================================================
   NGO PICKUP DETAILS DIALOG
   ================================================================ */

@Component({

  selector:
    'app-ngo-pickup-details-dialog',

  standalone: true,

  imports: [
    CommonModule,
    DatePipe,
    MatButtonModule,
    MatChipsModule,
    MatDialogModule
  ],

  styles: [`

    .details-content {
      color: var(--wz-text-primary);
    }


    .details-header {
      display: flex;

      justify-content:
        space-between;

      align-items:
        flex-start;

      gap: 16px;

      margin-bottom: 18px;
    }


    .details-header h3 {
      margin: 2px 0 0;

      font-size: 1.35rem;
    }


    .details-kicker {
      margin: 0;

      color:
        var(--wz-primary);

      font-size: .78rem;

      font-weight: 800;

      letter-spacing: .08em;
    }


    .details-grid {
      display: grid;

      grid-template-columns:
        repeat(2, minmax(0, 1fr));

      gap: 14px;

      margin: 0;
    }


    .details-grid div {
      padding: 12px;

      background:
        var(--wz-surface-soft);

      border-radius: 10px;
    }


    .details-grid .wide {
      grid-column:
        1 / -1;
    }


    dt {
      color:
        var(--wz-text-secondary);

      font-size: .8rem;

      font-weight: 750;
    }


    dd {
      margin: 4px 0 0;

      color:
        var(--wz-text-primary);

      line-height: 1.45;
    }


    .status-chip {
      font-weight: 750;

      min-width: 96px;

      justify-content:
        center;
    }


    .status-pending {
      background:
        #fff1d8 !important;

      color:
        #a85d00 !important;
    }


    .status-accepted {
      background:
        #dff5e7 !important;

      color:
        #14783a !important;
    }


    .status-in-progress {
      background:
        #e5edff !important;

      color:
        #315ea8 !important;
    }


    .status-rescheduled {
      background:
        #fff1d8 !important;

      color:
        #a85d00 !important;
    }


    .status-rejected {
      background:
        #ffe3e3 !important;

      color:
        #b42323 !important;
    }


    .status-completed {
      background:
        #dceeff !important;

      color:
        #1766a6 !important;
    }


    @media (max-width: 720px) {

      .details-grid {
        grid-template-columns: 1fr;
      }

    }

  `],


  template: `

    <h2 mat-dialog-title>
      Pickup Request Details
    </h2>


    <mat-dialog-content
      class="details-content"
    >

      <div class="details-header">

        <div>

          <p class="details-kicker">
            {{ data.id }}
          </p>

          <h3>
            {{ data.volunteerName }}
          </h3>

        </div>


        <mat-chip
          [class]="statusClass(data.status)"
        >
          {{ data.status }}
        </mat-chip>

      </div>


      <dl class="details-grid">


        <div>

          <dt>
            Volunteer Contact
          </dt>

          <dd>
            {{ data.volunteerPhone || 'Not available' }}
          </dd>

        </div>


        <div>

          <dt>
            Waste Type
          </dt>

          <dd>
            {{ data.wasteType }}
          </dd>

        </div>


        <div>

          <dt>
            Preferred Date
          </dt>

          <dd>
            {{ data.pickupDate | date:'mediumDate' }}
          </dd>

        </div>


        <div>

          <dt>
            Preferred Time
          </dt>

          <dd>
            {{ data.pickupTime }}
          </dd>

        </div>


        <div>

          <dt>
            Area / Location
          </dt>

          <dd>
            {{ data.pickupArea }}
          </dd>

        </div>


        <div>

          <dt>
            Current Status
          </dt>

          <dd>
            {{ data.status }}
          </dd>

        </div>


        <div>

          <dt>
            Created Date
          </dt>

          <dd>
            {{ data.createdAt | date:'medium' }}
          </dd>

        </div>


        <div class="wide">

          <dt>
            Pickup Address
          </dt>

          <dd>
            {{ data.pickupAddress }}
          </dd>

        </div>


        <div class="wide">

          <dt>
            Additional Notes
          </dt>

          <dd>
            {{ data.notes || 'No additional notes.' }}
          </dd>

        </div>


      </dl>


    </mat-dialog-content>


    <mat-dialog-actions align="end">

      <button
        mat-flat-button
        mat-dialog-close
      >
        Close
      </button>

    </mat-dialog-actions>

  `
})


export class NgoPickupDetailsDialog {


  constructor(

    @Inject(MAT_DIALOG_DATA)

    public data: NgoPickupRequest

  ) {}


  statusClass(
    status: NgoPickupStatus
  ): string {

    return `status-chip status-${status
      .toLowerCase()
      .replace(/\s+/g, '-')}`;
  }

}