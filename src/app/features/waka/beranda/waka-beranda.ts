import { Component, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';

import { environment } from '../../../../environments/environment';

import { AuthService } from '../../../core/auth/auth.service';
import { problemMessage } from '../../../core/api/problem';
import { Hero } from '../../../shared/hero/hero';
import { I18n } from '../../../core/i18n/i18n';
import { Icon } from '../../../shared/icon/icon';
import { CYCLE_FLOW, CYCLE_STATUS_TEXT } from '../../../shared/labels/labels';
import { CycleBar } from '../cycle-bar';
import { CycleStore } from '../cycle-store';
import { WAKA_HOME_TEXT } from './waka-beranda.i18n';

@Component({
  selector: 'app-waka-beranda',
  imports: [RouterLink, Icon, CycleBar, Hero],
  template: `
    <div class="cp-page">
      <app-hero [name]="fullName()" [subtitle]="t().role + ' · ' + (store.detail()?.cycle?.name ?? t().defaultCycle)">
        @if (store.detail(); as d) {
          <div class="summary">
            <span class="summary-label">{{ t().cycleStatus }}</span>
            <strong>{{ statusLabel()[d.cycle.status] }}</strong>
            <span class="summary-bar"><i [style.width.%]="pct(currentIndex(), flow.length - 1)"></i></span>
          </div>
        }
      </app-hero>

      @if (error()) {
        <div class="cp-alert cp-alert--error">{{ error() }}</div>
      }

      <app-cycle-bar />

      @if (pendingTeachers() > 0) {
        <div class="cp-alert cp-alert--warn">
          <span>{{ t().pendingTeachers.replace('{n}', '' + pendingTeachers()) }}</span>
          <a class="cp-btn cp-btn--sm" routerLink="/waka/guru">{{ t().reviewTeachers }}</a>
        </div>
      }

      @if (store.detail(); as d) {
        <div class="cp-kpis">
          <div class="cp-kpi">
            <span class="cp-kpi__top"><span class="cp-kpi__icon"><app-icon name="users" [size]="17" /></span>{{ t().cohort.replace('{year}', '' + d.cycle.cohortEntryYear) }}</span>
            <strong>{{ d.stats.students }}</strong>
          </div>
          <div class="cp-kpi">
            <span class="cp-kpi__top"><span class="cp-kpi__icon"><app-icon name="clipboard" [size]="17" /></span>{{ t().submitted }}</span>
            <strong>{{ d.stats.questionnaireSubmitted }}<small> / {{ d.stats.students }}</small></strong>
            <div class="cp-bar"><i [style.width.%]="pct(d.stats.questionnaireSubmitted, d.stats.students)"></i></div>
          </div>
          <div class="cp-kpi">
            <span class="cp-kpi__top"><span class="cp-kpi__icon"><app-icon name="layers" [size]="17" /></span>{{ t().chosen }}</span>
            <strong>{{ d.stats.choices }}<small> / {{ d.stats.students }}</small></strong>
            <div class="cp-bar"><i [style.width.%]="pct(d.stats.choices, d.stats.students)"></i></div>
          </div>
          <div class="cp-kpi">
            <span class="cp-kpi__top"><span class="cp-kpi__icon"><app-icon name="shuffle" [size]="17" /></span>{{ t().placed }}</span>
            <strong>{{ d.stats.placements }}<small> / {{ d.stats.students }}</small></strong>
            <div class="cp-bar"><i [style.width.%]="pct(d.stats.placements, d.stats.students)"></i></div>
          </div>
        </div>

        <div class="cp-bento">
          <!-- ============ Langkah berikutnya + alur ============ -->
          <section class="cp-widget span-7">
            <div class="cp-widget__head">
              <h2>{{ t().nextStep }}</h2>
              <a class="cp-more" routerLink="/waka/siklus">{{ t().manageCycle }} <app-icon name="chevron-right" [size]="16" /></a>
            </div>
            @if (next(); as n) {
              <div class="cp-widget__section next">
                <span class="next-icon"><app-icon [name]="n.icon" [size]="22" /></span>
                <div class="next-text">
                  <h3>{{ n.title }}</h3>
                  <p class="cp-muted">{{ n.text }}</p>
                </div>
                <a class="cp-btn cp-btn--primary" [routerLink]="n.link">{{ n.cta }} <app-icon name="arrow-right" [size]="16" /></a>
              </div>
            }
            <div class="cp-widget__section cp-widget__section--grow">
              <ol class="flow">
                @for (s of flow; track s; let i = $index) {
                  <li [class.done]="i < currentIndex()" [class.current]="i === currentIndex()">
                    @if (i < currentIndex()) { <app-icon name="check" [size]="14" /> }
                    {{ statusLabel()[s] }}
                  </li>
                }
              </ol>
            </div>
          </section>

          <!-- ============ Kuesioner ============ -->
          <section class="cp-widget span-5">
            <div class="cp-widget__head">
              <h2>{{ t().survey }}</h2>
              <a class="cp-more" routerLink="/waka/kuesioner">{{ t().monitor }} <app-icon name="chevron-right" [size]="16" /></a>
            </div>
            <div class="cp-widget__section cp-widget__section--grow ring-row">
              <div class="cp-ring" [style.--p]="pct(d.stats.questionnaireSubmitted, d.stats.students)">
                <div><strong>{{ pct(d.stats.questionnaireSubmitted, d.stats.students) }}%</strong><span>{{ t().sent }}</span></div>
              </div>
              <ul class="legend">
                <li><i class="ok"></i>{{ t().legendSent }} <b>{{ d.stats.questionnaireSubmitted }}</b></li>
                <li><i class="warn"></i>{{ t().legendDraft }} <b>{{ d.stats.questionnaireDraft }}</b></li>
                <li><i class="bad"></i>{{ t().legendNotStarted }} <b>{{ notStarted() }}</b></li>
              </ul>
            </div>
          </section>

          <!-- ============ Kelengkapan data ============ -->
          <section class="cp-widget span-7">
            <div class="cp-widget__head"><h2>{{ t().dataTitle }}</h2></div>
            <div class="cp-widget__section">
              <ul class="cp-shortcuts two-col">
                <li><a class="cp-shortcut" routerLink="/waka/pengguna"><span><app-icon name="users" [size]="18" /></span><span>{{ t().students }}</span><app-icon name="chevron-right" [size]="16" /></a></li>
                <li><a class="cp-shortcut" routerLink="/waka/master"><span><app-icon name="database" [size]="18" /></span><span>{{ t().subjects }}</span><app-icon name="chevron-right" [size]="16" /></a></li>
                <li><a class="cp-shortcut" routerLink="/waka/upload"><span><app-icon name="upload" [size]="18" /></span><span>{{ t().grades }}</span><app-icon name="chevron-right" [size]="16" /></a></li>
                <li><a class="cp-shortcut" routerLink="/waka/surat"><span><app-icon name="file-pen" [size]="18" /></span><span>{{ t().letterhead }}</span><app-icon name="chevron-right" [size]="16" /></a></li>
              </ul>
            </div>
          </section>

          <!-- ============ Jadwal ============ -->
          <section class="cp-widget span-5">
            <div class="cp-widget__head"><h2>{{ t().scheduleTitle }}</h2></div>
            <div class="cp-widget__section">
              <dl class="facts">
                <div><dt>{{ t().surveyClose }}</dt><dd>{{ fmt(d.cycle.surveyCloseAt) }}</dd></div>
                <div><dt>{{ t().selectionClose }}</dt><dd>{{ fmt(d.cycle.selectionCloseAt) }}</dd></div>
                <div><dt>{{ t().academicYear }}</dt><dd>{{ d.cycle.targetAcademicYear }}</dd></div>
                <div><dt>{{ t().capacity }}</dt><dd>{{ t().capacityValue.replace('{n}', '' + d.classCapacity) }}{{ d.classCount ? ' · ' + t().classes.replace('{n}', '' + d.classCount) : '' }}</dd></div>
              </dl>
            </div>
          </section>
        </div>
      } @else if (store.loaded()) {
        <div class="cp-empty">
          {{ t().emptyBefore }} <a routerLink="/waka/siklus">{{ t().emptyLink }}</a>.
        </div>
      }
    </div>
  `,
  styles: `
    .summary { display: grid; gap: 4px; min-width: 220px; }
    .summary-label { font-size: 0.82rem; opacity: 0.8; }
    .summary strong { font-size: 1.2rem; }
    .summary-bar { display: block; height: 6px; border-radius: 999px; background: rgb(255 255 255 / 0.2); overflow: hidden; }
    .summary-bar i { display: block; height: 100%; border-radius: inherit; background: var(--nav-accent); }
    .cp-kpi .cp-bar { height: 6px; margin-top: 4px; }
    .next { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
    .next-icon {
      display: grid;
      place-items: center;
      flex: none;
      width: 46px;
      height: 46px;
      border-radius: 12px;
      background: var(--primary-soft);
      color: var(--primary);
    }
    .next-text { flex: 1 1 220px; }
    .next-text h3 { margin: 0; font-size: 1.1rem; color: var(--brand-ink); }
    .next-text p { margin: 4px 0 0; }
    .flow { display: flex; flex-wrap: wrap; gap: 8px; margin: 0; padding: 0; list-style: none; }
    .flow li {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 5px 12px;
      border-radius: 999px;
      border: 1px solid var(--border);
      color: var(--muted);
      font-size: 0.82rem;
      font-weight: 600;
    }
    .flow li.done { border-color: transparent; background: var(--success-soft); color: var(--success); }
    .flow li.current { border-color: var(--primary); background: var(--primary); color: #fff; }
    .ring-row { display: flex; align-items: center; gap: 24px; }
    .legend { display: grid; gap: 10px; flex: 1; margin: 0; padding: 0; list-style: none; }
    .legend li { display: flex; align-items: center; gap: 8px; }
    .legend b { margin-left: auto; font-variant-numeric: tabular-nums; }
    .legend i { width: 10px; height: 10px; border-radius: 3px; }
    .legend i.ok { background: var(--success-bar); }
    .legend i.warn { background: var(--warn); }
    .legend i.bad { background: var(--danger); }
    .two-col { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
    .facts { display: grid; gap: 12px; margin: 0; }
    .facts div { display: flex; justify-content: space-between; gap: 12px; }
    .facts dt { color: var(--muted); }
    .facts dd { margin: 0; font-weight: 600; text-align: right; }
    @media (max-width: 640px) { .ring-row { flex-direction: column; align-items: stretch; } .ring-row .cp-ring { align-self: center; } }
  `,
})
export class WakaBeranda {
  readonly store = inject(CycleStore);
  private readonly auth = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly i18n = inject(I18n);
  readonly flow = CYCLE_FLOW;
  /** Teks halaman & label status sesuai bahasa. */
  readonly t = computed(() => WAKA_HOME_TEXT[this.i18n.lang()]);
  readonly statusLabel = computed(() => CYCLE_STATUS_TEXT[this.i18n.lang()]);
  readonly error = signal<string | null>(null);

  readonly fullName = computed(() => this.auth.user()?.displayName ?? '');
  readonly currentIndex = computed(() => CYCLE_FLOW.indexOf((this.store.status() ?? 'DRAFT') as (typeof CYCLE_FLOW)[number]));
  readonly next = computed(() => this.t().next[this.store.status() ?? ''] ?? null);
  readonly notStarted = computed(() => {
    const st = this.store.detail()?.stats;
    return st ? Math.max(0, st.students - st.questionnaireSubmitted - st.questionnaireDraft) : 0;
  });

  /** Guru yang menunggu persetujuan (menu Data guru bisa dimatikan super admin → abaikan error). */
  readonly pendingTeachers = signal(0);

  constructor() {
    if (!(this.auth.user()?.disabledMenus ?? []).includes('DATA_GURU')) {
      this.http.get<{ status: string }[]>(`${environment.apiUrl}/waka/teachers`).subscribe({
        next: (rows) => this.pendingTeachers.set(rows.filter((r) => r.status === 'PENDING').length),
        error: () => undefined,
      });
    }
    this.store.load().subscribe({ error: (e: unknown) => this.error.set(problemMessage(e)) });
  }

  pct(a: number, b: number): number {
    return b ? Math.round((a / b) * 100) : 0;
  }

  fmt(iso: string | null): string {
    return this.i18n.dateTime(iso) ?? this.t().notSet;
  }
}
