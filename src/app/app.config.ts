import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { TitleStrategy, provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth.interceptor';
import { I18nTitleStrategy } from './core/i18n/title-strategy';

// Kalau app.config.ts bawaan lu punya provider lain (misal terkait zone / change detection),
// tambahkan kembali di daftar ini.
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: TitleStrategy, useExisting: I18nTitleStrategy },
  ],
};
