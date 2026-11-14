import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import { I18n } from '../../../core/i18n/i18n';
import { Hero } from '../../../shared/hero/hero';
import { Icon } from '../../../shared/icon/icon';
import { CYCLE_FLOW, CYCLE_STATUS_TEXT } from '../../../shared/labels/labels';
import { ViewApi } from '../../../shared/results/view-api';
import { CycleDetail } from '../../waka/waka-api';
import { GURU_TEXT } from '../guru.i18n';

/** Beranda guru: status penjurusan terbaru dan pintasan ke hasil penjurusan. */
@Component({
  selector: 'app-guru-beranda',
  imports: [RouterLink, Hero, Icon],
  template: `
    <div class="cp-page">
      <app-hero [name]="fullName()" [subtitle]="t().role + ' · ' + (school() ?? '')">
        <div class="summary">
          <span class="summary-label">{{ t().cycleStatus }}</span>
          <strong>{{ detail() ? statusLabel()[detail()!.cycle.status] : t().noCycle }}</strong>
          @if (detail()) {
            <span class="summary-bar"><i [style.width.%]="pct(currentIndex(), flow.length - 1)"></i></span>
          }
        </div>
      </app-hero>

      @if (detail(); as d) {
        <div class="cp-kpis">
          <div class="cp-kpi"><span class="cp-kpi__top"><span class="cp-kpi__icon"><app-icon name="users" [size]="17" /></span>{{ t().students }} {{ d.cycle.cohortEntryYear }}</span><strong>{{ d.stats.students }}</strong></div>
          <div class="cp-kpi"><span class="cp-kpi__top"><span class="cp-kpi__icon"><app-icon name="clipboard" [size]="17" /></span>{{ t().submitted }}</span>
            <strong>{{ d.stats.questionnaireSubmitted }}<small> / {{ d.stats.students }}</small></strong>
            <div class="cp-bar"><i [style.width.%]="pct(d.stats.questionnaireSubmitted, d.stats.students)"></i></div></div>
          <div class="cp-kpi"><span class="cp-kpi__top"><span class="cp-kpi__icon"><app-icon name="layers" [size]="17" /></span>{{ t().classes }}</span><strong>{{ d.stats.classes }}</strong></div>
          <div class="cp-kpi"><span class="cp-kpi__top"><span class="cp-kpi__icon"><app-icon name="shuffle" [size]="17" /></span>{{ t().placed }}</span>
            <strong>{{ d.stats.placements }}<small> / {{ d.stats.students }}</small></strong>
            <div class="cp-bar"><i [style.width.%]="pct(d.stats.placements, d.stats.students)"></i></div></div>
        </div>
      }

      <div class="cp-bento">
        <section class="cp-widget span-7">
          <div class="cp-widget__head"><h2>{{ t().flowTitle }}</h2></div>
          <div class="cp-widget__section cp-widget__section--grow">
            @if (detail()) {
              <p class="cp-small cp-muted cycle-name">{{ detail()!.cycle.name }}</p>
              <ol class="flow">
                @for (s of flow; track s; let i = $index) {
                  <li [class.done]="i < currentIndex()" [class.current]="i === currentIndex()">
                    @if (i < currentIndex()) { <app-icon name="check" [size]="14" /> }
                    {{ statusLabel()[s] }}
                  </li>
                }
              </ol>
            } @else if (loaded()) {
              <p class="cp-muted">{{ t().noCycleText }}</p>
            }
          </div>
        </section>

        <section class="cp-widget span-5">
          <div class="cp-widget__head"><h2>{{ t().resultsTitle }}</h2></div>
          <div class="cp-widget__section cp-widget__section--grow next">
            <span class="next-icon"><app-icon name="layers" [size]="22" /></span>
            <p class="cp-muted">{{ t().resultsText }}</p>
            <a class="cp-btn cp-btn--primary" routerLink="/guru/hasil">{{ t().open }} <app-icon name="arrow-right" [size]="16" /></a>
          </div>
          <div class="cp-widget__section">
            <p class="cp-small cp-muted access"><app-icon name="info" [size]="16" /> {{ t().accessText }}</p>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: `
    .summary { display: grid; gap: 4px; min-width: 220px; }
    .summary-label { font-size: 0.82rem; opacity: 0.8; }
    .summary strong { font-size: 1.2rem; }
    .summary-bar { display: block; height: 6px; border-radius: 999px; background: rgb(255 255 255 / 0.2); overflow: hidden; }
    .summary-bar i { display: block; height: 100%; border-radius: inherit; background: var(--nav-accent); }
    .cp-kpi .cp-bar { height: 6px; margin-top: 4px; }
    .cycle-name { margin: 0 0 12px; }
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
    .next { display: grid; gap: 12px; justify-items: start; align-content: start; }
    .next p { margin: 0; }
    .next-icon {
      display: grid;
      place-items: center;
      width: 46px;
      height: 46px;
      border-radius: 12px;
      background: var(--primary-soft);
      color: var(--primary);
    }
    .access { display: flex; gap: 8px; margin: 0; line-height: 1.5; }
  `,
})
export class GuruBeranda {
  private readonly api = inject(ViewApi);
  private readonly auth = inject(AuthService);
  private readonly i18n = inject(I18n);

  readonly t = computed(() => GURU_TEXT[this.i18n.lang()]);
  readonly statusLabel = computed(() => CYCLE_STATUS_TEXT[this.i18n.lang()]);
  readonly flow = CYCLE_FLOW;

  readonly fullName = computed(() => this.auth.user()?.displayName ?? '');
  readonly school = computed(() => this.auth.user()?.school?.name ?? null);
  readonly detail = signal<CycleDetail | null>(null);
  readonly loaded = signal(false);
  readonly currentIndex = computed(() =>
    CYCLE_FLOW.indexOf((this.detail()?.cycle.status ?? 'DRAFT') as (typeof CYCLE_FLOW)[number]),
  );

  constructor() {
    this.api.cycles(null).subscribe({
      next: (list) => {
        if (!list.length) {
          this.loaded.set(true);
          return;
        }
        this.api.cycle(null, list[0].id).subscribe({
          next: (d) => {
            this.detail.set(d);
            this.loaded.set(true);
          },
          error: () => this.loaded.set(true),
        });
      },
      error: () => this.loaded.set(true),
    });
  }

  pct(a: number, b: number): number {
    return b ? Math.round((a / b) * 100) : 0;
  }
}
