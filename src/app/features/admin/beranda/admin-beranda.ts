import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { problemMessage } from '../../../core/api/problem';
import { AuthService } from '../../../core/auth/auth.service';
import { I18n } from '../../../core/i18n/i18n';
import { Hero } from '../../../shared/hero/hero';
import { Icon } from '../../../shared/icon/icon';
import { CYCLE_STATUS_TEXT } from '../../../shared/labels/labels';
import { ADMIN_TEXT } from '../admin.i18n';
import { AdminApi, SchoolRow } from '../admin-api';

/** Beranda super admin: angka total dan progres penjurusan semua sekolah. */
@Component({
  selector: 'app-admin-beranda',
  imports: [Hero, Icon, RouterLink],
  template: `
    <div class="cp-page">
      <app-hero [name]="fullName()" [subtitle]="t().homeRole + ' · ' + t().homeSubtitle" />

      @if (error(); as e) { <div class="cp-alert cp-alert--error">{{ e }}</div> }

      <div class="cp-kpis">
        <div class="cp-kpi"><span class="cp-kpi__top"><span class="cp-kpi__icon"><app-icon name="school" [size]="17" /></span>{{ t().activeSchools }}</span>
          <strong>{{ totals().active }}<small> / {{ schools().length }}</small></strong></div>
        <div class="cp-kpi"><span class="cp-kpi__top"><span class="cp-kpi__icon"><app-icon name="users" [size]="17" /></span>{{ t().totalStudents }}</span>
          <strong>{{ totals().students }}</strong></div>
        <div class="cp-kpi"><span class="cp-kpi__top"><span class="cp-kpi__icon"><app-icon name="check-circle" [size]="17" /></span>{{ t().activatedStudents }}</span>
          <strong>{{ totals().activated }}<small> / {{ totals().students }}</small></strong>
          <div class="cp-bar"><i [style.width.%]="pct(totals().activated, totals().students)"></i></div></div>
        <div class="cp-kpi"><span class="cp-kpi__top"><span class="cp-kpi__icon"><app-icon name="user-check" [size]="17" /></span>{{ t().pendingTeachers }}</span>
          <strong>{{ totals().pending }}</strong></div>
      </div>

      <section class="cp-widget">
        <div class="cp-widget__head">
          <h2>{{ t().progressTitle }}</h2>
          <a class="cp-more" routerLink="/admin/sekolah">{{ t().manage }} <app-icon name="chevron-right" [size]="16" /></a>
        </div>
        <div class="cp-widget__section">
          <div class="cp-table-wrap">
            <table class="cp-table">
              <thead>
                <tr><th>{{ t().colSchool }}</th><th>{{ t().colCycle }}</th><th>{{ t().colSurvey }}</th>
                  <th class="num">{{ t().colStudents }}</th><th>{{ t().colAccounts }}</th></tr>
              </thead>
              <tbody>
                @for (s of schools(); track s.id) {
                  <tr class="link-row" (click)="open(s)" [class.off]="s.disabled">
                    <td>
                      <strong>{{ s.name }}</strong>
                      <div class="cp-small cp-muted">{{ s.code }}@if (s.accreditation) { · {{ t().accreditation }} {{ s.accreditation }} } @if (s.disabled) { · <span class="cp-badge cp-badge--danger">{{ t().disabled }}</span> }</div>
                    </td>
                    <td>
                      @if (s.latestCycle; as c) {
                        <div>{{ c.name }}</div>
                        <span class="cp-badge" [class.cp-badge--ok]="c.status === 'FINALIZED'" [class.cp-badge--primary]="c.status !== 'FINALIZED'">{{ statusLabel()[c.status] }}</span>
                      } @else {
                        <span class="cp-muted">{{ t().noCycle }}</span>
                      }
                    </td>
                    <td class="survey">
                      @if (s.latestCycle; as c) {
                        <span class="cp-small">{{ c.questionnaireSubmitted }} / {{ c.students }}</span>
                        <div class="cp-bar"><i [style.width.%]="pct(c.questionnaireSubmitted, c.students)"></i></div>
                      } @else { - }
                    </td>
                    <td class="num">{{ s.students }}</td>
                    <td class="cp-small">
                      {{ t().accountsLine.replace('{w}', '' + s.wakas).replace('{g}', '' + s.teachers) }}
                      @if (s.pendingTeachers) { <span class="cp-badge cp-badge--warn">{{ t().pendingLine.replace('{n}', '' + s.pendingTeachers) }}</span> }
                    </td>
                  </tr>
                } @empty {
                  <tr><td colspan="5" class="cp-empty">{{ loaded() ? t().noSchools : '…' }}</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: `
    .cp-kpi .cp-bar { height: 6px; margin-top: 4px; }
    .link-row { cursor: pointer; }
    .link-row.off td { opacity: 0.6; }
    .survey { min-width: 140px; }
    .survey .cp-bar { height: 6px; margin-top: 4px; }
  `,
})
export class AdminBeranda {
  private readonly api = inject(AdminApi);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly i18n = inject(I18n);

  readonly t = computed(() => ADMIN_TEXT[this.i18n.lang()]);
  readonly statusLabel = computed(() => CYCLE_STATUS_TEXT[this.i18n.lang()]);
  readonly fullName = computed(() => this.auth.user()?.displayName ?? '');

  readonly schools = signal<SchoolRow[]>([]);
  readonly loaded = signal(false);
  readonly error = signal<string | null>(null);

  readonly totals = computed(() => {
    const list = this.schools();
    return {
      active: list.filter((s) => !s.disabled).length,
      students: list.reduce((n, s) => n + s.students, 0),
      activated: list.reduce((n, s) => n + s.activatedStudents, 0),
      pending: list.reduce((n, s) => n + s.pendingTeachers, 0),
    };
  });

  constructor() {
    this.api.schools().subscribe({
      next: (list) => {
        this.schools.set(list);
        this.loaded.set(true);
      },
      error: (e: unknown) => {
        this.loaded.set(true);
        this.error.set(problemMessage(e));
      },
    });
  }

  open(s: SchoolRow): void {
    this.router.navigate(['/admin/sekolah', s.id]);
  }

  pct(a: number, b: number): number {
    return b ? Math.round((a / b) * 100) : 0;
  }
}
