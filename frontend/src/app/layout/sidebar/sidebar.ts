import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar implements OnInit {

  user: any = null;

  isDarkMode = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {

    this.user = this.authService.getUser();

    const savedTheme = localStorage.getItem('theme');

    if (savedTheme === 'dark') {
      this.isDarkMode = true;
      document.body.classList.add('dark-theme');
    }

    console.log(this.user);
  }

  get isAdmin(): boolean {
    return this.user?.role === 'Admin';
  }

  get isNGO(): boolean {
    return this.user?.role === 'NGO';
  }

  get isVolunteer(): boolean {
    return this.user?.role === 'Volunteer';
  }

  toggleDarkMode(): void {

    this.isDarkMode = !this.isDarkMode;

    if (this.isDarkMode) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }

  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

