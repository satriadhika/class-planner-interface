import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';

import { problemMessage } from '../../../core/api/problem';
import { I18n } from '../../../core/i18n/i18n';
import { Icon } from '../../../shared/icon/icon';
import { fmtDate, fmtDateTime } from '../../../shared/labels/labels';
import { CycleResults } from '../../../shared/results/cycle-results';
import { ViewApi } from '../../../shared/results/view-api';
import { CycleSummary, QuestionnaireRow, StudentRow } from '../../waka/waka-api';
import { ADMIN_TEXT } from '../admin.i18n';
import { AdminApi, SchoolDetail, WakaAccount } from '../admin-api';

type Tab = 'profile' | 'waka' | 'menu' | 'data' | 'students' | 'survey';

/** Super admin: detail satu sekolah — profil & status, akun waka, menu waka, dan data sekolah (baca-saja). */
@Component({
  selector: 'app-admin-detail',
  imports: [ReactiveFormsModule, RouterLink, Icon, CycleResults],
  template: `
    <div class="cp-page">
      <a class="back cp-no-print" routerLink="/admin/sekolah"><app-icon name="arrow-left" [size]="16" /> {{ t().back }}</a>

      @if (detail(); as d) {
        <header class="cp-head cp-no-print">
          <div>
            <h1>{{ d.summary.name }}</h1>
            <p>
              <span class="code">{{ d.summary.code }}</span>
              <span class="cp-badge" [class.cp-badge--ok]="!d.summary.disabled" [class.cp-badge--danger]="d.summary.disabled">
                {{ d.summary.disabled ? t().disabled : t().active }}
              </span>
              · {{ t().accountsLine.replace('{w}', '' + d.summary.wakas).replace('{g}', '' + d.summary.teachers) }}
              · {{ d.summary.students }} {{ t().colStudents.toLowerCase() }}
              · {{ t().accreditation }} {{ d.summary.accreditation ?? '-' }}
            </p>
          </div>
        </header>

        @if (d.summary.disabled) { <div class="cp-alert cp-alert--warn cp-no-print">{{ t().disabledBanner }}</div> }
        @if (message(); as m) {
          <div class="cp-alert cp-no-print" [class.cp-alert--error]="m.error" [class.cp-alert--ok]="!m.error">{{ m.text }}</div>
        }

        <div class="cp-tabs tabs cp-no-print" role="tablist">
          @for (tb of tabs(); track tb.key) {
            <button type="button" role="tab" [attr.aria-selected]="tab() === tb.key" (click)="switchTab(tb.key)">
              {{ tb.label }} @if (tb.readOnly) { <span class="ro">{{ t().readOnly }}</span> }
            </button>
          }
        </div>

        @switch (tab()) {
          <!-- ===================== profil ===================== -->
          @case ('profile') {
            <div class="cols">
              <section class="cp-card">
                <h2>{{ t().tabProfile }}</h2>
                <form class="cp-form" [formGroup]="profile" (ngSubmit)="saveProfile()">
                  <label class="cp-field"><span>{{ t().code }}</span><input formControlName="code" maxlength="30" />
                    <small>{{ t().codeHint }}</small></label>
                  <label class="cp-field"><span>{{ t().name }}</span><input formControlName="name" maxlength="200" /></label>
                  <label class="cp-field cp-field--full"><span>{{ t().address }}</span><input formControlName="address" /></label>
                  <label class="cp-field"><span>{{ t().phone }}</span><input formControlName="phone" /></label>
                  <label class="cp-field"><span>{{ t().email }}</span><input type="email" formControlName="email" /></label>
                  <label class="cp-field"><span>{{ t().principal }}</span><input formControlName="principalName" /></label>
                  <label class="cp-field"><span>{{ t().accreditation }}</span>
                    <select formControlName="accreditation">
                      <option value="">{{ t().accreditationNone }}</option>
                      <option value="A">A</option><option value="B">B</option><option value="C">C</option>
                    </select>
                    <small>{{ t().accreditationHint }}</small></label>
                  <div class="cp-field cp-field--full">
                    <button class="cp-btn cp-btn--primary" type="submit" [disabled]="busy() || profile.invalid">{{ t().save }}</button>
                  </div>
                </form>
              </section>
              <section class="cp-card status-card">
                <h2>{{ t().disableTitle }}</h2>
                <p class="cp-sub">{{ t().disableText }}</p>
                @if (d.summary.disabled) {
                  <button class="cp-btn cp-btn--primary" type="button" [disabled]="busy()" (click)="setDisabled(false)">
                    <app-icon name="power" [size]="16" /> {{ t().enable }}
                  </button>
                } @else if (confirmDisable()) {
                  <div class="cp-row">
                    <span class="cp-small">{{ t().disableQ.replace('{name}', d.summary.name) }}</span>
                    <button class="cp-btn cp-btn--sm cp-btn--danger" type="button" [disabled]="busy()" (click)="setDisabled(true)">{{ t().yes }}</button>
                    <button class="cp-btn cp-btn--sm" type="button" (click)="confirmDisable.set(false)">{{ t().cancel }}</button>
                  </div>
                } @else {
                  <button class="cp-btn cp-btn--danger" type="button" (click)="confirmDisable.set(true)">
                    <app-icon name="power" [size]="16" /> {{ t().disable }}
                  </button>
                }
              </section>
            </div>
          }

          <!-- ===================== akun waka ===================== -->
          @case ('waka') {
            <section class="cp-card">
              <h2>{{ t().tabWaka }}</h2>
              <p class="cp-sub">{{ t().wakaIntro }}</p>
              <div class="cp-table-wrap">
                <table class="cp-table">
                  <thead>
                    <tr><th>{{ t().displayName }}</th><th>{{ t().username }}</th><th>{{ t().colLogin }}</th>
                      <th>{{ t().colStatus }}</th><th>{{ t().colLastLogin }}</th><th></th></tr>
                  </thead>
                  <tbody>
                    @for (w of d.wakas; track w.id) {
                      <tr [class.off]="w.status !== 'ACTIVE'">
                        <td>
                          @if (editWaka() === w.id) {
                            <div class="inline-form">
                              <input #n [value]="w.displayName" [attr.aria-label]="t().displayName" />
                              <input #e type="email" [value]="w.email ?? ''" [placeholder]="t().wakaEmail" [attr.aria-label]="t().wakaEmail" />
                              <div class="cp-row">
                                <button class="cp-btn cp-btn--sm cp-btn--primary" type="button" (click)="saveWaka(w, n.value, e.value)">{{ t().save }}</button>
                                <button class="cp-btn cp-btn--sm" type="button" (click)="editWaka.set(null)">{{ t().cancel }}</button>
                              </div>
                            </div>
                          } @else {
                            <strong>{{ w.displayName }}</strong><div class="cp-small cp-muted">{{ w.email ?? '-' }}</div>
                          }
                        </td>
                        <td>{{ w.username }}</td>
                        <td class="cp-small">
                          @if (w.hasPassword) { <span class="cp-chip">{{ t().viaPassword }}</span> }
                          @if (w.email) { <span class="cp-chip">{{ t().viaGoogle }}</span> }
                        </td>
                        <td><span class="cp-badge" [class.cp-badge--ok]="w.status === 'ACTIVE'">{{ w.status === 'ACTIVE' ? t().active : t().disabled }}</span></td>
                        <td class="cp-small">{{ w.lastLoginAt ? dateTime(w.lastLoginAt) : t().never }}</td>
                        <td class="end">
                          @if (resetFor() === w.id) {
                            <span class="cp-row">
                              <input #p type="password" minlength="8" [placeholder]="t().newPassword" [attr.aria-label]="t().newPassword" autocomplete="new-password" />
                              <button class="cp-btn cp-btn--sm cp-btn--primary" type="button" (click)="resetPassword(w, p.value)">{{ t().save }}</button>
                              <button class="cp-btn cp-btn--sm" type="button" (click)="resetFor.set(null)">{{ t().cancel }}</button>
                            </span>
                          } @else {
                            <button class="cp-btn cp-btn--sm cp-btn--ghost" type="button" (click)="editWaka.set(w.id)">{{ t().edit }}</button>
                            <button class="cp-btn cp-btn--sm cp-btn--ghost" type="button" (click)="resetFor.set(w.id)"><app-icon name="key" [size]="14" /> {{ t().resetPassword }}</button>
                            <button class="cp-btn cp-btn--sm" type="button" [disabled]="busy()" (click)="setWakaActive(w, w.status !== 'ACTIVE')">
                              {{ w.status === 'ACTIVE' ? t().deactivate : t().activate }}
                            </button>
                          }
                        </td>
                      </tr>
                    } @empty {
                      <tr><td colspan="6" class="cp-empty">{{ t().noWaka }}</td></tr>
                    }
                  </tbody>
                </table>
              </div>

              <h3>{{ t().addWaka }}</h3>
              <form class="cp-form" [formGroup]="waka" (ngSubmit)="createWaka()">
                <label class="cp-field"><span>{{ t().displayName }}</span><input formControlName="displayName" /></label>
                <label class="cp-field"><span>{{ t().username }}</span><input formControlName="username" autocomplete="off" /></label>
                <label class="cp-field"><span>{{ t().wakaEmail }}</span><input type="email" formControlName="email" autocomplete="off" /></label>
                <label class="cp-field"><span>{{ t().password }}</span><input type="password" formControlName="password" autocomplete="new-password" /></label>
                <div class="cp-field cp-field--full">
                  <button class="cp-btn cp-btn--primary" type="submit" [disabled]="busy() || waka.invalid || !wakaHasLogin()">
                    <app-icon name="plus" [size]="16" /> {{ t().addWaka }}
                  </button>
                </div>
              </form>
            </section>
          }

          <!-- ===================== menu waka ===================== -->
          @case ('menu') {
            <section class="cp-card">
              <h2>{{ t().tabMenu }}</h2>
              <p class="cp-sub">{{ t().menuIntro }}</p>
              <ul class="menus">
                @for (m of d.allWakaMenus; track m) {
                  <li>
                    <label class="switch-row">
                      <input type="checkbox" role="switch" [checked]="!menuOff().includes(m)" (change)="toggleMenu(m)" />
                      <span class="txt">
                        <strong>{{ t().menuLabels[m] ?? m }}</strong>
                        <small class="cp-muted">{{ t().menuHints[m] }}</small>
                      </span>
                      <span class="cp-badge" [class.cp-badge--ok]="!menuOff().includes(m)" [class.cp-badge--danger]="menuOff().includes(m)">
                        {{ menuOff().includes(m) ? t().menuOff : t().menuOn }}
                      </span>
                    </label>
                  </li>
                }
              </ul>
              <button class="cp-btn cp-btn--primary" type="button" [disabled]="busy() || !menuDirty()" (click)="saveMenus()">{{ t().menuSave }}</button>
            </section>
          }

          <!-- ===================== data (baca-saja) ===================== -->
          @case ('data') {
            <app-cycle-results [schoolId]="d.summary.id" [scores]="true" />
          }

          @case ('students') {
            <section class="cp-card">
              <div class="cp-row toolbar">
                <p class="cp-sub">{{ t().studentsIntro }}</p>
                <span class="cp-spacer"></span>
                <select (change)="year.set($any($event.target).value ? +$any($event.target).value : null)" [attr.aria-label]="t().colYear">
                  <option value="">{{ t().allYears }}</option>
                  @for (y of years(); track y) { <option [value]="y">{{ y }}</option> }
                </select>
              </div>
              <div class="cp-table-wrap">
                <table class="cp-table">
                  <thead><tr><th>{{ t().colNis }}</th><th>{{ t().colName }}</th><th>{{ t().colClass }}</th><th>{{ t().colYear }}</th><th>{{ t().colAccount }}</th></tr></thead>
                  <tbody>
                    @for (s of filteredStudents(); track s.id) {
                      <tr>
                        <td>{{ s.studentNumber }}</td><td><strong>{{ s.fullName }}</strong></td><td>{{ s.classLabel ?? '-' }}</td><td>{{ s.entryYear }}</td>
                        <td><span class="cp-badge" [class.cp-badge--ok]="s.activated">{{ s.activated ? t().accountActive : t().accountNone }}</span></td>
                      </tr>
                    } @empty {
                      <tr><td colspan="5" class="cp-empty">{{ t().noStudents }}</td></tr>
                    }
                  </tbody>
                </table>
              </div>
            </section>
          }

          @case ('survey') {
            <section class="cp-card">
              <div class="cp-row toolbar">
                <p class="cp-sub">{{ t().surveyIntro }}</p>
                <span class="cp-spacer"></span>
                @if (cycles().length) {
                  <select (change)="loadSurvey(+$any($event.target).value)" [attr.aria-label]="t().colCycle">
                    @for (c of cycles(); track c.id) { <option [value]="c.id" [selected]="c.id === surveyCycle()">{{ c.name }}</option> }
                  </select>
                }
              </div>
              <div class="cp-table-wrap">
                <table class="cp-table">
                  <thead><tr><th>{{ t().colName }}</th><th>{{ t().colClass }}</th><th>{{ t().colStatusSurvey }}</th><th>{{ t().colMajor1 }}</th><th>{{ t().colMajor2 }}</th></tr></thead>
                  <tbody>
                    @for (r of survey(); track r.studentId) {
                      <tr>
                        <td><strong>{{ r.fullName }}</strong><div class="cp-small cp-muted">{{ r.studentNumber }}</div></td>
                        <td>{{ r.classLabel ?? '-' }}</td>
                        <td><span class="cp-badge" [class.cp-badge--ok]="r.status === 'SUBMITTED'" [class.cp-badge--warn]="r.status === 'DRAFT'" [class.cp-badge--danger]="r.status === 'NOT_STARTED'">
                          {{ r.status === 'SUBMITTED' ? t().submitted : r.status === 'DRAFT' ? t().draft : t().notStarted }}</span></td>
                        <td>{{ r.major1 ?? '-' }}</td><td>{{ r.major2 ?? '-' }}</td>
                      </tr>
                    } @empty {
                      <tr><td colspan="5" class="cp-empty">{{ cycles().length ? t().noData : t().noCycle }}</td></tr>
                    }
                  </tbody>
                </table>
              </div>
            </section>
          }
        }
      } @else if (message(); as m) {
        <div class="cp-alert cp-alert--error">{{ m.text }}</div>
      }
    </div>
  `,
  styles: `
    .back { display: inline-flex; align-items: center; gap: 6px; color: var(--muted); text-decoration: none; font-weight: 600; }
    .back:hover { color: var(--primary); }
    .code { font-weight: 700; letter-spacing: 0.04em; margin-right: 6px; color: var(--brand-ink); }
    .tabs { flex-wrap: wrap; }
    .ro { margin-left: 4px; padding: 1px 6px; border-radius: 999px; background: var(--chip-bg); font-size: 0.7rem; font-weight: 600; }
    .cols { display: grid; gap: 20px; grid-template-columns: minmax(0, 2fr) minmax(260px, 1fr); align-items: start; }
    .status-card .cp-sub { margin-bottom: 14px; }
    h3 { margin: 24px 0 8px; font-size: 1rem; color: var(--brand-ink); }
    tr.off td { opacity: 0.65; }
    .end { text-align: right; white-space: nowrap; }
    .end .cp-btn + .cp-btn { margin-left: 4px; }
    .end input { width: 160px; min-height: 32px; }
    .inline-form { display: grid; gap: 6px; max-width: 280px; }
    .inline-form input { min-height: 34px; }
    .menus { display: grid; gap: 8px; margin: 0 0 18px; padding: 0; list-style: none; }
    .switch-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      border: 1px solid var(--border);
      border-radius: 12px;
      cursor: pointer;
    }
    .switch-row:hover { border-color: var(--primary); }
    .switch-row input { width: 18px; height: 18px; min-height: 0; accent-color: var(--primary); }
    .txt { display: grid; flex: 1; gap: 2px; }
    .toolbar { margin-bottom: 12px; }
    .toolbar .cp-sub { margin: 0; }
    .toolbar select { min-height: 38px; }
    @media (max-width: 900px) { .cols { grid-template-columns: 1fr; } }
  `,
})
export class AdminDetail {
  private readonly api = inject(AdminApi);
  private readonly view = inject(ViewApi);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly i18n = inject(I18n);

  readonly t = computed(() => ADMIN_TEXT[this.i18n.lang()]);
  private readonly id = Number(this.route.snapshot.paramMap.get('id'));

  readonly detail = signal<SchoolDetail | null>(null);
  readonly tab = signal<Tab>((this.route.snapshot.queryParamMap.get('tab') as Tab) || 'profile');
  readonly busy = signal(false);
  readonly message = signal<{ text: string; error: boolean } | null>(null);
  readonly confirmDisable = signal(false);
  readonly editWaka = signal<number | null>(null);
  readonly resetFor = signal<number | null>(null);
  readonly menuOff = signal<string[]>([]);

  readonly students = signal<StudentRow[]>([]);
  readonly year = signal<number | null>(null);
  readonly cycles = signal<CycleSummary[]>([]);
  readonly surveyCycle = signal<number | null>(null);
  readonly survey = signal<QuestionnaireRow[]>([]);

  readonly tabs = computed<{ key: Tab; label: string; readOnly?: boolean }[]>(() => [
    { key: 'profile', label: this.t().tabProfile },
    { key: 'waka', label: this.t().tabWaka },
    { key: 'menu', label: this.t().tabMenu },
    { key: 'data', label: this.t().tabData, readOnly: true },
    { key: 'students', label: this.t().tabStudents, readOnly: true },
    { key: 'survey', label: this.t().tabSurvey, readOnly: true },
  ]);

  readonly menuDirty = computed(() => {
    const saved = [...(this.detail()?.disabledWakaMenus ?? [])].sort().join();
    return saved !== [...this.menuOff()].sort().join();
  });

  readonly years = computed(() => [...new Set(this.students().map((s) => s.entryYear))].sort((a, b) => b - a));
  readonly filteredStudents = computed(() => {
    const y = this.year();
    return y == null ? this.students() : this.students().filter((s) => s.entryYear === y);
  });

  readonly profile = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.maxLength(30), Validators.pattern(/^[A-Za-z0-9._-]+$/)]],
    name: ['', [Validators.required, Validators.maxLength(200)]],
    address: [''],
    phone: [''],
    email: ['', Validators.email],
    principalName: [''],
    accreditation: [''],
  });

  readonly waka = this.fb.nonNullable.group({
    displayName: ['', [Validators.required, Validators.maxLength(150)]],
    username: ['', [Validators.required, Validators.maxLength(100), Validators.pattern(/^[A-Za-z0-9._@-]+$/)]],
    email: ['', Validators.email],
    password: ['', Validators.minLength(8)],
  });

  constructor() {
    this.api.school(this.id).subscribe({
      next: (d) => {
        this.apply(d);
        if (this.route.snapshot.queryParamMap.get('created')) {
          this.message.set({ text: this.t().created.replace('{name}', d.summary.name), error: false });
        }
        this.loadTab(this.tab());
      },
      error: (e: unknown) => this.fail(e),
    });
  }

  switchTab(tab: Tab): void {
    this.tab.set(tab);
    this.message.set(null);
    this.loadTab(tab);
  }

  private loadTab(tab: Tab): void {
    if (tab === 'students' && !this.students().length) {
      this.view.students(this.id).subscribe({ next: (s) => this.students.set(s), error: (e: unknown) => this.fail(e) });
    }
    if (tab === 'survey' && !this.cycles().length) {
      this.view.cycles(this.id).subscribe({
        next: (c) => {
          this.cycles.set(c);
          if (c.length) this.loadSurvey(c[0].id);
        },
        error: (e: unknown) => this.fail(e),
      });
    }
  }

  loadSurvey(cycleId: number): void {
    this.surveyCycle.set(cycleId);
    this.view.questionnaires(this.id, cycleId).subscribe({ next: (r) => this.survey.set(r), error: (e: unknown) => this.fail(e) });
  }

  wakaHasLogin(): boolean {
    const v = this.waka.getRawValue();
    return !!v.email.trim() || v.password.length >= 8;
  }

  saveProfile(): void {
    const v = this.profile.getRawValue();
    this.run(
      this.api.update(this.id, {
        code: v.code.trim(),
        name: v.name.trim(),
        address: v.address.trim() || null,
        phone: v.phone.trim() || null,
        email: v.email.trim() || null,
        principalName: v.principalName.trim() || null,
        accreditation: v.accreditation || null,
      }),
      this.t().saved,
    );
  }

  setDisabled(disabled: boolean): void {
    this.run(this.api.setDisabled(this.id, disabled), this.t().saved);
  }

  createWaka(): void {
    const v = this.waka.getRawValue();
    this.run(
      this.api.createWaka(this.id, {
        displayName: v.displayName.trim(),
        username: v.username.trim(),
        email: v.email.trim() || null,
        password: v.password || null,
      }),
      this.t().wakaCreated,
      () => this.waka.reset(),
    );
  }

  saveWaka(w: WakaAccount, name: string, email: string): void {
    if (!name.trim()) return;
    this.run(this.api.updateWaka(this.id, w.id, { displayName: name.trim(), email: email.trim() || null }), this.t().saved);
  }

  setWakaActive(w: WakaAccount, active: boolean): void {
    this.run(this.api.setWakaActive(this.id, w.id, active), this.t().saved);
  }

  resetPassword(w: WakaAccount, password: string): void {
    if (password.length < 8) {
      this.message.set({ text: this.t().password, error: true });
      return;
    }
    this.run(this.api.resetPassword(this.id, w.id, password), this.t().passwordSaved);
  }

  toggleMenu(menu: string): void {
    this.menuOff.update((list) => (list.includes(menu) ? list.filter((m) => m !== menu) : [...list, menu]));
  }

  saveMenus(): void {
    this.run(this.api.setWakaMenus(this.id, this.menuOff()), this.t().saved);
  }

  dateTime(iso: string): string {
    this.i18n.lang();
    return fmtDateTime(iso);
  }

  date(iso: string): string {
    this.i18n.lang();
    return fmtDate(iso);
  }

  private apply(d: SchoolDetail): void {
    this.detail.set(d);
    this.menuOff.set([...d.disabledWakaMenus]);
    this.confirmDisable.set(false);
    this.editWaka.set(null);
    this.resetFor.set(null);
    this.profile.setValue({
      code: d.summary.code,
      name: d.summary.name,
      address: d.address ?? '',
      phone: d.phone ?? '',
      email: d.email ?? '',
      principalName: d.principalName ?? '',
      accreditation: d.summary.accreditation ?? '',
    });
  }

  private run(req: Observable<SchoolDetail>, ok: string, after?: () => void): void {
    this.busy.set(true);
    this.message.set(null);
    req.subscribe({
      next: (d) => {
        this.busy.set(false);
        this.apply(d);
        this.message.set({ text: ok, error: false });
        after?.();
      },
      error: (e: unknown) => this.fail(e),
    });
  }

  private fail(e: unknown): void {
    this.busy.set(false);
    this.message.set({ text: problemMessage(e), error: true });
  }
}
