import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

/** Tempel token ke setiap request API, dan logout otomatis kalau token ditolak (401). */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  // hanya ke API kita sendiri (jangan kirim token ke Google atau domain lain)
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const isAuthEndpoint = req.url.startsWith(`${environment.apiUrl}/auth/`) && !req.url.endsWith('/auth/me');
  const token = auth.token;
  const request = token && !isAuthEndpoint ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(request).pipe(
    catchError((err: unknown) => {
      // token kedaluwarsa / tidak valid → bersihkan sesi dan kembali ke login
      if (err instanceof HttpErrorResponse && err.status === 401 && !isAuthEndpoint) {
        auth.logout();
      }
      return throwError(() => err);
    }),
  );
};