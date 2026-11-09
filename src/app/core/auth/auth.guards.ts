import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { Role } from './auth.models';
import { AuthService } from './auth.service';

/** Halaman hanya untuk user yang sudah login. Simpan URL tujuan supaya bisa kembali setelah login. */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  return auth.hasValidSession()
    ? true
    : inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

/** Halaman login: kalau sudah login, langsung ke halaman awal sesuai role. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.hasValidSession() ? inject(Router).createUrlTree([auth.homePath()]) : true;
};

/** Halaman khusus role tertentu. Role lain diarahkan ke halaman awalnya sendiri. */
export const roleGuard =
  (...roles: Role[]): CanActivateFn =>
  () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const role = auth.role();
    if (!role || !auth.hasValidSession()) {
      return router.createUrlTree(['/login']);
    }
    return roles.includes(role) ? true : router.createUrlTree([auth.homePath(role)]);
  };

/** Route kosong ('/') diarahkan ke halaman awal sesuai role. */
export const homeRedirectGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return inject(Router).createUrlTree([auth.homePath()]);
};
