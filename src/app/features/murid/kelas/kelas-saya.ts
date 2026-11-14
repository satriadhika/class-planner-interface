import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { problemCode, problemMessage } from '../../../core/api/problem';
import { I18n } from '../../../core/i18n/i18n';
import { SOURCE_TEXT, TIER_TEXT, fmtDateTime } from '../../../shared/labels/labels';
import { FinalClass, MuridApi } from '../murid-api';
import { KELAS_SAYA_TEXT } from './kelas-saya.i18n';

/** Kelas final murid setelah disetujui waka. */
@Component({
  selector: 'app-kelas-saya',
  imports: [DecimalPipe, RouterLink],
  template: `
    <div class="cp-page">
      <header class="cp-head">
        <div>
          <h1>{{ t().title }}</h1>
          <p>{{ t().intro }}</p>
        </div>
      </header>

      @if (error(); as e) { <div class="cp-alert cp-alert--error">{{ e }}</div> }

      @if (pending()) {
        <div class="cp-empty">
          {{ t().pending }}
          <a routerLink="/murid">{{ t().backHome }}</a>
        </div>
      }

      @if (data(); as d) {
        <section class="cp-card hero">
          <div class="cp-small cp-muted">{{ d.cycleName }} · {{ t().academicYear }} {{ d.targetAcademicYear }}</div>
          <h2>{{ t().classPrefix }} {{ d.classLabel }}</h2>
          <div class="cp-chips">@for (s of d.subjects; track s) { <span class="cp-chip">{{ s }}</span> }</div>
          <div class="cp-stats facts">
            <div class="cp-stat"><strong>{{ d.matchPercent | number: '1.0-1' }}%</strong><span>{{ t().match }}</span></div>
            <div class="cp-stat"><strong>{{ t().tierPrefix }}{{ d.tier }}</strong><span>{{ tierLabel()[d.tier] }}</span></div>
            <div class="cp-stat"><strong>{{ d.classSize }}</strong><span>{{ t().classSize }}</span></div>
          </div>
          <p class="cp-small cp-muted">{{ sourceText(d.source) }} {{ t().approved.replace('{date}', fmt(d.finalizedAt)) }}</p>
          <a class="cp-btn cp-btn--primary" routerLink="/murid/surat">{{ t().viewLetter }}</a>
        </section>
      }
    </div>
  `,
  styles: `
    .hero { display: flex; flex-direction: column; gap: 12px; align-items: flex-start; }
    .hero h2 { margin: 0; font-size: 2rem; }
    .facts { width: 100%; }
  `,
})
export class KelasSaya {
  private readonly api = inject(MuridApi);

  private readonly i18n = inject(I18n);
  /** Teks sesuai bahasa aktif. */
  readonly t = computed(() => KELAS_SAYA_TEXT[this.i18n.lang()]);
  readonly tierLabel = computed(() => TIER_TEXT[this.i18n.lang()]);
  readonly data = signal<FinalClass | null>(null);
  readonly pending = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    this.api.finalClass().subscribe({
      next: (d) => this.data.set(d),
      error: (e: unknown) => {
        if (problemCode(e) === 'NOT_FINALIZED') this.pending.set(true);
        else this.error.set(problemMessage(e));
      },
    });
  }

  sourceText(source: string): string {
    return this.t().source[source] ?? SOURCE_TEXT[this.i18n.lang()][source] ?? '';
  }

  fmt(iso: string | null): string {
    return fmtDateTime(iso);
  }
}
