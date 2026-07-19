import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar {
  private readonly authService = inject(AuthService);

  constructor(private router: Router) {}

  logout(): void {
    this.authService.clearSession();
    this.router.navigate(['/login']);
  }

}
