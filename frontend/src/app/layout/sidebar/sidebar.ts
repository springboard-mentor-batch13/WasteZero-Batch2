import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import { AuthService } from '../../auth/auth.service';

interface SidebarMenuItem {
  label: string;
  icon: string;
  route?: string;
  exact?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly user$ = this.authService.currentUser$;
  isDarkMode = false;

  readonly settingsMenu: SidebarMenuItem[] = [
    { label: 'My Profile', icon: 'bi-person', route: '/my-profile' },
    { label: 'Settings', icon: 'bi-gear' },
    { label: 'Help & Support', icon: 'bi-question-circle' },
  ];

  ngOnInit(): void {
    if (typeof localStorage === 'undefined') return;

    this.isDarkMode = localStorage.getItem('theme') === 'dark';
    document.body.classList.toggle('dark-theme', this.isDarkMode);
  }

  getMainMenu(role?: string): SidebarMenuItem[] {
    const dashboard: SidebarMenuItem = {
      label: 'Dashboard',
      icon: 'bi-grid',
      route: '/dashboard',
      exact: true,
    };

    const menusByRole: Record<string, SidebarMenuItem[]> = {
      Volunteer: [
        dashboard,
        { label: 'Schedule Pickup', icon: 'bi-calendar-check' },
        { label: 'Opportunities', icon: 'bi-recycle', route: '/opportunities' },
        { label: 'Messages', icon: 'bi-chat-left-text', route: '/messages' },
        { label: 'My Impact', icon: 'bi-bar-chart' },
      ],
      NGO: [
        dashboard,
        { label: 'Opportunities', icon: 'bi-recycle', route: '/opportunities' },
        { label: 'Applications', icon: 'bi-file-earmark-text' },
        { label: 'Messages', icon: 'bi-chat-left-text', route: '/messages' },
        { label: 'Reports / Analytics', icon: 'bi-bar-chart' },
      ],
      Admin: [
        dashboard,
        { label: 'Users', icon: 'bi-people' },
        { label: 'Opportunities', icon: 'bi-recycle', route: '/opportunities' },
        { label: 'Applications', icon: 'bi-file-earmark-text', route: '/admin/applications' },
        { label: 'Reports / Analytics', icon: 'bi-bar-chart' },
       { label: 'Messages', icon: 'bi-chat-left-text', route: '/messages' },
        { label: 'Admin Panel', icon: 'bi-shield-lock' },
      ],
    };

    return role ? menusByRole[role] ?? [dashboard] : [dashboard];
  }

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    document.body.classList.toggle('dark-theme', this.isDarkMode);

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
