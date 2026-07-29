import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { NotificationBellComponent } from '../../pages/notifications/notification-bell/notification-bell';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, NotificationBellComponent],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar {

  private readonly authService = inject(AuthService);
  readonly user$ = this.authService.currentUser$;

  isDropdownOpen = false;

  constructor(private router: Router) {}

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
