import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { problemCode, problemMessage } from '../../../core/api/problem';
import { I18n } from '../../../core/i18n/i18n';
import { LetterData, StatementLetter } from '../../../shared/letter/statement-letter';
import { MuridApi } from '../murid-api';
import { SURAT_TEXT } from './surat.i18n';

/** Surat pernyataan murid. Disimpan sebagai PDF lewat dialog cetak browser. */
@Component({
  selector: 'app-surat',
  imports: [RouterLink, StatementLetter],
  template: `
    <div class="cp-page">
      <header class="cp-head cp-no-print">
        <div>
          <h1>{{ t().title }}</h1>
          <p>{{ t().intro }}</p>
        </div>
        @if (data()) {
          <button class="cp-btn cp-btn--primary" type="button" (click)="print()">{{ t().print }}</button>
        }
      </header>

      @if (error(); as e) { <div class="cp-alert cp-alert--error cp-no-print">{{ e }}</div> }

      @if (pending()) {
        <div class="cp-empty">
          {{ t().pending }}
          <a routerLink="/murid">{{ t().backHome }}</a>
        </div>
      }

      @if (data(); as d) {
        <p class="cp-small cp-muted cp-no-print hint">{{ t().hint }} {{ t().officialNote }}</p>
        <div class="cp-print-area wrap">
          <app-statement-letter [data]="d" />
        </div>
      }
    </div>
  `,
  styles: `
    .wrap { overflow-x: auto; }
    .hint { margin: 0 0 12px; }
  `,
})
export class Surat {
  private readonly api = inject(MuridApi);
  private readonly i18n = inject(I18n);
  /** Teks sesuai bahasa aktif. Isi surat tetap bahasa Indonesia (dokumen resmi sekolah). */
  readonly t = computed(() => SURAT_TEXT[this.i18n.lang()]);

  readonly data = signal<LetterData | null>(null);
  readonly pending = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    this.api.letter().subscribe({
      next: (d) => this.data.set(d),
      error: (e: unknown) => {
        if (problemCode(e) === 'NOT_FINALIZED') this.pending.set(true);
        else this.error.set(problemMessage(e));
      },
    });
  }

  print(): void {
    window.print();
  }
}
