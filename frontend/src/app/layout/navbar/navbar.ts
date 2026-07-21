import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar implements OnInit {

  private readonly authService = inject(AuthService);

  isDropdownOpen = false;

  fullName = 'User';
  username = 'U';

  constructor(private router: Router) {}

  ngOnInit(): void {
    const user = this.authService.getUser();

    if (user) {
      this.fullName = user.fullName || 'User';
      this.username = user.username || 'U';
    }
  }

  get avatar(): string {
    return this.username.charAt(0).toUpperCase();
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}