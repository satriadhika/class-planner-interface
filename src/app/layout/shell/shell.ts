import { Component, DestroyRef, HostListener, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { GoogleIdentityService } from '../../core/auth/google-identity.service';
import { BRANDING } from '../../core/config/branding';
import { I18n } from '../../core/i18n/i18n';
import { MuridProgressService, StageKey, StageStatus } from '../../features/murid/murid-progress.service';
import { CycleStore } from '../../features/waka/cycle-store';
import { BrandMark } from '../../shared/brand-mark/brand-mark';
import { Icon } from '../../shared/icon/icon';
import { LangSwitch } from '../../shared/lang-switch/lang-switch';
import { NAV, ROLE_LABEL } from '../nav-config';
import { SHELL_TEXT } from './shell.i18n';

/** Kerangka halaman setelah login: bar atas, sidebar biru dengan kartu role, konten. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, BrandMark, Icon, LangSwitch],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  private readonly auth = inject(AuthService);
  private readonly google = inject(GoogleIdentityService);
  private readonly progress = inject(MuridProgressService);
  private readonly cycleStore = inject(CycleStore);
  private readonly i18n = inject(I18n);

  readonly lang = this.i18n.lang;
  readonly t = computed(() => SHELL_TEXT[this.lang()]);

  readonly branding = BRANDING;
  readonly user = this.auth.user;

  /** Menu sidebar sesuai role; menu waka yang dimatikan super admin disembunyikan. */
  readonly nav = computed(() => {
    const role = this.auth.role();
    if (!role) return [];
    const disabled = role === 'WAKA' ? (this.user()?.disabledMenus ?? []) : [];
    const counselor = !!this.user()?.counselor;
    return NAV[role]
      .map((g) => ({
        ...g,
        items: g.items.filter((i) => (!i.menu || !disabled.includes(i.menu)) && (!i.counselorOnly || counselor)),
      }))
      .filter((g) => g.items.length > 0);
  });
  readonly roleLabel = computed(() => {
    const role = this.auth.role();
    return role ? ROLE_LABEL[this.lang()][role] : '';
  });
  readonly menuTitle = computed(() => {
    const title = this.t().menuOf.replace('{role}', this.roleLabel());
    return title.charAt(0).toUpperCase() + title.slice(1);
  });
  readonly home = computed(() => this.auth.homePath());
  /** Waka & super admin bisa memakai password (murid & guru hanya Google). */
  readonly canChangePassword = computed(() => ['WAKA', 'SUPER_ADMIN'].includes(this.auth.role() ?? ''));
  /** Nama di pojok kiri atas: nama sekolah dari akun, cadangannya dari branding. */
  readonly schoolName = computed(() =>
    this.auth.role() === 'SUPER_ADMIN' ? this.branding.appName : (this.user()?.school?.name ?? this.branding.schoolName),
  );
  /** Nama siklus di kartu role: murid dari progres, waka dari siklus yang dipilih. */
  readonly cycleName = computed(() => {
    const role = this.auth.role();
    if (role === 'MURID') return this.progress.cycle()?.name ?? null;
    if (role === 'WAKA') return this.cycleStore.detail()?.cycle.name ?? null;
    return null;
  });

  /** Tanggal hari ini di bar atas: ikut bahasa, diperbarui tiap menit. */
  private readonly tick = signal(Date.now());
  readonly today = computed(() => {
    this.tick();
    return new Intl.DateTimeFormat(this.i18n.locale(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
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
  /** Sidebar disembunyikan di layar lebar. */
  readonly collapsed = signal(false);
  /** Menu akun di kanan atas. */
  readonly accountMenuOpen = signal(false);

  constructor() {
    const timer = setInterval(() => this.tick.set(Date.now()), 60_000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));

    // Status tahap di sidebar diambil dari backend (GET /me/progress)
    if (this.auth.role() === 'MURID') {
      this.progress.load().subscribe();
    }
    // Menu waka (super admin) & status guru BK (waka) bisa berubah kapan saja → ambil data akun terbaru saat masuk
    if (this.auth.role() === 'WAKA' || this.auth.role() === 'GURU') {
      this.auth.refreshUser().subscribe({ error: () => undefined });
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

  /** HP: buka/tutup laci. Layar lebar: tampil/sembunyikan sidebar. */
  toggleNav(): void {
    if (window.matchMedia('(max-width: 980px)').matches) {
      this.sidebarOpen.update((open) => !open);
    } else {
      this.collapsed.update((c) => !c);
    }
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
