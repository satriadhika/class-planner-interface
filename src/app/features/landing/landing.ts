import { Component, DestroyRef, HostListener, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { BRANDING } from '../../core/config/branding';
import { I18n } from '../../core/i18n/i18n';
import { BrandMark } from '../../shared/brand-mark/brand-mark';
import { Icon, IconName } from '../../shared/icon/icon';
import { LangSwitch } from '../../shared/lang-switch/lang-switch';
import { LANDING_TEXT } from './landing.i18n';

/** Bagian yang tidak ikut diterjemahkan: tujuan tautan, foto, ikon, warna. */
const SLIDE_META = [
  { anchor: 'jadwal', image: BRANDING.heroImages[0] ?? null },
  { anchor: 'rumpun', image: BRANDING.heroImages[1] ?? null },
  { anchor: 'faq', image: BRANDING.heroImages[2] ?? null },
];
const GROUP_META: { icon: IconName; tone: string; ink: string }[] = [
  { icon: 'award', tone: '#e3f4ec', ink: '#1d7f58' },
  { icon: 'layers', tone: '#e8effd', ink: '#2563eb' },
  { icon: 'users', tone: '#fdf1e3', ink: '#b05f0b' },
  { icon: 'database', tone: '#f1eefb', ink: '#6d4fc2' },
];

/**
 * Halaman depan publik, dua bahasa (Indonesia & Inggris). Susunan: navigasi dengan logo di tengah, slider,
 * sambutan, kartu rumpun jurusan, tahapan, angka, tanya jawab, ajakan, footer.
 * Popup login dirender di <router-outlet /> (route anak /login).
 */
@Component({
  selector: 'app-landing',
  imports: [RouterLink, RouterOutlet, BrandMark, Icon, LangSwitch],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
})
export class Landing {
  private readonly auth = inject(AuthService);
  private readonly i18n = inject(I18n);

  readonly branding = BRANDING;
  readonly user = this.auth.user;
  readonly dashboardPath = computed(() => this.auth.homePath());
  readonly year = new Date().getFullYear();

  /** Teks sesuai bahasa yang dipilih. */
  readonly t = computed(() => LANDING_TEXT[this.i18n.lang()]);
  readonly welcomeTitle = computed(() => this.t().welcome.title.replace('{school}', BRANDING.schoolName));

  readonly slides = computed(() => this.t().hero.slides.map((s, i) => ({ ...s, ...SLIDE_META[i] })));
  readonly groups = computed(() => this.t().rumpun.groups.map((g, i) => ({ ...g, ...GROUP_META[i] })));

  readonly menuOpen = signal(false);
  readonly scrolled = signal(false);

  // ------------------------------------------------------------ slider
  readonly current = signal(0);
  readonly paused = signal(false);
  readonly failedImages = signal(new Set<number>());

  /** Denah meja kecil (hero tanpa foto & kartu tahapan). */
  readonly seatRows = [0, 1, 2, 3];
  readonly seatCols = [0, 1, 2, 3, 4, 5];

  constructor() {
    const reduceMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!reduceMotion) {
      const timer = setInterval(() => {
        if (!this.paused()) this.go(1);
      }, 6500);
      inject(DestroyRef).onDestroy(() => clearInterval(timer));
    }
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 40);
  }

  go(step: number): void {
    const n = SLIDE_META.length;
    this.current.update((i) => (i + step + n) % n);
  }

  imageFailed(index: number): void {
    this.failedImages.update((s) => new Set(s).add(index));
  }

  /** Scroll halus ke section tanpa mengubah route. */
  scrollTo(event: Event, sectionId: string): void {
    event.preventDefault();
    this.menuOpen.set(false);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
