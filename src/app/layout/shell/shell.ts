import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { GoogleIdentityService } from '../../core/auth/google-identity.service';
import { BRANDING } from '../../core/config/branding';
import { MuridProgressService, StageKey, StageStatus } from '../../features/murid/murid-progress.service';
import { BrandMark } from '../../shared/brand-mark/brand-mark';
import { Icon } from '../../shared/icon/icon';
import { NAV, ROLE_LABEL, ROLE_SUBTITLE } from '../nav-config';

/** Kerangka halaman setelah login: sidebar + header + konten. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, BrandMark, Icon],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  private readonly auth = inject(AuthService);
  private readonly google = inject(GoogleIdentityService);
  private readonly progress = inject(MuridProgressService);

  readonly branding = BRANDING;
  readonly user = this.auth.user;

  readonly nav = computed(() => {
    const role = this.auth.role();
    return role ? NAV[role] : [];
  });
  readonly roleLabel = computed(() => {
    const role = this.auth.role();
    return role ? ROLE_LABEL[role] : '';
  });
  readonly subtitle = computed(() => {
    const role = this.auth.role();
    return role ? ROLE_SUBTITLE[role] : '';
  });
  readonly firstName = computed(() => (this.user()?.displayName ?? '').trim().split(/\s+/)[0] ?? '');
  readonly initials = computed(() =>
    (this.user()?.displayName ?? '')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join(''),
  );

  /** Sidebar di layar kecil (laci). */
  readonly sidebarOpen = signal(false);
  /** Menu akun di kanan atas. */
  readonly accountMenuOpen = signal(false);

  constructor() {
    // Status tahap di sidebar diambil dari backend (GET /me/progress)
    if (this.auth.role() === 'MURID') {
      this.progress.load().subscribe();
    }

    // Tutup laci & menu akun setiap pindah halaman
    inject(Router)
      .events.pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.sidebarOpen.set(false);
        this.accountMenuOpen.set(false);
      });
  }

  stageStatus(stage: StageKey | undefined): StageStatus | null {
    return stage && this.auth.role() === 'MURID' ? this.progress.statusOf(stage) : null;
  }

  toggleAccountMenu(event: Event): void {
    event.stopPropagation();
    this.accountMenuOpen.update((open) => !open);
  }

  /** Klik di mana pun di luar menu akun → tutup. */
  @HostListener('document:click')
  closeAccountMenu(): void {
    this.accountMenuOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  closeAll(): void {
    this.sidebarOpen.set(false);
    this.accountMenuOpen.set(false);
  }

  logout(): void {
    this.google.disableAutoSelect();
    this.progress.reset();
    this.auth.logout();
  }
}
