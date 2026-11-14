import { DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';

import { problemMessage } from '../../core/api/problem';
import { I18n } from '../../core/i18n/i18n';
import { ClassInfo, CycleDetail, CycleSummary, PlacementBoard } from '../../features/waka/waka-api';
import { Icon } from '../icon/icon';
import { CLASS_TYPE_TEXT, CYCLE_STATUS_TEXT, SOURCE_TEXT, TIER_TEXT, fmtDate } from '../labels/labels';
import { RESULTS_TEXT } from './cycle-results.i18n';
import { ViewApi } from './view-api';

const WITH_BOARD = ['REBALANCED', 'FINALIZED'];
const WITH_CLASSES = ['CLASSES_GENERATED', 'SELECTION_OPEN', 'SELECTION_CLOSED', ...WITH_BOARD];

/**
 * Hasil penjurusan baca-saja: pilih siklus, ringkasan, kelas dan daftar murid per kelas.
 * Dipakai guru (sekolahnya sendiri) dan super admin (schoolId diisi, dengan % kecocokan).
 */
@Component({
  selector: 'app-cycle-results',
  imports: [DecimalPipe, Icon],
  template: `
    @if (error(); as e) { <div class="cp-alert cp-alert--error">{{ e }}</div> }

    @if (loaded() && cycles().length === 0) {
      <div class="cp-empty">{{ t().noCycle }}</div>
    } @else if (cycles().length > 0) {
      <div class="bar cp-no-print">
        <label class="pick">
          <span class="cp-small cp-muted">{{ t().cycle }}</span>
          <select (change)="select(+$any($event.target).value)">
            @for (c of cycles(); track c.id) {
              <option [value]="c.id" [selected]="c.id === selectedId()">{{ c.name }} · {{ t().cohort }} {{ c.cohortEntryYear }}</option>
            }
          </select>
        </label>
        @if (detail(); as d) {
          <span class="cp-badge" [class.cp-badge--ok]="d.cycle.status === 'FINALIZED'" [class.cp-badge--primary]="d.cycle.status !== 'FINALIZED'">
            {{ statusLabel()[d.cycle.status] }}
          </span>
        }
        <span class="cp-spacer"></span>
        @if (board()) {
          <button class="cp-btn cp-btn--sm" type="button" (click)="print()"><app-icon name="printer" [size]="16" /> {{ t().print }}</button>
        }
      </div>

      @if (detail(); as d) {
        <div class="cp-kpis cp-no-print">
          <div class="cp-kpi"><span class="cp-kpi__top"><span class="cp-kpi__icon"><app-icon name="users" [size]="17" /></span>{{ t().students }} {{ d.cycle.cohortEntryYear }}</span><strong>{{ d.stats.students }}</strong></div>
          <div class="cp-kpi"><span class="cp-kpi__top"><span class="cp-kpi__icon"><app-icon name="layers" [size]="17" /></span>{{ t().classes }}</span><strong>{{ d.stats.classes || classes().length }}</strong></div>
          <div class="cp-kpi"><span class="cp-kpi__top"><span class="cp-kpi__icon"><app-icon name="check-circle" [size]="17" /></span>{{ t().chosen }}</span>
            <strong>{{ d.stats.choices }}<small> / {{ d.stats.students }}</small></strong></div>
          <div class="cp-kpi"><span class="cp-kpi__top"><span class="cp-kpi__icon"><app-icon name="shuffle" [size]="17" /></span>{{ t().placed }}</span>
            <strong>{{ d.stats.placements }}<small> / {{ d.stats.students }}</small></strong></div>
        </div>

        @if (!hasClasses()) {
          <div class="cp-empty">{{ t().notFormed }}</div>
        } @else if (!board()) {
          <p class="cp-small cp-muted note">{{ t().selecting }}</p>
          <div class="cards">
            @for (c of classes(); track c.id) {
              <article class="class-card">
                <header><h3>{{ t().classPrefix }} {{ c.label }}</h3><span class="cp-badge">{{ typeLabel()[c.type] ?? c.type }}</span></header>
                <div class="cp-chips">@for (s of c.subjectNames; track s) { <span class="cp-chip">{{ s }}</span> }</div>
                <p class="cp-small cp-muted">{{ t().chosenBy.replace('{n}', '' + c.choiceCount) }}</p>
              </article>
            }
          </div>
        } @else {
          @let b = board()!;
          @if (d.cycle.status === 'FINALIZED') {
            <div class="cp-alert cp-alert--ok cp-no-print">{{ t().final.replace('{date}', date(d.cycle.finalizedAt)) }}</div>
          } @else {
            <div class="cp-alert cp-alert--warn cp-no-print">{{ t().draft }}</div>
          }

          <section class="cp-card cp-no-print">
            <div class="cp-tabs class-tabs" role="tablist">
              @for (c of b.classes; track c.classId) {
                <button type="button" role="tab" [attr.aria-selected]="active() === c.classId" (click)="active.set(c.classId)">
                  {{ t().classPrefix }} {{ c.label }} <span class="size">{{ c.size }}</span>
                </button>
              }
            </div>
            @for (c of b.classes; track c.classId) {
              @if (active() === c.classId) {
                <div class="cp-row class-info">
                  <span class="cp-badge">{{ typeLabel()[c.type] ?? c.type }}</span>
                  <div class="cp-chips">@for (s of c.subjectNames; track s) { <span class="cp-chip">{{ s }}</span> }</div>
                  <span class="cp-spacer"></span>
                  @if (scores()) {
                    <span class="cp-small">{{ t().avgMatch.replace('{n}', '' + (c.averageMatchPercent | number: '1.1-1')) }}</span>
                  }
                  <input type="search" [placeholder]="t().search" [attr.aria-label]="t().search" [value]="query()"
                         (input)="query.set($any($event.target).value)" />
                </div>
                <div class="cp-table-wrap">
                  <table class="cp-table">
                    <thead>
                      <tr>
                        <th class="num">{{ t().colNo }}</th><th>{{ t().colName }}</th><th>{{ t().colNis }}</th>
                        <th>{{ t().colFrom }}</th><th>{{ t().colChoice }}</th><th>{{ t().colSource }}</th>
                        @if (scores()) { <th>{{ t().colPriority }}</th><th class="num">{{ t().colMatch }}</th> }
                      </tr>
                    </thead>
                    <tbody>
                      @for (s of filtered(c.students); track s.studentId; let i = $index) {
                        <tr>
                          <td class="num">{{ i + 1 }}</td>
                          <td><strong>{{ s.fullName }}</strong></td>
                          <td>{{ s.studentNumber }}</td>
                          <td>{{ s.fromClassLabel ?? '-' }}</td>
                          <td>{{ s.chosenClassLabel ?? t().noChoice }}</td>
                          <td><span class="cp-badge" [class.cp-badge--primary]="s.source === 'MANUAL'">{{ sourceLabel()[s.source] ?? s.source }}</span></td>
                          @if (scores()) {
                            <td><span [class]="'cp-badge cp-badge--tier' + s.tier" [title]="tierLabel()[s.tier]">P{{ s.tier }}</span></td>
                            <td class="num">{{ s.matchPercent | number: '1.1-1' }}%</td>
                          }
                        </tr>
                      } @empty {
                        <tr><td [attr.colspan]="scores() ? 8 : 6" class="cp-muted">{{ t().noMatch }}</td></tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            }
          </section>

          <!-- versi cetak: semua kelas, satu kelas per halaman -->
          <div class="cp-print-area print-only">
            @for (c of b.classes; track c.classId) {
              <section class="print-class">
                <h2>{{ t().printTitle }} · {{ t().classPrefix }} {{ c.label }}</h2>
                <p>{{ d.cycle.name }} · {{ c.subjectNames.join(', ') }}</p>
                <table>
                  <thead><tr><th>{{ t().colNo }}</th><th>{{ t().colName }}</th><th>{{ t().colNis }}</th><th>{{ t().colFrom }}</th></tr></thead>
                  <tbody>
                    @for (s of c.students; track s.studentId; let i = $index) {
                      <tr><td>{{ i + 1 }}</td><td>{{ s.fullName }}</td><td>{{ s.studentNumber }}</td><td>{{ s.fromClassLabel ?? '-' }}</td></tr>
                    }
                  </tbody>
                </table>
              </section>
            }
          </div>
        }
      }
    } @else {
      <p class="cp-muted">{{ t().loading }}</p>
    }
  `,
  styles: `
    :host { display: grid; gap: 20px; }
    .bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px 14px;
      padding: 10px 14px;
      border-radius: 14px;
      background: var(--surface);
      border: 1px solid var(--border);
    }
    .pick { display: flex; align-items: center; gap: 8px; flex: 1 1 280px; min-width: 0; }
    .pick select { min-height: 38px; flex: 1; max-width: 460px; min-width: 0; }
    .note { margin: 0; }
    .cards { display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
    .class-card {
      display: grid;
      gap: 10px;
      align-content: start;
      padding: 14px;
      border-radius: 14px;
      border: 1px solid var(--border);
      background: var(--surface);
    }
    .class-card header { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .class-card h3 { margin: 0; font-size: 1rem; color: var(--brand-ink); }
    .class-card p { margin: 0; }
    .class-tabs { margin-bottom: 14px; }
    .size {
      display: inline-grid;
      place-items: center;
      min-width: 24px;
      margin-left: 6px;
      padding: 0 6px;
      border-radius: 999px;
      background: var(--chip-bg);
      font-size: 0.75rem;
    }
    .class-info { margin-bottom: 12px; flex-wrap: wrap; }
    .class-info input { min-height: 36px; width: min(100%, 240px); }
    .print-only { display: none; }
    @media print {
      .print-only { display: block; }
      .print-class { page-break-after: always; font-family: 'Times New Roman', serif; color: #000; }
      .print-class h2 { margin: 0 0 4px; font-size: 14pt; }
      .print-class p { margin: 0 0 10px; font-size: 10pt; }
      .print-class table { width: 100%; border-collapse: collapse; font-size: 10.5pt; }
      .print-class th, .print-class td { border: 1px solid #000; padding: 3px 6px; text-align: left; }
    }
  `,
})
export class CycleResults {
  /** null = sekolah user yang login (guru); diisi = super admin melihat sekolah tertentu. */
  readonly schoolId = input<number | null>(null);
  /** Tampilkan % kecocokan & prioritas (super admin). */
  readonly scores = input(false);

  private readonly api = inject(ViewApi);
  private readonly i18n = inject(I18n);

  readonly t = computed(() => RESULTS_TEXT[this.i18n.lang()]);
  readonly statusLabel = computed(() => CYCLE_STATUS_TEXT[this.i18n.lang()]);
  readonly typeLabel = computed(() => CLASS_TYPE_TEXT[this.i18n.lang()]);
  readonly sourceLabel = computed(() => SOURCE_TEXT[this.i18n.lang()]);
  readonly tierLabel = computed(() => TIER_TEXT[this.i18n.lang()]);

  readonly cycles = signal<CycleSummary[]>([]);
  readonly loaded = signal(false);
  readonly selectedId = signal<number | null>(null);
  readonly detail = signal<CycleDetail | null>(null);
  readonly classes = signal<ClassInfo[]>([]);
  readonly board = signal<PlacementBoard | null>(null);
  readonly active = signal<number | null>(null);
  readonly query = signal('');
  readonly error = signal<string | null>(null);

  readonly hasClasses = computed(() => WITH_CLASSES.includes(this.detail()?.cycle.status ?? '') && this.classes().length > 0);

  constructor() {
    // muat ulang kalau sekolah berganti (halaman detail super admin)
    effect(() => {
      const school = this.schoolId();
      untracked(() => this.loadCycles(school));
    });
  }

  private loadCycles(school: number | null): void {
    this.loaded.set(false);
    this.cycles.set([]);
    this.detail.set(null);
    this.api.cycles(school).subscribe({
      next: (list) => {
        this.cycles.set(list);
        this.loaded.set(true);
        if (list.length) this.select(list[0].id);
      },
      error: (e: unknown) => {
        this.loaded.set(true);
        this.error.set(problemMessage(e));
      },
    });
  }

  select(id: number): void {
    const school = this.schoolId();
    this.selectedId.set(id);
    this.error.set(null);
    this.board.set(null);
    this.classes.set([]);
    this.query.set('');
    this.api.cycle(school, id).subscribe({
      next: (d) => {
        this.detail.set(d);
        if (WITH_CLASSES.includes(d.cycle.status)) {
          this.api.classes(school, id).subscribe({ next: (c) => this.classes.set(c) });
        }
        if (WITH_BOARD.includes(d.cycle.status)) {
          this.api.placements(school, id).subscribe({
            next: (b) => {
              this.board.set(b);
              this.active.set(b.classes[0]?.classId ?? null);
            },
            error: (e: unknown) => this.error.set(problemMessage(e)),
          });
        }
      },
      error: (e: unknown) => this.error.set(problemMessage(e)),
    });
  }

  filtered<T extends { fullName: string; studentNumber: string }>(students: T[]): T[] {
    const q = this.query().trim().toLowerCase();
    return q ? students.filter((s) => s.fullName.toLowerCase().includes(q) || s.studentNumber.includes(q)) : students;
  }

  date(iso: string | null): string {
    this.i18n.lang();
    return fmtDate(iso);
  }

  print(): void {
    window.print();
  }
}
