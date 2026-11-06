import { Component, inject } from '@angular/core';

import { AuthService } from '../../../core/auth/auth.service';
import { GoogleIdentityService } from '../../../core/auth/google-identity';

/** Halaman sementara setelah login, untuk mengetes alur login per role. */
@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private readonly auth = inject(AuthService);
  private readonly google = inject(GoogleIdentityService);

  readonly user = this.auth.user;

  logout(): void {
    this.google.disableAutoSelect();
    this.auth.logout();
  }
}
