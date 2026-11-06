import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { BRANDING } from '../../core/config/branding';
import { BrandMark } from '../../shared/brand-mark/brand-mark';

/**
 * Halaman depan publik. Popup login dirender di <router-outlet /> di dalam halaman ini
 * (route anak /login), jadi halaman depan tetap terlihat di belakang popup.
 */
@Component({
  selector: 'app-landing',
  imports: [RouterLink, RouterOutlet, BrandMark],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
})
export class Landing {
  private readonly auth = inject(AuthService);

  readonly branding = BRANDING;
  readonly user = this.auth.user;
  readonly dashboardPath = computed(() => this.auth.homePath());
  readonly year = new Date().getFullYear();

  /** Scroll halus ke section tanpa mengubah route. */
  scrollTo(event: Event, sectionId: string): void {
    event.preventDefault();
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
