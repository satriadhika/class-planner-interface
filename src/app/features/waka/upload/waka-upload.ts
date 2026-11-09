import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { problemMessage } from '../../../core/api/problem';
import { CycleBar } from '../cycle-bar';
import { CycleStore } from '../cycle-store';
import { ImportResult, WakaApi } from '../waka-api';

/** Impor nilai rapor dan minat bakat per siklus. */
@Component({
  selector: 'app-waka-upload',
  imports: [RouterLink, CycleBar],
  template: `
    <div class="cp-page">
      <header class="cp-head">
        <div>
          <h1>Nilai &amp; minat bakat</h1>
          <p>Nilai IPA/IPS rapor dan skor minat bakat dipakai untuk menghitung persentil murid dalam satu angkatan.</p>
        </div>
      </header>

      <app-cycle-bar (changed)="result.set(null)" />

      @if (message(); as m) {
        <div class="cp-alert" [class.cp-alert--error]="m.error" [class.cp-alert--ok]="!m.error">{{ m.text }}</div>
      }

      @if (store.detail(); as d) {
        @if (d.cycle.status === 'FINALIZED') {
          <div class="cp-alert cp-alert--warn">Siklus ini sudah disetujui. Nilai yang diimpor sekarang tidak mengubah kelas final.</div>
        }
        <div class="cp-grid two">
          <section class="cp-card">
            <h2>Impor file</h2>
            <p class="cp-sub">Bisa beberapa kali. File berikutnya hanya mengisi kolom yang ada di file itu, kolom lain tidak dihapus.</p>
            <div class="cp-form">
              <label class="cp-field">
                <span>File leger (.xlsx)</span>
                <input type="file" accept=".xlsx,.xls" (change)="pick($event)" />
              </label>
              <div class="cp-row">
                <button class="cp-btn cp-btn--primary" type="button" [disabled]="busy() || !file()" (click)="upload(d.cycle.id)">
                  {{ busy() ? 'Mengimpor…' : 'Impor' }}
                </button>
              </div>
            </div>
            @if (result(); as r) {
              <div class="cp-stats res">
                <div class="cp-stat"><strong>{{ r.created }}</strong><span>baru</span></div>
                <div class="cp-stat"><strong>{{ r.updated }}</strong><span>diperbarui</span></div>
                <div class="cp-stat"><strong>{{ r.skipped }}</strong><span>dilewati</span></div>
              </div>
              @if (r.messages.length) {
                <ul class="msgs cp-small">@for (m of r.messages; track $index) { <li>{{ m }}</li> }</ul>
              }
            }
          </section>

          <section class="cp-card">
            <h2>Format file</h2>
            <p class="cp-sub">Leger e-Rapor bisa langsung dipakai. Semua sheet dibaca (misalnya X-1 sampai X-4). Baris judul boleh bertingkat.</p>
            <div class="cp-table-wrap">
              <table class="cp-table">
                <thead><tr><th>Kolom</th><th>Isi</th></tr></thead>
                <tbody>
                  <tr><td><strong>NIS</strong></td><td>Wajib. Harus sudah terdaftar di <a routerLink="/waka/pengguna">Data murid</a>.</td></tr>
                  <tr><td><strong>IPA</strong></td><td>Nilai rapor IPA</td></tr>
                  <tr><td><strong>IPS</strong></td><td>Nilai rapor IPS</td></tr>
                  <tr><td><strong>BAKAT IPA</strong></td><td>Skor minat bakat IPA (opsional)</td></tr>
                  <tr><td><strong>BAKAT IPS</strong></td><td>Skor minat bakat IPS (opsional)</td></tr>
                </tbody>
              </table>
            </div>
            <p class="cp-small cp-muted">Angka desimal boleh pakai koma atau titik. Kolom mapel lain di leger diabaikan.</p>
          </section>
        </div>
      }
    </div>
  `,
  styles: `
    .two { grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); align-items: start; }
    .res { margin-top: 14px; }
    .msgs { margin: 10px 0 0; padding-left: 18px; max-height: 200px; overflow: auto; }
  `,
})
export class WakaUpload {
  readonly store = inject(CycleStore);
  private readonly api = inject(WakaApi);

  readonly file = signal<File | null>(null);
  readonly busy = signal(false);
  readonly result = signal<ImportResult | null>(null);
  readonly message = signal<{ text: string; error: boolean } | null>(null);

  constructor() {
    this.store.ensure().subscribe({ error: (e: unknown) => this.message.set({ text: problemMessage(e), error: true }) });
  }

  pick(event: Event): void {
    this.file.set((event.target as HTMLInputElement).files?.[0] ?? null);
  }

  upload(cycleId: number): void {
    const f = this.file();
    if (!f) return;
    this.busy.set(true);
    this.message.set(null);
    this.result.set(null);
    this.api.importAssessments(cycleId, f).subscribe({
      next: (r) => {
        this.busy.set(false);
        this.result.set(r);
        this.message.set({ text: 'Impor nilai selesai.', error: false });
      },
      error: (e: unknown) => {
        this.busy.set(false);
        this.message.set({ text: problemMessage(e), error: true });
      },
    });
  }
}
