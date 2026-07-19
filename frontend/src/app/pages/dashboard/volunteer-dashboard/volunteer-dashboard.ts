import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-volunteer-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './volunteer-dashboard.html',
  styleUrl: './volunteer-dashboard.css'
})
export class VolunteerDashboard {

  @Input() userName = '';

}