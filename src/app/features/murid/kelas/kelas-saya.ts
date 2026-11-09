import { DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { problemCode, problemMessage } from '../../../core/api/problem';
import { SOURCE_LABEL, TIER_LABEL, fmtDateTime } from '../../../shared/labels/labels';
import { FinalClass, MuridApi } from '../murid-api';

/** Kelas final murid setelah disetujui waka. */
@Component({
  selector: 'app-kelas-saya',
  imports: [DecimalPipe, RouterLink],
  template: `
    <div class="cp-page">
      <header class="cp-head">
        <div>
          <h1>Kelas saya</h1>
          <p>Kelas 11 yang sudah ditetapkan dan disetujui waka kurikulum.</p>
        </div>
      </header>

      @if (error(); as e) { <div class="cp-alert cp-alert--error">{{ e }}</div> }

      @if (pending()) {
        <div class="cp-empty">
          Kelas final belum disetujui. Setelah pemilihan kelas ditutup, waka kurikulum meratakan jumlah murid per kelas lalu menyetujui hasilnya.
          <a routerLink="/murid">Kembali ke beranda</a>
        </div>
      }

      @if (data(); as d) {
        <section class="cp-card hero">
          <div class="cp-small cp-muted">{{ d.cycleName }} · Tahun ajaran {{ d.targetAcademicYear }}</div>
          <h2>Kelas {{ d.classLabel }}</h2>
          <div class="cp-chips">@for (s of d.subjects; track s) { <span class="cp-chip">{{ s }}</span> }</div>
          <div class="cp-stats facts">
            <div class="cp-stat"><strong>{{ d.matchPercent | number: '1.0-1' }}%</strong><span>kecocokan</span></div>
            <div class="cp-stat"><strong>P{{ d.tier }}</strong><span>{{ tierLabel[d.tier] }}</span></div>
            <div class="cp-stat"><strong>{{ d.classSize }}</strong><span>murid di kelas ini</span></div>
          </div>
          <p class="cp-small cp-muted">{{ sourceText(d.source) }} Disetujui {{ fmt(d.finalizedAt) }}.</p>
          <a class="cp-btn cp-btn--primary" routerLink="/murid/surat">Lihat surat pernyataan</a>
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

  readonly tierLabel = TIER_LABEL;
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
    if (source === 'CHOICE') return 'Sesuai kelas yang kamu pilih.';
    if (source === 'REBALANCE') return 'Ditempatkan lewat pemerataan supaya jumlah murid tiap kelas seimbang.';
    if (source === 'MANUAL') return 'Ditetapkan oleh waka kurikulum.';
    return SOURCE_LABEL[source] ?? '';
  }

  fmt(iso: string | null): string {
    return fmtDateTime(iso);
  }
}
