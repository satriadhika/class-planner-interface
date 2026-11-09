import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { problemCode, problemMessage } from '../../../core/api/problem';
import { LetterData, StatementLetter } from '../../../shared/letter/statement-letter';
import { MuridApi } from '../murid-api';

/** Surat pernyataan murid. Disimpan sebagai PDF lewat dialog cetak browser. */
@Component({
  selector: 'app-surat',
  imports: [RouterLink, StatementLetter],
  template: `
    <div class="cp-page">
      <header class="cp-head cp-no-print">
        <div>
          <h1>Surat pernyataan</h1>
          <p>Cetak atau simpan sebagai PDF, tanda tangani bersama orang tua/wali, lalu serahkan ke sekolah.</p>
        </div>
        @if (data()) {
          <button class="cp-btn cp-btn--primary" type="button" (click)="print()">Cetak / simpan PDF</button>
        }
      </header>

      @if (error(); as e) { <div class="cp-alert cp-alert--error cp-no-print">{{ e }}</div> }

      @if (pending()) {
        <div class="cp-empty">
          Surat bisa diunduh setelah waka kurikulum menyetujui kelas final.
          <a routerLink="/murid">Kembali ke beranda</a>
        </div>
      }

      @if (data(); as d) {
        <p class="cp-small cp-muted cp-no-print hint">Di dialog cetak, pilih tujuan "Simpan sebagai PDF" dan ukuran kertas A4.</p>
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
