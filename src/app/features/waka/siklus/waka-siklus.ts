import { Component, computed, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

import { problemMessage } from '../../../core/api/problem';
import { I18n } from '../../../core/i18n/i18n';
import {
  CYCLE_STATUS_TEXT,
  TRANSITION_TEXT,
  fromLocalInput,
  toLocalInput,
} from '../../../shared/labels/labels';
import { CycleBar } from '../cycle-bar';
import { CycleStore } from '../cycle-store';
import { CycleDetail, CycleSettings, Subject, WakaApi } from '../waka-api';
import { SIKLUS_TEXT } from './waka-siklus.i18n';

interface RuleRow {
  code: string;
  name: string;
  rumpun: string | null;
  min: number | null;
  max: number | null;
}

/** Pengaturan siklus: data dasar, status, bobot kecocokan, dan ketentuan jumlah kelas per mapel. */
@Component({
  selector: 'app-waka-siklus',
  imports: [ReactiveFormsModule, NgTemplateOutlet, CycleBar],
  template: `
    <div class="cp-page">
      <header class="cp-head">
        <div>
          <h1>{{ t().title }}</h1>
          <p>{{ t().intro }}</p>
        </div>
        <button class="cp-btn cp-btn--primary" type="button" (click)="startCreate()">{{ t().newCycle }}</button>
      </header>

      @if (message(); as m) {
        <div class="cp-alert" [class.cp-alert--error]="m.error" [class.cp-alert--ok]="!m.error">{{ m.text }}</div>
      }

      @if (creating()) {
        <section class="cp-card">
          <h2>{{ t().newTitle }}</h2>
          <p class="cp-sub">{{ t().newHint }}</p>
          <ng-container *ngTemplateOutlet="settingsTpl" />
          <div class="cp-row actions">
            <button class="cp-btn cp-btn--primary" type="button" [disabled]="busy()" (click)="saveSettings(true)">{{ t().create }}</button>
            <button class="cp-btn" type="button" (click)="creating.set(false)">{{ t().cancel }}</button>
          </div>
        </section>
      } @else {
        <app-cycle-bar (changed)="fill()" />
      }

      @if (!creating() && store.detail(); as d) {
        <!-- status -->
        <section class="cp-card">
          <h2>{{ t().status }}</h2>
          <p class="cp-sub">{{ t().now }} <strong>{{ statusLabel()[d.cycle.status] }}</strong></p>
          <div class="cp-row">
            @for (tr of d.allowedTransitions; track tr) {
              <button class="cp-btn" [class.cp-btn--primary]="!tr.endsWith('CLOSED')" type="button" [disabled]="busy()"
                      (click)="changeStatus(tr)">
                {{ transitionLabel()[tr] ?? tr }}
              </button>
            }
            @if (d.cycle.status === 'DRAFT') {
              <span class="cp-spacer"></span>
              @if (confirmDelete()) {
                <span class="cp-small">{{ t().deleteQ }}</span>
                <button class="cp-btn cp-btn--danger cp-btn--sm" type="button" (click)="deleteCycle()">{{ t().yesDelete }}</button>
                <button class="cp-btn cp-btn--sm" type="button" (click)="confirmDelete.set(false)">{{ t().cancel }}</button>
              } @else {
                <button class="cp-btn cp-btn--danger cp-btn--sm" type="button" (click)="confirmDelete.set(true)">{{ t().deleteCycle }}</button>
              }
            }
          </div>
          @if (d.cycle.status === 'SURVEY_OPEN') {
            <p class="cp-small cp-muted note">{{ t().surveyNote }}</p>
          }
        </section>

        <!-- pengaturan -->
        <section class="cp-card">
          <h2>{{ t().settings }}</h2>
          <p class="cp-sub">{{ t().settingsHint }}</p>
          <ng-container *ngTemplateOutlet="settingsTpl" />
          <div class="cp-row actions">
            <button class="cp-btn cp-btn--primary" type="button" [disabled]="busy() || locked()" (click)="saveSettings(false)">{{ t().saveSettings }}</button>
          </div>
        </section>

        <!-- ketentuan mapel -->
        <section class="cp-card">
          <h2>{{ t().rulesTitle }}</h2>
          <p class="cp-sub">{{ t().rulesHint }}</p>
          <div class="cp-table-wrap">
            <table class="cp-table">
              <thead>
                <tr><th>{{ t().colSubject }}</th><th>{{ t().colRumpun }}</th><th class="num">{{ t().colMin }}</th><th class="num">{{ t().colMax }}</th></tr>
              </thead>
              <tbody>
                @for (r of rules(); track r.code; let i = $index) {
                  <tr>
                    <td><strong>{{ r.name }}</strong> <span class="cp-muted cp-small">{{ r.code }}</span></td>
                    <td>{{ r.rumpun ?? t().neutral }}</td>
                    <td class="num"><input type="number" min="0" max="30" class="num-input" [value]="r.min ?? ''"
                           [disabled]="locked()" (input)="setRule(i, 'min', $any($event.target).value)" [attr.aria-label]="t().colMin" /></td>
                    <td class="num"><input type="number" min="0" max="30" class="num-input" [value]="r.max ?? ''"
                           [disabled]="locked()" (input)="setRule(i, 'max', $any($event.target).value)" [attr.aria-label]="t().colMax" /></td>
                  </tr>
                } @empty {
                  <tr><td colspan="4" class="cp-muted">{{ t().noElectives }}</td></tr>
                }
              </tbody>
            </table>
          </div>

          <h3>{{ t().pairsTitle }}</h3>
          <p class="cp-small cp-muted">{{ t().pairsHint }}</p>
          <div class="pairs">
            @for (p of pairs(); track $index; let i = $index) {
              <div class="cp-row pair">
                <span class="cp-chip">{{ nameOf(p.subjectCode) }}</span>
                <span class="cp-muted">{{ t().requiresWith }}</span>
                <span class="cp-chip">{{ nameOf(p.requiresSubjectCode) }}</span>
                @if (!locked()) {
                  <button class="cp-btn cp-btn--ghost cp-btn--sm" type="button" (click)="removePair(i)">{{ t().remove }}</button>
                }
              </div>
            }
            @if (!locked()) {
              <div class="cp-row pair-add">
                <select #a [attr.aria-label]="t().subject">
                  @for (s of electives(); track s.code) { <option [value]="s.code">{{ s.name }}</option> }
                </select>
                <span class="cp-muted">{{ t().requiresWith }}</span>
                <select #b [attr.aria-label]="t().pairSubject">
                  @for (s of electives(); track s.code) { <option [value]="s.code">{{ s.name }}</option> }
                </select>
                <button class="cp-btn cp-btn--sm" type="button" (click)="addPair(a.value, b.value)">{{ t().add }}</button>
              </div>
            }
          </div>
          <div class="cp-row actions">
            <button class="cp-btn cp-btn--primary" type="button" [disabled]="busy() || locked()" (click)="saveRules()">{{ t().saveRules }}</button>
            <span class="cp-small cp-muted">{{ t().totalMin.replace('{min}', '' + totalMin()).replace('{slots}', '' + slots()) }}</span>
          </div>
        </section>

        <!-- bobot -->
        <section class="cp-card">
          <h2>{{ t().weightsTitle }}</h2>
          <p class="cp-sub">{{ t().weightsHint }}</p>
          <form class="cp-form" [formGroup]="weightsForm" (ngSubmit)="saveWeights()">
            <label class="cp-field"><span>{{ t().wMajor }}</span><input type="number" formControlName="major" />
              <small>{{ t().wMajorRest.replace('{n}', '' + (100 - (weightsForm.value.major ?? 0))) }}</small></label>
            <label class="cp-field"><span>{{ t().wMajor1 }}</span><input type="number" formControlName="major1" />
              <small>{{ t().wMajor2.replace('{n}', '' + (100 - (weightsForm.value.major1 ?? 0))) }}</small></label>
            <label class="cp-field"><span>{{ t().wReport }}</span><input type="number" formControlName="report" /></label>
            <label class="cp-field"><span>{{ t().wAptitude }}</span><input type="number" formControlName="aptitude" /></label>
            <label class="cp-field"><span>{{ t().wInterest }}</span><input type="number" formControlName="interest" /></label>
            <div class="cp-field cp-field--full">
              <div class="cp-row">
                <button class="cp-btn cp-btn--primary" type="submit" [disabled]="busy() || locked()">{{ t().saveWeights }}</button>
                <span class="cp-small" [class.bad]="tiltSum() !== 100">{{ t().tiltSum.replace('{n}', '' + tiltSum()) }}</span>
              </div>
            </div>
          </form>
        </section>
      }
    </div>

    <ng-template #settingsTpl>
      <form class="cp-form" [formGroup]="settingsForm">
        <label class="cp-field cp-field--full"><span>{{ t().fName }}</span><input formControlName="name" maxlength="150" /></label>
        <label class="cp-field"><span>{{ t().fYear }}</span><input formControlName="targetAcademicYear" placeholder="2027/2028" /></label>
        <label class="cp-field"><span>{{ t().fCohort }}</span><input type="number" formControlName="cohortEntryYear" /></label>
        <label class="cp-field"><span>{{ t().fSurveyClose }}</span><input type="datetime-local" formControlName="surveyCloseAt" /></label>
        <label class="cp-field"><span>{{ t().fSelectionClose }}</span><input type="datetime-local" formControlName="selectionCloseAt" /></label>
        <label class="cp-field"><span>{{ t().fClassCount }}</span><input type="number" formControlName="classCount" [placeholder]="t().auto" /></label>
        <label class="cp-field"><span>{{ t().fCapacity }}</span><input type="number" formControlName="classCapacity" /></label>
      </form>
    </ng-template>
  `,
  styles: `
    .actions { margin-top: 16px; }
    .note { margin: 12px 0 0; }
    h3 { margin: 22px 0 4px; font-size: 0.95rem; color: var(--brand-ink); }
    .num-input { width: 90px; text-align: right; }
    .pairs { display: grid; gap: 8px; margin-top: 10px; }
    .pair-add select { min-height: 36px; max-width: 220px; }
    .bad { color: var(--danger); font-weight: 700; }
  `,
})
export class WakaSiklus {
  readonly store = inject(CycleStore);
  private readonly api = inject(WakaApi);
  private readonly fb = inject(FormBuilder);

  private readonly i18n = inject(I18n);
  /** Teks sesuai bahasa aktif. */
  readonly t = computed(() => SIKLUS_TEXT[this.i18n.lang()]);
  readonly statusLabel = computed(() => CYCLE_STATUS_TEXT[this.i18n.lang()]);
  readonly transitionLabel = computed(() => TRANSITION_TEXT[this.i18n.lang()]);

  readonly creating = signal(false);
  readonly busy = signal(false);
  readonly confirmDelete = signal(false);
  readonly message = signal<{ text: string; error: boolean } | null>(null);
  readonly subjects = signal<Subject[]>([]);
  readonly rules = signal<RuleRow[]>([]);
  readonly pairs = signal<{ subjectCode: string; requiresSubjectCode: string }[]>([]);

  readonly electives = computed(() => this.subjects().filter((s) => s.category === 'PILIHAN'));
  readonly locked = computed(() => this.store.status() === 'FINALIZED');
  readonly totalMin = computed(() => this.rules().reduce((sum, r) => sum + (r.min ?? 0), 0));
  readonly slots = computed(() => {
    const d = this.store.detail();
    if (!d) return 0;
    const count = d.classCount ?? Math.ceil(d.stats.students / Math.max(1, d.classCapacity));
    return count * 5;
  });

  readonly settingsForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    targetAcademicYear: ['', [Validators.required, Validators.pattern(/^\d{4}\/\d{4}$/)]],
    cohortEntryYear: [new Date().getFullYear() - 1, [Validators.required]],
    surveyCloseAt: [''],
    selectionCloseAt: [''],
    classCount: [null as number | null],
    classCapacity: [36 as number | null],
  });

  readonly weightsForm = this.fb.group({
    major: [70],
    major1: [60],
    report: [30],
    aptitude: [30],
    interest: [40],
  });

  constructor() {
    this.api.subjects().subscribe({ next: (s) => { this.subjects.set(s); this.fill(); } });
    this.store.load().subscribe({ next: () => this.fill(), error: (e: unknown) => this.fail(e) });
  }

  tiltSum(): number {
    const v = this.weightsForm.value;
    return Number(v.report ?? 0) + Number(v.aptitude ?? 0) + Number(v.interest ?? 0);
  }

  nameOf(code: string): string {
    return this.subjects().find((s) => s.code === code)?.name ?? code;
  }

  /** Isi form dari detail siklus terpilih. */
  fill(): void {
    const d = this.store.detail();
    this.confirmDelete.set(false);
    if (!d) return;
    this.settingsForm.reset({
      name: d.cycle.name,
      targetAcademicYear: d.cycle.targetAcademicYear,
      cohortEntryYear: d.cycle.cohortEntryYear,
      surveyCloseAt: toLocalInput(d.cycle.surveyCloseAt),
      selectionCloseAt: toLocalInput(d.cycle.selectionCloseAt),
      classCount: d.classCount,
      classCapacity: d.classCapacity,
    });
    this.weightsForm.reset({ ...d.weights });
    this.fillRules(d);
  }

  private fillRules(d: CycleDetail): void {
    this.rules.set(
      this.electives().map((s) => {
        const r = d.subjectRules.find((x) => x.subjectCode === s.code);
        return { code: s.code, name: s.name, rumpun: s.rumpun, min: r?.minClasses ?? null, max: r?.maxClasses ?? null };
      }),
    );
    this.pairs.set(d.pairRules.map((p) => ({ subjectCode: p.subjectCode, requiresSubjectCode: p.requiresSubjectCode })));
  }

  startCreate(): void {
    this.creating.set(true);
    this.message.set(null);
    const year = new Date().getFullYear();
    this.settingsForm.reset({
      name: this.t().defaultName.replace('{year}', `${year + 1}/${year + 2}`),
      targetAcademicYear: `${year + 1}/${year + 2}`,
      cohortEntryYear: year,
      surveyCloseAt: '',
      selectionCloseAt: '',
      classCount: null,
      classCapacity: 36,
    });
  }

  private settingsBody(): CycleSettings {
    const v = this.settingsForm.getRawValue();
    return {
      name: v.name ?? '',
      targetAcademicYear: v.targetAcademicYear ?? '',
      cohortEntryYear: Number(v.cohortEntryYear),
      surveyCloseAt: fromLocalInput(v.surveyCloseAt),
      selectionCloseAt: fromLocalInput(v.selectionCloseAt),
      classCount: v.classCount ? Number(v.classCount) : null,
      classCapacity: v.classCapacity ? Number(v.classCapacity) : null,
    };
  }

  saveSettings(create: boolean): void {
    if (this.settingsForm.invalid) {
      this.settingsForm.markAllAsTouched();
      this.message.set({ text: this.t().invalidSettings, error: true });
      return;
    }
    const id = this.store.selectedId();
    const req = create || !id ? this.api.createCycle(this.settingsBody()) : this.api.updateCycle(id, this.settingsBody());
    this.run(req, create ? this.t().created : this.t().settingsSaved, () => this.creating.set(false));
  }

  saveWeights(): void {
    const id = this.store.selectedId();
    if (!id) return;
    const v = this.weightsForm.getRawValue();
    this.run(
      this.api.updateWeights(id, {
        major: Number(v.major),
        major1: Number(v.major1),
        report: Number(v.report),
        aptitude: Number(v.aptitude),
        interest: Number(v.interest),
      }),
      this.t().weightsSaved,
    );
  }

  setRule(i: number, field: 'min' | 'max', value: string): void {
    const n = value === '' ? null : Math.max(0, Math.floor(Number(value)));
    this.rules.update((rows) => rows.map((r, idx) => (idx === i ? { ...r, [field]: n } : r)));
  }

  addPair(a: string, b: string): void {
    if (!a || !b || a === b) {
      this.message.set({ text: this.t().pickTwo, error: true });
      return;
    }
    if (this.pairs().some((p) => p.subjectCode === a && p.requiresSubjectCode === b)) return;
    this.pairs.update((list) => [...list, { subjectCode: a, requiresSubjectCode: b }]);
  }

  removePair(i: number): void {
    this.pairs.update((list) => list.filter((_, idx) => idx !== i));
  }

  saveRules(): void {
    const id = this.store.selectedId();
    if (!id) return;
    const subjectRules = this.rules()
      .filter((r) => r.min !== null || r.max !== null)
      .map((r) => ({ subjectCode: r.code, minClasses: r.min, maxClasses: r.max }));
    this.run(this.api.updateRules(id, { subjectRules, pairRules: this.pairs() }), this.t().rulesSaved);
  }

  changeStatus(target: string): void {
    const id = this.store.selectedId();
    if (!id) return;
    this.run(this.api.changeStatus(id, target), this.t().statusSaved);
  }

  deleteCycle(): void {
    const id = this.store.selectedId();
    if (!id) return;
    this.busy.set(true);
    this.api.deleteCycle(id).subscribe({
      next: () => {
        this.busy.set(false);
        this.message.set({ text: this.t().deleted, error: false });
        this.store.clear();
        this.store.load().subscribe(() => this.fill());
      },
      error: (e: unknown) => this.fail(e),
    });
  }

  private run(req: Observable<CycleDetail>, ok: string, after?: () => void): void {
    this.busy.set(true);
    this.message.set(null);
    req.subscribe({
      next: (d) => {
        this.busy.set(false);
        this.store.setDetail(d);
        this.fill();
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
