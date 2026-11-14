import { Component, computed, inject, signal } from '@angular/core';

import { problemMessage } from '../../../core/api/problem';
import { I18n } from '../../../core/i18n/i18n';
import { fmtDateTime } from '../../../shared/labels/labels';
import { CycleBar } from '../cycle-bar';
import { CycleStore } from '../cycle-store';
import { QuestionnaireRow, WakaApi } from '../waka-api';
import { WAKA_KUESIONER_TEXT } from './waka-kuesioner.i18n';

type Filter = 'ALL' | 'SUBMITTED' | 'DRAFT' | 'NOT_STARTED';


/** Monitoring pengisian kuesioner murid. */
@Component({
  selector: 'app-waka-kuesioner',
  imports: [CycleBar],
  template: `
    <div class="cp-page">
      <header class="cp-head">
        <div>
          <h1>{{ t().title }}</h1>
          <p>{{ t().intro }}</p>
        </div>
        <button class="cp-btn" type="button" (click)="reload()">{{ t().reload }}</button>
      </header>

      <app-cycle-bar (changed)="reload()" />

      @if (error()) {
        <div class="cp-alert cp-alert--error">{{ error() }}</div>
      }

      <section class="cp-stats">
        <div class="cp-stat"><strong>{{ count('SUBMITTED') }}<small>/{{ rows().length }}</small></strong><span>{{ t().submitted }}</span></div>
        <div class="cp-stat"><strong>{{ count('DRAFT') }}</strong><span>{{ t().stillDraft }}</span></div>
        <div class="cp-stat"><strong>{{ count('NOT_STARTED') }}</strong><span>{{ t().notStarted }}</span></div>
      </section>

      <section class="cp-card">
        <div class="cp-row toolbar">
          <div class="cp-tabs" role="tablist">
            @for (f of filters(); track f.key) {
              <button type="button" role="tab" [attr.aria-selected]="filter() === f.key" (click)="filter.set(f.key)">{{ f.label }}</button>
            }
          </div>
          <span class="cp-spacer"></span>
          <input type="search" [placeholder]="t().search" [value]="query()" (input)="query.set($any($event.target).value)" [attr.aria-label]="t().searchAria" />
        </div>

        <div class="cp-table-wrap">
          <table class="cp-table">
            <thead>
              <tr>
                <th>{{ t().colStudent }}</th><th>{{ t().colClass }}</th><th>{{ t().colStatus }}</th><th>{{ t().colMajor1 }}</th><th>{{ t().colMajor2 }}</th>
                <th class="num">{{ t().colIpa }}</th><th class="num">{{ t().colIps }}</th><th>{{ t().colSent }}</th>
              </tr>
            </thead>
            <tbody>
              @for (r of visible(); track r.studentId) {
                <tr>
                  <td><strong>{{ r.fullName }}</strong><div class="cp-small cp-muted">{{ r.studentNumber }}</div></td>
                  <td>{{ r.classLabel ?? '-' }}</td>
                  <td>
                    <span class="cp-badge" [class.cp-badge--ok]="r.status === 'SUBMITTED'" [class.cp-badge--warn]="r.status === 'DRAFT'"
                          [class.cp-badge--danger]="r.status === 'NOT_STARTED'">{{ statusText()[r.status] }}</span>
                  </td>
                  <td>{{ r.major1 ?? '-' }}</td>
                  <td>{{ r.major2 ?? '-' }}</td>
                  <td class="num">{{ r.interestIpa ?? '-' }}</td>
                  <td class="num">{{ r.interestIps ?? '-' }}</td>
                  <td class="cp-small">{{ fmt(r.submittedAt) }}</td>
                </tr>
              } @empty {
                <tr><td colspan="8" class="cp-muted">{{ t().noData }}</td></tr>
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

  private readonly i18n = inject(I18n);
  /** Teks sesuai bahasa aktif. */
  readonly t = computed(() => WAKA_KUESIONER_TEXT[this.i18n.lang()]);
  readonly statusText = computed<Record<string, string>>(() => ({
    SUBMITTED: this.t().submitted,
    DRAFT: this.t().draft,
    NOT_STARTED: this.t().notStarted,
  }));
  readonly filters = computed<{ key: Filter; label: string }[]>(() => [
    { key: 'ALL', label: this.t().all },
    { key: 'SUBMITTED', label: this.t().submitted },
    { key: 'DRAFT', label: this.t().draft },
    { key: 'NOT_STARTED', label: this.t().notStarted },
  ]);

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
