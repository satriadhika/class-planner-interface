import { Component, computed, inject, signal } from '@angular/core';

import { problemMessage } from '../../../core/api/problem';
import { fmtDateTime } from '../../../shared/labels/labels';
import { CycleBar } from '../cycle-bar';
import { CycleStore } from '../cycle-store';
import { QuestionnaireRow, WakaApi } from '../waka-api';

type Filter = 'ALL' | 'SUBMITTED' | 'DRAFT' | 'NOT_STARTED';

const STATUS_TEXT: Record<string, string> = { SUBMITTED: 'Terkirim', DRAFT: 'Draf', NOT_STARTED: 'Belum mulai' };

/** Monitoring pengisian kuesioner murid. */
@Component({
  selector: 'app-waka-kuesioner',
  imports: [CycleBar],
  template: `
    <div class="cp-page">
      <header class="cp-head">
        <div>
          <h1>Kuesioner</h1>
          <p>Pantau murid yang sudah dan belum mengirim kuesioner. Kelas baru bisa dibentuk setelah semua murid mengirim.</p>
        </div>
        <button class="cp-btn" type="button" (click)="reload()">Muat ulang</button>
      </header>

      <app-cycle-bar (changed)="reload()" />

      @if (error()) {
        <div class="cp-alert cp-alert--error">{{ error() }}</div>
      }

      <section class="cp-stats">
        <div class="cp-stat"><strong>{{ count('SUBMITTED') }}<small>/{{ rows().length }}</small></strong><span>Terkirim</span></div>
        <div class="cp-stat"><strong>{{ count('DRAFT') }}</strong><span>Masih draf</span></div>
        <div class="cp-stat"><strong>{{ count('NOT_STARTED') }}</strong><span>Belum mulai</span></div>
      </section>

      <section class="cp-card">
        <div class="cp-row toolbar">
          <div class="cp-tabs" role="tablist">
            @for (f of filters; track f.key) {
              <button type="button" role="tab" [attr.aria-selected]="filter() === f.key" (click)="filter.set(f.key)">{{ f.label }}</button>
            }
          </div>
          <span class="cp-spacer"></span>
          <input type="search" placeholder="Cari nama / NIS" [value]="query()" (input)="query.set($any($event.target).value)" aria-label="Cari murid" />
        </div>

        <div class="cp-table-wrap">
          <table class="cp-table">
            <thead>
              <tr>
                <th>Murid</th><th>Kelas</th><th>Status</th><th>Jurusan 1</th><th>Jurusan 2</th>
                <th class="num">Minat IPA</th><th class="num">Minat IPS</th><th>Dikirim</th>
              </tr>
            </thead>
            <tbody>
              @for (r of visible(); track r.studentId) {
                <tr>
                  <td><strong>{{ r.fullName }}</strong><div class="cp-small cp-muted">{{ r.studentNumber }}</div></td>
                  <td>{{ r.classLabel ?? '-' }}</td>
                  <td>
                    <span class="cp-badge" [class.cp-badge--ok]="r.status === 'SUBMITTED'" [class.cp-badge--warn]="r.status === 'DRAFT'"
                          [class.cp-badge--danger]="r.status === 'NOT_STARTED'">{{ statusText[r.status] }}</span>
                  </td>
                  <td>{{ r.major1 ?? '-' }}</td>
                  <td>{{ r.major2 ?? '-' }}</td>
                  <td class="num">{{ r.interestIpa ?? '-' }}</td>
                  <td class="num">{{ r.interestIps ?? '-' }}</td>
                  <td class="cp-small">{{ fmt(r.submittedAt) }}</td>
                </tr>
              } @empty {
                <tr><td colspan="8" class="cp-muted">Tidak ada data.</td></tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `,
  styles: `
    .toolbar { margin-bottom: 14px; }
    input[type='search'] { min-height: 38px; width: min(100%, 260px); }
    .cp-stat small { font-size: 0.9rem; color: var(--muted); }
  `,
})
export class WakaKuesioner {
  private readonly store = inject(CycleStore);
  private readonly api = inject(WakaApi);

  readonly statusText = STATUS_TEXT;
  readonly filters: { key: Filter; label: string }[] = [
    { key: 'ALL', label: 'Semua' },
    { key: 'SUBMITTED', label: 'Terkirim' },
    { key: 'DRAFT', label: 'Draf' },
    { key: 'NOT_STARTED', label: 'Belum mulai' },
  ];

  readonly rows = signal<QuestionnaireRow[]>([]);
  readonly filter = signal<Filter>('ALL');
  readonly query = signal('');
  readonly error = signal<string | null>(null);

  readonly visible = computed(() => {
    const q = this.query().trim().toLowerCase();
    return this.rows().filter(
      (r) =>
        (this.filter() === 'ALL' || r.status === this.filter()) &&
        (!q || r.fullName.toLowerCase().includes(q) || r.studentNumber.includes(q)),
    );
  });

  constructor() {
    this.store.ensure().subscribe({ next: () => this.reload(), error: (e: unknown) => this.error.set(problemMessage(e)) });
  }

  reload(): void {
    const id = this.store.selectedId();
    if (!id) return;
    this.error.set(null);
    this.api.questionnaires(id).subscribe({
      next: (rows) => this.rows.set(rows),
      error: (e: unknown) => this.error.set(problemMessage(e)),
    });
  }

  count(status: string): number {
    return this.rows().filter((r) => r.status === status).length;
  }

  fmt(iso: string | null): string {
    return fmtDateTime(iso);
  }
}
