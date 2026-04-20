import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, UserRole } from '../services/auth.service';

export function roleGuard(allowedRoles: UserRole[]): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const role = authService.getRole();

    // ❌ pas connecté
    if (!role) {
      return router.createUrlTree(['/login']);
    }

    // ❌ mauvais rôle
    if (!allowedRoles.includes(role)) {
      return router.createUrlTree(['/dashboard']);
    }

    // ✅ autorisé
    return true;
  };
}