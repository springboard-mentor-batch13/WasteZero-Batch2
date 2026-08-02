import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

import { Navbar } from './layout/navbar/navbar';
import { Sidebar } from './layout/sidebar/sidebar';
import { NotificationService } from './pages/notifications/notification.service';
import { NotificationToastService } from './pages/notifications/notification-toast.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    Navbar,
    Sidebar
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly notificationService = inject(NotificationService);
  private readonly notificationToastService = inject(NotificationToastService);

  constructor(public router: Router) {
    void this.notificationService;
    void this.notificationToastService;
  }

  get isAuthPage(): boolean {
    return [
      '/login',
      '/register',
      '/otp-verification',
      '/forgot-password',
      '/verify-reset-otp',
      '/reset-password'
    ].includes(this.router.url);
  }

}
