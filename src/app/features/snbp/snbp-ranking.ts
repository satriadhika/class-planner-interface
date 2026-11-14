import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, output, signal } from '@angular/core';

import { problemMessage } from '../../core/api/problem';
import { I18n } from '../../core/i18n/i18n';
import { Icon } from '../../shared/icon/icon';
import { Ranking, RankingRow, SnbpApi } from './snbp-api';
import { SNBP_TEXT } from './snbp.i18n';

type Filter = 'ALL' | 'ELIGIBLE' | 'NOT' | 'INCOMPLETE';

/** Peringkat nilai akhir dan status eligible. */
@Component({
  selector: 'app-snbp-ranking',
  imports: [DecimalPipe, Icon],
  template: `
    @if (error(); as e) { <div class="cp-alert cp-alert--error">{{ e }}</div> }

    @if (data(); as d) {
      <div class="cp-kpis cp-no-print">
        <div class="cp-kpi"><span class="cp-kpi__top"><span class="cp-kpi__icon"><app-icon name="award" [size]="17" /></span>{{ t().accreditation }}</span>
          <strong>{{ d.accreditation ?? t().notSet }}@if (d.accreditation) { <small> · {{ d.quotaPercent }}%</small> }</strong></div>
        <div class="cp-kpi"><span class="cp-kpi__top"><span class="cp-kpi__icon"><app-icon name="users" [size]="17" /></span>{{ t().cohort }}</span>
          <strong>{{ d.cohortSize }}</strong></div>
        <div class="cp-kpi"><span class="cp-kpi__top"><span class="cp-kpi__icon"><app-icon name="check-circle" [size]="17" /></span>{{ t().quota }}</span>
          <strong>{{ d.quota }}</strong>
          <small class="cp-muted">{{ t().quotaOf.replace('{p}', '' + d.quotaPercent).replace('{n}', '' + d.cohortSize) }}</small></div>
        <div class="cp-kpi"><span class="cp-kpi__top"><span class="cp-kpi__icon"><app-icon name="target" [size]="17" /></span>{{ t().cutoff }}</span>
          <strong>{{ d.cutoffScore != null ? (d.cutoffScore | number: '1.2-2') : '-' }}</strong></div>
      </div>

      @for (p of d.problems; track p) {
        <div class="cp-alert cp-alert--warn cp-no-print">
          <span>{{ problemText(p) }}</span>
          <button class="cp-btn cp-btn--sm" type="button" (click)="goto.emit(p === 'NO_GRADES' ? 'upload' : 'settings')">
            {{ p === 'NO_GRADES' ? t().openUpload : t().openSettings }}
          </button>
        </div>
      }
      @if (hasTie()) { <div class="cp-alert cp-alert--warn cp-no-print">{{ t().tieNote }}</div> }

      <section class="cp-card">
        <p class="cp-small cp-muted basis">
          {{ t().basis.replace('{s}', '' + d.subjectCount).replace('{sem}', d.semesters.join(', ')) }} ·
          {{ t().basisWeights.replace('{r}', '' + d.raporWeight) }}@for (c of d.components; track c.id) { + {{ c.name }} {{ c.weight }}% }
        </p>
        <div class="cp-row toolbar cp-no-print">
          <div class="cp-tabs" role="tablist">
            @for (f of filters(); track f.key) {
              <button type="button" role="tab" [attr.aria-selected]="filter() === f.key" (click)="filter.set(f.key)">
                {{ f.label }} <span class="count">{{ f.count }}</span>
              </button>
            }
          </div>
          <span class="cp-spacer"></span>
          <input type="search" [placeholder]="t().search" [attr.aria-label]="t().search" [value]="query()"
                 (input)="query.set($any($event.target).value)" />
          <button class="cp-btn cp-btn--sm" type="button" (click)="exportCsv()"><app-icon name="download" [size]="15" /> {{ t().exportCsv }}</button>
          <button class="cp-btn cp-btn--sm" type="button" (click)="print()"><app-icon name="printer" [size]="15" /> {{ t().print }}</button>
        </div>

        <div class="cp-table-wrap cp-print-area">
          <table class="cp-table">
            <thead>
              <tr>
                <th class="num">{{ t().colRank }}</th><th>{{ t().colStudent }}</th><th>{{ t().colClass }}</th>
                <th class="num">{{ t().colRapor }}</th>
                @for (c of d.components; track c.id) { <th class="num">{{ c.name }}</th> }
                <th class="num">{{ t().colFinal }}</th><th>{{ t().colStatus }}</th><th>{{ t().colNote }}</th>
              </tr>
            </thead>
            <tbody>
              @for (r of visible(); track r.studentId) {
                <tr [class.in]="r.eligible" [class.cut]="r.rank === d.quota">
                  <td class="num"><strong>{{ r.rank ?? '-' }}</strong></td>
                  <td><strong>{{ r.fullName }}</strong><div class="cp-small cp-muted">{{ r.studentNumber }}</div></td>
                  <td>{{ r.classLabel ?? '-' }}</td>
                  <td class="num">{{ r.raporAverage != null ? (r.raporAverage | number: '1.2-2') : '-' }}</td>
                  @for (c of r.components; track c.componentId) {
                    <td class="num">{{ c.score != null ? (c.score | number: '1.0-2') : '-' }}</td>
                  }
                  <td class="num"><strong>{{ r.finalScore != null ? (r.finalScore | number: '1.2-2') : '-' }}</strong></td>
                  <td>
                    @if (r.eligible) { <span class="cp-badge cp-badge--ok">{{ t().eligible }}</span> }
                    @if (r.tie) { <span class="cp-badge cp-badge--warn">{{ t().tie }}</span> }
                  </td>
                  <td class="notes">
                    @for (m of r.missing; track m) { <span class="cp-chip">{{ missingText(m, d) }}</span> }
                  </td>
                </tr>
              } @empty {
                <tr><td [attr.colspan]="7 + d.components.length" class="cp-empty">{{ d.rows.length ? t().noMatch : t().noRows }}</td></tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    }
  `,
  styles: `
    .cp-kpi small { display: block; margin-top: 2px; }
    .basis { margin: 0 0 12px; }
    .toolbar { margin-bottom: 12px; flex-wrap: wrap; }
    .toolbar input { min-height: 36px; width: min(100%, 240px); }
    .count { margin-left: 4px; opacity: 0.7; font-weight: 500; }
    tr.in td:first-child { box-shadow: inset 3px 0 0 var(--success); }
    tr.cut td { border-bottom: 2px dashed var(--success); }
    .notes .cp-chip { margin: 0 4px 4px 0; }
    td .cp-badge + .cp-badge { margin-left: 4px; }
  `,
})
export class SnbpRanking {
  private readonly api = inject(SnbpApi);
  private readonly i18n = inject(I18n);
  readonly goto = output<'settings' | 'upload'>();

  readonly t = computed(() => SNBP_TEXT[this.i18n.lang()]);
  readonly data = signal<Ranking | null>(null);
  readonly error = signal<string | null>(null);
  readonly filter = signal<Filter>('ALL');
  readonly query = signal('');

  readonly hasTie = computed(() => this.data()?.rows.some((r) => r.tie) ?? false);

  readonly filters = computed(() => {
    const rows = this.data()?.rows ?? [];
    return [
      { key: 'ALL' as Filter, label: this.t().all, count: rows.length },
      { key: 'ELIGIBLE' as Filter, label: this.t().eligibleOnly, count: rows.filter((r) => r.eligible).length },
      { key: 'NOT' as Filter, label: this.t().notEligible, count: rows.filter((r) => !r.eligible).length },
      { key: 'INCOMPLETE' as Filter, label: this.t().incomplete, count: rows.filter((r) => r.missing.length).length },
    ];
  });

  readonly visible = computed(() => {
    const q = this.query().trim().toLowerCase();
    return (this.data()?.rows ?? []).filter((r) => {
      const f = this.filter();
      if (f === 'ELIGIBLE' && !r.eligible) return false;
      if (f === 'NOT' && r.eligible) return false;
      if (f === 'INCOMPLETE' && !r.missing.length) return false;
      return !q || r.fullName.toLowerCase().includes(q) || r.studentNumber.includes(q);
    });
  });

  constructor() {
    this.api.ranking().subscribe({
      next: (d) => this.data.set(d),
      error: (e: unknown) => this.error.set(problemMessage(e)),
    });
  }

  problemText(p: string): string {
    const t = this.t();
    return p === 'NO_ACCREDITATION' ? t.pNoAccreditation : p === 'WEIGHT_NOT_100' ? t.pWeight : t.pNoGrades;
  }

  missingText(m: string, d: Ranking): string {
    if (m === 'NO_GRADES') return this.t().noGrades;
    if (m.startsWith('SEMESTER_')) return this.t().missingSemester.replace('{n}', m.slice(9));
    const id = Number(m.slice(10));
    return this.t().missingComponent.replace('{name}', d.components.find((c) => c.id === id)?.name ?? '?');
  }

  /** CSV untuk Excel (pemisah titik koma, desimal koma) — siap diolah untuk PDSS. */
  exportCsv(): void {
    const d = this.data();
    if (!d) return;
    const t = this.t();
    const num = (v: number | null) => (v == null ? '' : String(v).replace('.', ','));
    const esc = (v: string | null) => `"${(v ?? '').replace(/"/g, '""')}"`;
    const head = [t.colRank, 'NIS', t.colStudent, t.colClass, t.colRapor, ...d.components.map((c) => c.name), t.colFinal, t.colStatus];
    const lines = d.rows.map((r: RankingRow) =>
      [
        r.rank ?? '',
        esc(r.studentNumber),
        esc(r.fullName),
        esc(r.classLabel),
        num(r.raporAverage),
        ...r.components.map((c) => num(c.score)),
        num(r.finalScore),
        r.eligible ? t.eligible : '',
      ].join(';'),
    );
    const blob = new Blob(['﻿' + [head.map(esc).join(';'), ...lines].join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `eligible-snbp-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  print(): void {
    window.print();
  }
}
