import {inject} from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';
import {AuthService} from './auth.service';

const AUTH_SKIPPED_KEY = 'Greed.authSkipped';

export const authGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user has skipped auth
  const hasSkippedAuth = localStorage.getItem(AUTH_SKIPPED_KEY) === 'true';
  if (hasSkippedAuth) {
    return true;
  }

  // Wait for Firebase auth to initialize
  while (authService.loading()) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  // Check if authenticated
  if (authService.isAuthenticated()) {
    return true;
  }

  // Not authenticated, redirect to login
  return router.createUrlTree(['/login']);
};
