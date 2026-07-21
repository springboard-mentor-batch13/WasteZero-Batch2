import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../../auth/auth.service';

export const opportunityManagerGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.canManageOpportunities() || router.createUrlTree(['/opportunities']);
};
