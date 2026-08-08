import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { PickupIssueDialogComponent } from './pickup-issue-dialog/pickup-issue-dialog';
import { PickupService, Pickup } from '../pickup.service';
import { PickupDetailDialogComponent } from './pickup-detail-dialog/pickup-detail-dialog';
import { PickupActionDialogComponent } from './pickup-action-dialog/pickup-action-dialog';
import { ProofUploadDialogComponent } from './proof-upload-dialog/proof-upload-dialog';

@Component({
  selector: 'app-pickup-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatMenuModule,
    MatDividerModule,
    PickupActionDialogComponent,
    PickupDetailDialogComponent,
    ProofUploadDialogComponent,
    PickupIssueDialogComponent
  ],
  templateUrl: './pickup-dashboard.html',
  styleUrl: './pickup-dashboard.css'
})
export class PickupDashboard implements OnInit {

  private readonly pickupService = inject(PickupService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  pickups: Pickup[] = [];
  loading = false;

  totalPickups = 0;
pendingPickups = 0;
acceptedPickups = 0;
inProgressPickups = 0;
rescheduledPickups = 0;
completedPickups = 0;


  ngOnInit(): void {
    this.loadPickups();
  }

  viewDetails(pickup: Pickup): void {

    this.dialog.open(PickupDetailDialogComponent, {

      width: '900px',

      maxWidth: '95vw',

      autoFocus: false,

      restoreFocus: false,

      disableClose: false,

      data: pickup

    });

  }

  openPickupAction(pickup: Pickup): void {

    const dialogRef = this.dialog.open(

      PickupActionDialogComponent,

      {

        width: '650px',

        maxWidth: '95vw',

        data: pickup

      }

    );

    dialogRef.afterClosed().subscribe(result => {

      if (!result) {

        return;

      }

      // Submit Pickup Proof
      if (result === 'proof') {

        const proofDialog = this.dialog.open(

          ProofUploadDialogComponent,

          {

            width: '700px',

            maxWidth: '95vw',

            data: pickup

          }

        );

        proofDialog.afterClosed().subscribe(success => {

          if (success) {

            this.loadPickups();

          }

        });

        return;

      }

      // Unable To Complete Pickup
      if (result === 'unable') {

  const issueDialog = this.dialog.open(

    PickupIssueDialogComponent,

    {

      width: '650px',

      maxWidth: '95vw',

      data: pickup

    }

  );

  issueDialog.afterClosed().subscribe(result => {

  if (!result) {

    return;

  }

  this.pickupService.reportPickupIssue(

    pickup._id,

    result

  ).subscribe({

    next: () => {

      this.snackBar.open(

        'Pickup rescheduled successfully.',

        'Close',

        {

          duration: 3000

        }

      );

      this.loadPickups();

    },

    error: (error: any) => {

      console.error(error);

      this.snackBar.open(

        'Unable to reschedule pickup.',

        'Close',

        {

          duration: 3000

        }

      );

    }

  });

});

 

}

           

    });

  }

  loadPickups(): void {

    this.loading = true;

    this.pickupService.getMyPickups().subscribe({

      next: (response) => {

        console.log('Pickup Data:', response.data);

        this.pickups = response.data || [];

        this.totalPickups = this.pickups.length;

        this.pendingPickups = this.pickups.filter(
          pickup => pickup.status === 'Pending'
        ).length;

        this.acceptedPickups = this.pickups.filter(
          pickup => pickup.status === 'Accepted'
        ).length;

        this.inProgressPickups = this.pickups.filter(
  pickup => pickup.status === 'In Progress'
).length;

this.rescheduledPickups = this.pickups.filter(
  pickup => pickup.status === 'Rescheduled'
).length;

this.completedPickups = this.pickups.filter(
  pickup => pickup.status === 'Completed'
).length;

        this.loading = false;

        this.cdr.detectChanges();

      },

      error: (error) => {

        console.error(error);

        this.pickups = [];

        this.totalPickups = 0;
this.pendingPickups = 0;
this.acceptedPickups = 0;
this.inProgressPickups = 0;
this.rescheduledPickups = 0;
this.completedPickups = 0;


        this.loading = false;

        this.snackBar.open(
          'Unable to load pickup requests.',
          'Close',
          {
            duration: 3000
          }
        );

        this.cdr.detectChanges();

      }

    });

  }
    canStartPickup(pickup: Pickup): boolean {

    if (
  pickup.status !== 'Accepted' &&
  pickup.status !== 'Rescheduled'
) {
  return false;
}

    const today = new Date();

    const pickupDate = new Date(pickup.pickupDate);

    today.setHours(0, 0, 0, 0);

    pickupDate.setHours(0, 0, 0, 0);

    return today.getTime() === pickupDate.getTime();

  }

  startPickup(id: string): void {

    const pickup = this.pickups.find(

      pickup => pickup._id === id

    );

    if (!pickup || !this.canStartPickup(pickup)) {

      this.snackBar.open(

        'Pickup can only be started on the scheduled pickup date.',

        'Close',

        {

          duration: 4000

        }

      );

      return;

    }

    this.pickupService.startPickup(id).subscribe({

      next: () => {

        this.snackBar.open(

          'Pickup started successfully.',

          'Close',

          {

            duration: 3000

          }

        );

        this.loadPickups();

      },

      error: (error) => {

        console.error(error);

        this.snackBar.open(

          'Unable to start pickup.',

          'Close',

          {

            duration: 3000

          }

        );

      }

    });

  }

  completePickup(id: string): void {

    this.pickupService.completePickup(id).subscribe({

      next: () => {

        this.snackBar.open(

          'Pickup marked as completed.',

          'Close',

          {

            duration: 3000

          }

        );

        this.loadPickups();

      },

      error: (error) => {

        console.error(error);

        this.snackBar.open(

          'Unable to complete pickup.',

          'Close',

          {

            duration: 3000

          }

        );

      }

    });

  }

  withdrawPickup(id: string): void {

    this.pickupService.withdrawPickup(id).subscribe({

      next: () => {

        this.snackBar.open(

          'Pickup request withdrawn.',

          'Close',

          {

            duration: 3000

          }

        );

        this.loadPickups();

      },

      error: (error) => {

        console.error(error);

        this.snackBar.open(

          'Unable to withdraw pickup.',

          'Close',

          {

            duration: 3000

          }

        );

      }

    });

  }

  deletePickup(id: string): void {

    this.pickupService.deletePickup(id).subscribe({

      next: () => {

        this.snackBar.open(

          'Pickup request deleted.',

          'Close',

          {

            duration: 3000

          }

        );

        this.loadPickups();

      },

      error: (error) => {

        console.error(error);

        this.snackBar.open(

          'Unable to delete pickup.',

          'Close',

          {

            duration: 3000

          }

        );

      }

    });

  }
    getStatusClass(status: string): string {

    switch (status?.toLowerCase()) {

      case 'accepted':
        return 'accepted';

      case 'assigned':
        return 'assigned';

      case 'in progress':
        return 'progress';

      case 'completed':
  return 'completed';

case 'rescheduled':
  return 'rescheduled';

case 'rejected':
  return 'rejected';

      case 'pending':
        return 'pending';

      default:
        return 'pending';

    }

  }

  getWasteIcon(type: string): string {

    switch (type?.toLowerCase()) {

      case 'plastic':
        return 'local_drink';

      case 'paper':
        return 'description';

      case 'glass':
        return 'wine_bar';

      case 'organic':
      case 'wet waste':
        return 'eco';

      case 'metal':
        return 'construction';

      case 'e-waste':
        return 'devices';

      default:
        return 'recycling';

    }

  }

}