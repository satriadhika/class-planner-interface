import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import { I18n } from '../../../core/i18n/i18n';
import { Hero } from '../../../shared/hero/hero';
import { Icon } from '../../../shared/icon/icon';
import { Activity, MuridProgressService } from '../murid-progress.service';
import { MURID_HOME_TEXT } from './beranda.i18n';

/** Beranda murid (dua bahasa): sapaan, progres & langkah berikutnya, jadwal, tahap, aktivitas, menu cepat. */
@Component({
  selector: 'app-murid-beranda',
  imports: [RouterLink, Icon, Hero],
  templateUrl: './beranda.html',
  styleUrl: './beranda.scss',
})
export class MuridBeranda {
  private readonly progress = inject(MuridProgressService);

  private readonly i18n = inject(I18n);
  /** Teks sesuai bahasa yang dipilih. */
  readonly t = computed(() => MURID_HOME_TEXT[this.i18n.lang()]);

  /** Status & tanggal tahap dari backend, teksnya dari kamus. */
  readonly stages = computed(() => this.progress.stages().map((s) => ({ ...s, ...this.t().stages[s.key] })));
  readonly current = computed(() => this.stages().find((s) => s.status === 'current') ?? null);
  readonly cycle = this.progress.cycle;
  readonly percent = this.progress.percent;
  readonly doneCount = this.progress.doneCount;
  readonly loading = this.progress.loading;
  readonly loaded = this.progress.loaded;
  readonly noCycle = this.progress.noCycle;
  readonly error = this.progress.error;

  readonly activities = signal<Activity[]>([]);

  private readonly auth = inject(AuthService);
  readonly fullName = computed(() => this.auth.user()?.displayName ?? '');


  /** Tanggal + jam sesuai bahasa. */
  dateTime(iso: string | null | undefined): string | null {
    return this.i18n.dateTime(iso);
  }

  constructor() {
    // selalu ambil data terbaru saat beranda dibuka
    this.progress.load().subscribe(() => {
      if (this.cycle()) {
        this.progress.activity().subscribe({
          next: (list) => this.activities.set(list.slice(0, 6)),
          error: () => this.activities.set([]),
        });
      }
    });
  }

  /** "3 hari lagi" / "Hari ini" / "Sudah lewat" (atau versi Inggrisnya) untuk tenggat. */
  daysLeft(iso: string | null | undefined): { text: string; soon: boolean } | null {
    if (!iso) return null;
    const ms = new Date(iso).getTime() - Date.now();
    if (ms < 0) return { text: this.t().overdue, soon: false };
    const days = Math.floor(ms / 86_400_000);
    if (days === 0) return { text: this.t().today, soon: true };
    return { text: this.t().daysLeft.replace('{n}', String(days)), soon: days <= 3 };
  }

  reload(): void {
    this.progress.load().subscribe();
  }
}

