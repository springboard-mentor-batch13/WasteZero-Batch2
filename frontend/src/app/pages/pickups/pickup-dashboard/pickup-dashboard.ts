import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { PickupService, Pickup } from '../pickup.service';

@Component({
  selector: 'app-pickup-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './pickup-dashboard.html',
  styleUrl: './pickup-dashboard.css'
})
export class PickupDashboard implements OnInit {

  private readonly pickupService = inject(PickupService);
  private readonly cdr = inject(ChangeDetectorRef);

  pickups: Pickup[] = [];
  loading = false;

  ngOnInit(): void {
    this.loadPickups();
  }

  loadPickups(): void {

    this.loading = true;

    this.pickupService.getMyPickups().subscribe({

      next: (response) => {

        this.pickups = response.data;
        this.loading = false;

        this.cdr.detectChanges();

      },

      error: (error) => {

        console.error(error);

        this.loading = false;

        this.cdr.detectChanges();

      }

    });

  }

}