import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar implements OnInit {

  user: any = null;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
  this.user = this.authService.getUser();
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

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

