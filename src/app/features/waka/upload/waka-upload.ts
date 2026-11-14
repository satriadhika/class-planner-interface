import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { problemMessage, translateMessage } from '../../../core/api/problem';
import { I18n } from '../../../core/i18n/i18n';
import { CycleBar } from '../cycle-bar';
import { CycleStore } from '../cycle-store';
import { AssessmentRow, ImportResult, WakaApi } from '../waka-api';
import { UPLOAD_TEXT } from './waka-upload.i18n';

type Filter = 'ALL' | 'COMPLETE' | 'INCOMPLETE';

/** Rapor IPA & IPS dan skor bakat IPA & IPS sudah ada semua. */
function complete(r: AssessmentRow): boolean {
  return r.reportIpa != null && r.reportIps != null && r.aptitudeIpa != null && r.aptitudeIps != null;
}

/** Impor nilai rapor (leger e-Rapor per semester) dan minat bakat per siklus, plus tabel nilai yang sudah masuk. */
@Component({
  selector: 'app-waka-upload',
  imports: [RouterLink, CycleBar],
  template: `
    <div class="cp-page">
      <header class="cp-head">
        <div>
          <h1>{{ t().title }}</h1>
          <p>{{ t().intro }}</p>
        </div>
      </header>

      <app-cycle-bar (changed)="result.set(null); reload()" />

      @if (message(); as m) {
        <div class="cp-alert" [class.cp-alert--error]="m.error" [class.cp-alert--ok]="!m.error">{{ m.text }}</div>
      }

      @if (store.detail(); as d) {
        @if (d.cycle.status === 'FINALIZED') {
          <div class="cp-alert cp-alert--warn">{{ t().finalized }}</div>
        }
        <div class="cp-grid two">
          <section class="cp-card">
            <h2>{{ t().importTitle }}</h2>
            <p class="cp-sub">{{ t().importHint }}</p>
            <div class="cp-form">
              <label class="cp-field">
                <span>{{ t().semester }}</span>
                <select [value]="semester()" (change)="semester.set($any($event.target).value)">
                  <option value="AUTO">{{ t().semAuto }}</option>
                  <option value="GANJIL">{{ t().semGanjil }}</option>
                  <option value="GENAP">{{ t().semGenap }}</option>
                </select>
              </label>
              <label class="cp-field">
                <span>{{ t().fileLabel }}</span>
                <input type="file" accept=".xlsx,.xls" (change)="pick($event)" />
              </label>
              <div class="cp-row">
                <button class="cp-btn cp-btn--primary" type="button" [disabled]="busy() || !file()" (click)="upload(d.cycle.id)">
                  {{ busy() ? t().importing : t().import }}
                </button>
              </div>
            </div>
            @if (result(); as r) {
              <div class="cp-stats res">
                <div class="cp-stat"><strong>{{ r.created }}</strong><span>{{ t().created }}</span></div>
                <div class="cp-stat"><strong>{{ r.updated }}</strong><span>{{ t().updated }}</span></div>
                <div class="cp-stat"><strong>{{ r.skipped }}</strong><span>{{ t().skipped }}</span></div>
              </div>
              @if (r.messages.length) {
                <ul class="msgs cp-small">@for (m of r.messages; track $index) { <li>{{ tr(m) }}</li> }</ul>
              }
            }
          </section>

          <section class="cp-card">
            <h2>{{ t().formatTitle }}</h2>
            <p class="cp-sub">{{ t().formatHint }}</p>

            <figure class="ledger">
              <div class="cp-table-wrap">
                <table class="sheet" aria-hidden="true">
                  <tbody>
                    <tr class="title"><td colspan="9">LEGER NILAI RAPOR SISWA TAHUN PELAJARAN 2023/2024 <mark>GANJIL</mark></td></tr>
                    <tr class="title"><td colspan="9">Kelas : X BALI</td></tr>
                    <tr class="head">
                      <th rowspan="2">NO</th><th rowspan="2">NAMA SISWA</th><th rowspan="2">NISN</th>
                      <th rowspan="2" class="key">NIS</th><th colspan="4">{{ t().subjects }}</th>
                      <th rowspan="2" class="opt">BAKAT IPA</th>
                    </tr>
                    <tr class="head">
                      <th class="dim">{{ t().others }}</th><th class="key">IPA</th><th class="key">IPS</th><th class="dim">IPA IPS</th>
                    </tr>
                    <tr><td>1</td><td>Alya Puspita</td><td>0071234567</td><td class="key">232410004</td><td class="dim">88 · 90 · …</td><td class="key">89</td><td class="key">87</td><td class="dim"></td><td class="opt">72</td></tr>
                  </tbody>
                </table>
              </div>
              <figcaption class="cp-small cp-muted">{{ t().layoutCaption }}</figcaption>
            </figure>

            <ol class="rules">
              @for (r of t().rules; track $index) { <li>{{ r }}</li> }
            </ol>
            <div class="cp-row">
              <a class="cp-btn cp-btn--sm" href="/assets/templates/contoh-leger-nilai.xlsx" download>{{ t().template }}</a>
              <a class="cp-btn cp-btn--sm cp-btn--ghost" routerLink="/waka/pengguna">{{ t().nisLink }}</a>
            </div>
          </section>
        </div>

        <section class="cp-card data">
          <div class="cp-row data-head">
            <div>
              <h2>{{ t().dataTitle }}</h2>
              <p class="cp-sub">{{ t().dataHint }}</p>
            </div>
          </div>

          <section class="cp-stats">
            <div class="cp-stat"><strong>{{ withReport() }}<small>/{{ rows().length }}</small></strong><span>{{ t().statReport }}</span></div>
            <div class="cp-stat"><strong>{{ withBoth() }}<small>/{{ rows().length }}</small></strong><span>{{ t().statBoth }}</span></div>
            <div class="cp-stat"><strong>{{ withAptitude() }}<small>/{{ rows().length }}</small></strong><span>{{ t().statAptitude }}</span></div>
          </section>

          <div class="cp-row toolbar">
            <div class="cp-tabs" role="tablist">
              @for (f of filters(); track f.key) {
                <button type="button" role="tab" [attr.aria-selected]="filter() === f.key" (click)="filter.set(f.key)">{{ f.label }}</button>
              }
            </div>
            <span class="cp-spacer"></span>
            <select [value]="klass()" (change)="klass.set($any($event.target).value)" [attr.aria-label]="t().classAria">
              <option value="">{{ t().allClasses }}</option>
              @for (c of classes(); track c) { <option [value]="c">{{ c }}</option> }
            </select>
            <input type="search" [placeholder]="t().search" [value]="query()" (input)="query.set($any($event.target).value)" [attr.aria-label]="t().search" />
          </div>

          <div class="cp-table-wrap">
            <table class="cp-table grades">
              <thead>
                <tr>
                  <th rowspan="2">{{ t().colStudent }}</th>
                  <th rowspan="2">{{ t().colClass }}</th>
                  <th colspan="3" class="grp">{{ t().colIpa }}</th>
                  <th colspan="3" class="grp">{{ t().colIps }}</th>
                  <th colspan="2" class="grp">{{ t().colAptitude }}</th>
                </tr>
                <tr>
                  <th class="num">{{ t().ganjil }}</th><th class="num">{{ t().genap }}</th><th class="num avg">{{ t().avg }}</th>
                  <th class="num">{{ t().ganjil }}</th><th class="num">{{ t().genap }}</th><th class="num avg">{{ t().avg }}</th>
                  <th class="num">IPA</th><th class="num">IPS</th>
                </tr>
              </thead>
              <tbody>
                @for (r of visible(); track r.studentId) {
                  <tr>
                    <td><strong>{{ r.fullName }}</strong><div class="cp-small cp-muted">{{ r.studentNumber }}</div></td>
                    <td>{{ r.classLabel ?? '-' }}</td>
                    <td class="num">{{ n(r.ipaSem1) }}</td><td class="num">{{ n(r.ipaSem2) }}</td>
                    <td class="num avg" [class.lead]="lead(r) === 'IPA'">{{ n(r.reportIpa) }}</td>
                    <td class="num">{{ n(r.ipsSem1) }}</td><td class="num">{{ n(r.ipsSem2) }}</td>
                    <td class="num avg" [class.lead]="lead(r) === 'IPS'">{{ n(r.reportIps) }}</td>
                    <td class="num">{{ n(r.aptitudeIpa) }}</td><td class="num">{{ n(r.aptitudeIps) }}</td>
                  </tr>
                } @empty {
                  <tr><td colspan="10" class="cp-muted">{{ loadingRows() ? t().loading : t().noData }}</td></tr>
                }
              </tbody>
            </table>
          </div>
          <p class="cp-small cp-muted foot">{{ t().legend }}</p>
        </section>
      }
    </div>
  `,
  styles: `
    .two { grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); align-items: start; }
    .res { margin-top: 14px; }
    .msgs { margin: 10px 0 0; padding-left: 18px; max-height: 200px; overflow: auto; }
    select { min-height: 40px; }
    .ledger { margin: 4px 0 16px; }
    .sheet {
      border-collapse: collapse;
      font-size: 0.74rem;
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
    }
    .sheet td, .sheet th { padding: 5px 8px; border: 1px solid var(--border); text-align: center; }
    .sheet .title td { border: 0; padding: 2px 4px; text-align: left; font-weight: 700; color: var(--brand-ink); }
    .sheet .head th { background: var(--surface-tint); font-weight: 700; }
    .sheet .key { background: var(--primary-soft); color: var(--primary); font-weight: 700; }
    .sheet .opt { background: var(--success-soft); color: var(--success); font-weight: 700; }
    .sheet .dim { color: var(--muted); font-weight: 500; }
    .sheet mark { padding: 0 3px; border-radius: 3px; background: var(--primary-soft); color: var(--primary); }
    .ledger figcaption { margin-top: 6px; }
    .data { margin-top: 18px; }
    .data-head { align-items: flex-start; }
    .data .cp-stats { margin: 4px 0 14px; }
    .cp-stat small { font-size: 0.9rem; color: var(--muted); }
    .toolbar { margin-bottom: 14px; gap: 10px; }
    .toolbar select { min-height: 38px; }
    input[type='search'] { min-height: 38px; width: min(100%, 240px); }
    .grades { font-variant-numeric: tabular-nums; }
    .grades th.grp { text-align: center; border-bottom: 1px solid var(--border); }
    .grades .avg { font-weight: 700; }
    .grades td.lead { color: var(--primary); }
    .foot { margin: 10px 0 0; }
    .rules { display: grid; gap: 8px; margin: 0 0 16px; padding-left: 18px; font-size: 0.9rem; line-height: 1.5; }
  `,
})
export class WakaUpload {
  readonly store = inject(CycleStore);
  private readonly api = inject(WakaApi);
  private readonly i18n = inject(I18n);
  /** Teks sesuai bahasa aktif. */
  readonly t = computed(() => UPLOAD_TEXT[this.i18n.lang()]);

  readonly file = signal<File | null>(null);
  readonly semester = signal<'AUTO' | 'GANJIL' | 'GENAP'>('AUTO');
  readonly busy = signal(false);
  readonly result = signal<ImportResult | null>(null);
  readonly message = signal<{ text: string; error: boolean } | null>(null);

  readonly rows = signal<AssessmentRow[]>([]);
  readonly loadingRows = signal(false);
  readonly filter = signal<Filter>('ALL');
  readonly klass = signal('');
  readonly query = signal('');

  readonly filters = computed<{ key: Filter; label: string }[]>(() => [
    { key: 'ALL', label: this.t().all },
    { key: 'COMPLETE', label: this.t().complete },
    { key: 'INCOMPLETE', label: this.t().incomplete },
  ]);
  readonly classes = computed(() =>
    [...new Set(this.rows().map((r) => r.classLabel).filter((c): c is string => !!c))].sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true }),
    ),
  );
  readonly withReport = computed(() => this.rows().filter((r) => r.reportIpa != null && r.reportIps != null).length);
  readonly withAptitude = computed(() => this.rows().filter((r) => r.aptitudeIpa != null && r.aptitudeIps != null).length);
  readonly withBoth = computed(() => this.rows().filter(complete).length);
  readonly visible = computed(() => {
    const q = this.query().trim().toLowerCase();
    const k = this.klass();
    const f = this.filter();
    return this.rows().filter(
      (r) =>
        (!k || r.classLabel === k) &&
        (f === 'ALL' || (f === 'COMPLETE') === complete(r)) &&
        (!q || r.fullName.toLowerCase().includes(q) || r.studentNumber.includes(q)),
    );
  });

  constructor() {
    this.store.ensure().subscribe({
      next: () => this.reload(),
      error: (e: unknown) => this.message.set({ text: problemMessage(e), error: true }),
    });
  }

  /** Muat ulang tabel nilai untuk siklus terpilih. */
  reload(): void {
    const id = this.store.selectedId();
    this.rows.set([]);
    if (!id) return;
    this.loadingRows.set(true);
    this.api.assessments(id).subscribe({
      next: (rows) => {
        this.loadingRows.set(false);
        this.rows.set(rows);
      },
      error: (e: unknown) => {
        this.loadingRows.set(false);
        this.message.set({ text: problemMessage(e), error: true });
      },
    });
  }

  /** Angka maksimal 2 desimal, format sesuai bahasa; '-' kalau belum ada. */
  n(v: number | null): string {
    if (v == null) return '-';
    return v.toLocaleString(this.i18n.lang() === 'id' ? 'id-ID' : 'en-US', { maximumFractionDigits: 2 });
  }

  /** Rumpun dengan rata-rata rapor lebih tinggi (untuk penanda), null kalau sama / belum lengkap. */
  lead(r: AssessmentRow): 'IPA' | 'IPS' | null {
    if (r.reportIpa == null || r.reportIps == null || r.reportIpa === r.reportIps) return null;
    return r.reportIpa > r.reportIps ? 'IPA' : 'IPS';
  }

  /** Pesan hasil impor dari backend, diterjemahkan sesuai bahasa. */
  tr(message: string): string {
    this.i18n.lang();
    return translateMessage(message);
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
    this.api.importAssessments(cycleId, f, this.semester()).subscribe({
      next: (r) => {
        this.busy.set(false);
        this.result.set(r);
        this.message.set({ text: this.t().done, error: false });
        this.reload();
      },
      error: (e: unknown) => {
        this.busy.set(false);
        this.message.set({ text: problemMessage(e), error: true });
      },
    });
  }
}
