import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { problemMessage, translateMessage } from '../../../core/api/problem';
import { I18n } from '../../../core/i18n/i18n';
import { CLASS_TYPE_TEXT, TIER_TEXT } from '../../../shared/labels/labels';
import { CycleBar } from '../cycle-bar';
import { CycleStore } from '../cycle-store';
import { ClassInfo, ClassPlanResult, WakaApi } from '../waka-api';
import { KELAS_TEXT } from './waka-kelas.i18n';

/** Simulasi kombinasi mapel per kelas, simpan sebagai kelas resmi, dan buka pemilihan kelas. */
@Component({
  selector: 'app-waka-kelas',
  imports: [ReactiveFormsModule, RouterLink, DecimalPipe, CycleBar],
  template: `
    <div class="cp-page">
      <header class="cp-head">
        <div>
          <h1>{{ t().title }}</h1>
          <p>{{ t().intro }}</p>
        </div>
      </header>

      <app-cycle-bar (changed)="reload()" />

      @if (message(); as m) {
        <div class="cp-alert" [class.cp-alert--error]="m.error" [class.cp-alert--ok]="!m.error">{{ m.text }}</div>
      }

      @if (store.detail(); as d) {
        @if (beforeSurveyClosed()) {
          <div class="cp-alert cp-alert--warn">
            {{ t().beforeClosed.replace('{done}', '' + d.stats.questionnaireSubmitted).replace('{total}', '' + d.stats.students) }}
            <a routerLink="/waka/siklus">{{ t().manageCycle }}</a>
          </div>
        }

        <!-- kelas tersimpan -->
        @if (saved().length > 0) {
          <section class="cp-card">
            <div class="cp-row">
              <div>
                <h2>{{ t().officialTitle }}</h2>
                <p class="cp-sub">{{ t().savedCount.replace('{n}', '' + saved().length) }}</p>
              </div>
              <span class="cp-spacer"></span>
              @if (d.cycle.status === 'CLASSES_GENERATED') {
                @if (confirmCancel()) {
                  <span class="cp-small">{{ t().cancelQ }}</span>
                  <button class="cp-btn cp-btn--danger cp-btn--sm" type="button" (click)="cancelClasses()">{{ t().yesCancel }}</button>
                  <button class="cp-btn cp-btn--sm" type="button" (click)="confirmCancel.set(false)">{{ t().no }}</button>
                } @else {
                  <button class="cp-btn cp-btn--danger" type="button" (click)="confirmCancel.set(true)">{{ t().cancelClasses }}</button>
                }
                <button class="cp-btn cp-btn--primary" type="button" [disabled]="busy()" (click)="openSelection()">{{ t().openSelection }}</button>
              }
            </div>
            <div class="classes">
              @for (c of saved(); track c.id) {
                <article class="class-card">
                  <header class="cp-row">
                    <h3>{{ t().classPrefix }} {{ c.label }}</h3>
                    <span class="cp-badge">{{ typeLabel()[c.type] }}</span>
                  </header>
                  <div class="cp-chips">
                    @for (s of c.subjectNames; track s) { <span class="cp-chip">{{ s }}</span> }
                  </div>
                  @if (d.cycle.status !== 'CLASSES_GENERATED') {
                    <p class="cp-small cp-muted counts">{{ t().counts.replace('{chosen}', '' + c.choiceCount).replace('{placed}', '' + c.placementCount) }}</p>
                  }
                </article>
              }
            </div>
          </section>
        }

        <!-- simulasi -->
        @if (canSimulate()) {
          <section class="cp-card">
            <h2>{{ t().simTitle }}</h2>
            <p class="cp-sub">
              {{ t().simHint.replace('{students}', '' + d.stats.students).replace('{classes}', '' + (d.classCount ?? t().auto))
                  .replace('{rules}', '' + d.subjectRules.length).replace('{pairs}', '' + d.pairRules.length) }}
              (<a routerLink="/waka/siklus">{{ t().change }}</a>).
            </p>
            <form class="cp-form" [formGroup]="form" (ngSubmit)="simulate()">
              <label class="cp-field"><span>{{ t().classCount }}</span><input type="number" min="1" formControlName="classCount" [placeholder]="t().auto" /></label>
              <label class="cp-field"><span>{{ t().minSize }}</span><input type="number" min="1" formControlName="minClassSize" [placeholder]="t().even" /></label>
              <label class="cp-field"><span>{{ t().maxSize }}</span><input type="number" min="1" formControlName="maxClassSize" [placeholder]="t().even" /></label>
              <label class="cp-field check"><input type="checkbox" formControlName="requireOneMajor2Subject" />
                <span>{{ t().requireMajor2 }}</span></label>
              <div class="cp-field cp-field--full">
                <div class="cp-row">
                  <button class="cp-btn cp-btn--primary" type="submit" [disabled]="busy()">{{ busy() ? t().computing : t().runSim }}</button>
                  <span class="cp-small cp-muted">{{ t().simTime }}</span>
                </div>
              </div>
            </form>
          </section>
        }

        @if (plan(); as p) {
          @if (p.status === 'INFEASIBLE' || p.status === 'NO_SOLUTION_IN_TIME') {
            <div class="cp-alert cp-alert--error">{{ tr(p.message) }}</div>
          } @else {
            <section class="cp-card">
              <div class="cp-row">
                <div>
                  <h2>{{ t().resultTitle }}</h2>
                  <p class="cp-sub">{{ t().resultSub.replace('{classes}', '' + p.classCount).replace('{min}', '' + p.minClassSize).replace('{max}', '' + p.maxClassSize) }}</p>
                </div>
                <span class="cp-spacer"></span>
                <button class="cp-btn cp-btn--primary" type="button" [disabled]="busy()" (click)="save()">
                  {{ saved().length ? t().replaceOfficial : t().saveOfficial }}
                </button>
              </div>

              <div class="cp-stats tiers">
                @for (tier of [1, 2, 3, 4, 5]; track tier) {
                  <div class="cp-stat">
                    <strong>{{ p.studentsPerTier[tier] ?? 0 }}</strong>
                    <span><span class="cp-badge" [class]="'cp-badge cp-badge--tier' + tier">P{{ tier }}</span> {{ tierLabel()[tier] }}</span>
                  </div>
                }
              </div>

              <div class="classes">
                @for (c of p.classes; track c.label) {
                  <article class="class-card">
                    <header class="cp-row">
                      <h3>{{ t().classPrefix }} {{ c.label }}</h3>
                      <span class="cp-badge">{{ typeLabel()[c.type] }}</span>
                      <span class="cp-spacer"></span>
                      <span class="cp-small"><strong>{{ c.size }}</strong> {{ t().students }} · {{ t().average }} {{ c.averageMatchPercent | number: '1.1-1' }}%</span>
                    </header>
                    <div class="cp-chips">
                      @for (s of c.subjects; track s) { <span class="cp-chip">{{ s }}</span> }
                    </div>
                    <button class="cp-btn cp-btn--ghost cp-btn--sm" type="button" (click)="toggle(c.label)">
                      {{ expanded().has(c.label) ? t().hideStudents : t().showStudents }}
                    </button>
                    @if (expanded().has(c.label)) {
                      <ul class="members">
                        @for (s of c.students; track s.id) {
                          <li>
                            <span>{{ s.fullName }}</span>
                            @if (s.tier) { <span [class]="'cp-badge cp-badge--tier' + s.tier">P{{ s.tier }}</span> }
                            <span class="cp-small cp-muted">{{ s.matchPercent | number: '1.1-1' }}%</span>
                          </li>
                        }
                      </ul>
                    }
                  </article>
                }
              </div>

              @if (p.studentsWithGaps.length > 0) {
                <h3 class="gap-title">{{ t().gapsTitle.replace('{n}', '' + p.studentsWithGaps.length) }}</h3>
                <div class="cp-table-wrap">
                  <table class="cp-table">
                    <thead><tr><th>{{ t().colStudent }}</th><th>{{ t().colClass }}</th><th>{{ t().colPriority }}</th><th>{{ t().colMissing1 }}</th><th>{{ t().colMissing2 }}</th></tr></thead>
                    <tbody>
                      @for (g of p.studentsWithGaps; track g.studentId) {
                        <tr>
                          <td>{{ g.fullName }}</td>
                          <td>{{ g.classLabel }}</td>
                          <td><span [class]="'cp-badge cp-badge--tier' + g.tier">P{{ g.tier }}</span></td>
                          <td>{{ g.missingMajor1Subjects.join(', ') || '-' }}</td>
                          <td>{{ g.missingMajor2Subjects.join(', ') || '-' }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </section>
          }
        }
      }
    </div>
  `,
  styles: `
    .classes {
      display: grid;
      gap: 12px;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      margin-top: 14px;
    }
    .class-card {
      display: grid;
      gap: 10px;
      align-content: start;
      padding: 14px;
      border-radius: 14px;
      border: 1px solid var(--border);
      background: var(--surface);
      h3 { margin: 0; font-size: 1rem; color: var(--brand-ink); }
      .cp-btn--ghost { justify-self: start; padding-left: 0; }
    }
    .counts { margin: 0; }
    .tiers { margin-top: 6px; }
    .tiers .cp-stat span { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .members {
      display: grid;
      gap: 4px;
      max-height: 280px;
      overflow: auto;
      margin: 0;
      padding: 0;
      list-style: none;
      font-size: 0.85rem;
      li { display: flex; gap: 8px; align-items: center; }
      li span:first-child { flex: 1; min-width: 0; }
    }
    .check { display: flex; align-items: center; gap: 8px; align-self: end; min-height: 40px; }
    .check input { width: auto; min-height: 0; }
    .gap-title { margin: 22px 0 10px; font-size: 0.95rem; color: var(--brand-ink); }
  `,
})
export class WakaKelas {
  readonly store = inject(CycleStore);
  private readonly api = inject(WakaApi);
  private readonly fb = inject(FormBuilder);

  private readonly i18n = inject(I18n);
  /** Teks sesuai bahasa aktif. */
  readonly t = computed(() => KELAS_TEXT[this.i18n.lang()]);
  readonly typeLabel = computed(() => CLASS_TYPE_TEXT[this.i18n.lang()]);
  readonly tierLabel = computed(() => TIER_TEXT[this.i18n.lang()]);

  readonly saved = signal<ClassInfo[]>([]);
  readonly plan = signal<ClassPlanResult | null>(null);
  readonly busy = signal(false);
  readonly confirmCancel = signal(false);
  readonly expanded = signal<Set<string>>(new Set());
  readonly message = signal<{ text: string; error: boolean } | null>(null);

  readonly canSimulate = computed(() => ['SURVEY_CLOSED', 'CLASSES_GENERATED'].includes(this.store.status() ?? ''));
  readonly beforeSurveyClosed = computed(() => ['DRAFT', 'SURVEY_OPEN'].includes(this.store.status() ?? ''));

  readonly form = this.fb.group({
    classCount: [null as number | null],
    minClassSize: [null as number | null],
    maxClassSize: [null as number | null],
    requireOneMajor2Subject: [false],
  });

  constructor() {
    this.store.ensure().subscribe({ next: () => this.reload(), error: (e: unknown) => this.fail(e) });
  }

  reload(): void {
    const id = this.store.selectedId();
    this.plan.set(null);
    this.confirmCancel.set(false);
    if (!id) return;
    this.api.classes(id).subscribe({ next: (c) => this.saved.set(c), error: (e: unknown) => this.fail(e) });
  }

  simulate(): void {
    const id = this.store.selectedId();
    if (!id) return;
    const v = this.form.getRawValue();
    this.busy.set(true);
    this.message.set(null);
    this.api
      .previewPlan(id, {
        classCount: v.classCount || null,
        minClassSize: v.minClassSize || null,
        maxClassSize: v.maxClassSize || null,
        requireOneMajor2Subject: !!v.requireOneMajor2Subject,
      })
      .subscribe({
        next: (p) => {
          this.busy.set(false);
          this.plan.set(p);
          this.expanded.set(new Set());
        },
        error: (e: unknown) => this.fail(e),
      });
  }

  save(): void {
    const id = this.store.selectedId();
    const p = this.plan();
    if (!id || !p) return;
    this.busy.set(true);
    this.api.saveClasses(id, p.classes.map((c) => ({ label: c.label, subjectCodes: c.subjectCodes }))).subscribe({
      next: (classes) => {
        this.busy.set(false);
        this.saved.set(classes);
        this.plan.set(null);
        this.message.set({ text: this.t().saved, error: false });
        this.store.refresh().subscribe();
      },
      error: (e: unknown) => this.fail(e),
    });
  }

  openSelection(): void {
    const id = this.store.selectedId();
    if (!id) return;
    this.busy.set(true);
    this.api.changeStatus(id, 'SELECTION_OPEN').subscribe({
      next: (d) => {
        this.busy.set(false);
        this.store.setDetail(d);
        this.message.set({ text: this.t().opened, error: false });
      },
      error: (e: unknown) => this.fail(e),
    });
  }

  cancelClasses(): void {
    const id = this.store.selectedId();
    if (!id) return;
    this.api.deleteClasses(id).subscribe({
      next: () => {
        this.saved.set([]);
        this.confirmCancel.set(false);
        this.message.set({ text: this.t().cancelled, error: false });
        this.store.refresh().subscribe();
      },
      error: (e: unknown) => this.fail(e),
    });
  }

  /** Pesan solver dari backend, diterjemahkan sesuai bahasa. */
  tr(message: string | null): string {
    this.i18n.lang();
    return message ? translateMessage(message) : '';
  }

  toggle(label: string): void {
    this.expanded.update((set) => {
      const next = new Set(set);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  private fail(e: unknown): void {
    this.busy.set(false);
    this.message.set({ text: problemMessage(e), error: true });
  }
}
