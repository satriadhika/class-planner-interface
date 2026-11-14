import { Component, computed, inject, signal } from '@angular/core';

import { problemMessage } from '../../core/api/problem';
import { I18n } from '../../core/i18n/i18n';
import { Icon } from '../../shared/icon/icon';
import { ComponentView, SnbpApi, SnbpSettings } from './snbp-api';
import { SNBP_TEXT } from './snbp.i18n';

/** Pengaturan perhitungan: akreditasi, angkatan, semester, mapel, bobot & komponen tambahan. */
@Component({
  selector: 'app-snbp-settings',
  imports: [Icon],
  template: `
    @if (message(); as m) {
      <div class="cp-alert" [class.cp-alert--error]="m.error" [class.cp-alert--ok]="!m.error">{{ m.text }}</div>
    }

    @if (data(); as d) {
      <div class="grid">
        <!-- akreditasi & angkatan -->
        <section class="cp-card">
          <h2>{{ t().sAccreditation }}</h2>
          <p class="cp-sub">{{ t().sAccreditationHint }}</p>
          <div class="seg" role="radiogroup" [attr.aria-label]="t().sAccreditation">
            @for (a of ['A', 'B', 'C']; track a) {
              <button type="button" role="radio" [attr.aria-checked]="accreditation() === a" (click)="accreditation.set(a)">
                {{ a }} <small>{{ a === 'A' ? '40%' : a === 'B' ? '25%' : '5%' }}</small>
              </button>
            }
          </div>
          <label class="check"><input type="checkbox" [checked]="erapor()" (change)="erapor.set(!erapor())" /> {{ t().sErapor }}</label>
          <p class="quota">{{ t().quota }}: <strong>{{ quota() }}</strong> · {{ t().quotaOf.replace('{p}', '' + quotaPercent()).replace('{n}', '' + d.cohortSize) }}</p>

          <label class="cp-field">
            <span>{{ t().sCohort }}</span>
            <select (change)="cohort.set(+$any($event.target).value)">
              @for (y of cohortOptions(); track y) { <option [value]="y" [selected]="y === cohort()">{{ y }}</option> }
            </select>
          </label>
        </section>

        <!-- semester -->
        <section class="cp-card">
          <h2>{{ t().sSemesters }}</h2>
          <p class="cp-sub">{{ t().sSemestersHint }}</p>
          <ul class="sems">
            @for (c of d.coverage; track c.semester) {
              <li>
                <label class="check">
                  <input type="checkbox" [checked]="semesters().includes(c.semester)" (change)="toggleSemester(c.semester)" />
                  {{ t().semN.replace('{n}', '' + c.semester) }}
                  <span class="cp-small cp-muted">{{ t().studentsShort.replace('{n}', '' + c.students) }}</span>
                </label>
              </li>
            }
          </ul>
        </section>

        <!-- mapel -->
        <section class="cp-card span">
          <div class="head">
            <div>
              <h2>{{ t().sSubjects }}</h2>
              <p class="cp-sub">{{ t().sSubjectsHint }}</p>
            </div>
            @if (d.subjects.length) {
              <div class="cp-row">
                <span class="cp-small cp-muted">{{ t().selectedCount.replace('{n}', '' + chosen().length).replace('{t}', '' + d.subjects.length) }}</span>
                <button class="cp-btn cp-btn--sm" type="button" (click)="chosen.set(allKeys())">{{ t().selectAll }}</button>
                <button class="cp-btn cp-btn--sm cp-btn--ghost" type="button" (click)="chosen.set([])">{{ t().selectNone }}</button>
              </div>
            }
          </div>
          @if (d.subjects.length) {
            <ul class="subjects">
              @for (s of d.subjects; track s.key) {
                <li>
                  <label class="check" [class.on]="chosen().includes(s.key)">
                    <input type="checkbox" [checked]="chosen().includes(s.key)" (change)="toggleSubject(s.key)" />
                    <span class="name">{{ s.name }}</span>
                    <span class="cp-small cp-muted">{{ s.students }}</span>
                  </label>
                </li>
              }
            </ul>
          } @else {
            <div class="cp-empty">{{ t().noSubjects }}</div>
          }
        </section>

        <!-- bobot -->
        <section class="cp-card span">
          <h2>{{ t().sWeights }}</h2>
          <p class="cp-sub">{{ t().sWeightsHint }}</p>
          <div class="weights">
            <label class="cp-field w-rapor">
              <span>{{ t().raporWeight }}</span>
              <input type="number" min="0" max="100" [value]="raporWeight()" (input)="raporWeight.set(+$any($event.target).value)" />
            </label>

            @for (c of d.components; track c.id) {
              <div class="comp">
                <label class="cp-field"><span>{{ t().compName }}</span><input #n [value]="c.name" maxlength="60" /></label>
                <label class="cp-field"><span>{{ t().compWeight }}</span>
                  <input #w type="number" min="0" max="100" [value]="c.weight" (input)="draftWeight(c.id, +w.value)" /></label>
                <label class="cp-field"><span>{{ t().compMax }}</span><input #m type="number" min="1" [value]="c.maxScore" /></label>
                <div class="actions">
                  <span class="cp-small cp-muted">{{ t().compStudents.replace('{n}', '' + c.students) }}</span>
                  @if (confirmRemove() === c.id) {
                    <span class="cp-small">{{ t().removeQ.replace('{name}', c.name) }}</span>
                    <button class="cp-btn cp-btn--sm cp-btn--danger" type="button" (click)="removeComponent(c)">{{ t().yes }}</button>
                    <button class="cp-btn cp-btn--sm" type="button" (click)="confirmRemove.set(null)">{{ t().cancel }}</button>
                  } @else {
                    <button class="cp-btn cp-btn--sm cp-btn--primary" type="button" [disabled]="busy()"
                            (click)="saveComponent(c, n.value, +w.value, +m.value)">{{ t().saveComponent }}</button>
                    <button class="cp-btn cp-btn--sm cp-btn--ghost" type="button" (click)="confirmRemove.set(c.id)">{{ t().remove }}</button>
                  }
                </div>
              </div>
            }

            <button class="cp-btn cp-btn--sm add" type="button" [disabled]="busy()" (click)="addComponent()">
              <app-icon name="plus" [size]="15" /> {{ t().addComponent }}
            </button>
          </div>
          <p class="total" [class.bad]="totalWeight() !== 100">
            {{ t().total.replace('{n}', '' + totalWeight()) }} @if (totalWeight() !== 100) { · {{ t().totalBad }} }
          </p>
        </section>
      </div>

      <div class="savebar">
        <button class="cp-btn cp-btn--primary" type="button" [disabled]="busy() || semesters().length === 0" (click)="save()">{{ t().saveSettings }}</button>
      </div>
    }
  `,
  styles: `
    :host { display: grid; gap: 16px; }
    .grid { display: grid; gap: 16px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .span { grid-column: 1 / -1; }
    h2 { margin: 0 0 4px; }
    .cp-sub { margin: 0 0 14px; }
    .seg { display: inline-flex; gap: 6px; margin-bottom: 12px; }
    .seg button {
      min-width: 72px;
      padding: 8px 14px;
      border: 1px solid var(--border);
      border-radius: 10px;
      background: var(--surface);
      color: var(--brand-ink);
      font: inherit;
      font-weight: 700;
      cursor: pointer;
    }
    .seg button small { font-weight: 500; opacity: 0.7; }
    .seg button[aria-checked='true'] { border-color: var(--primary); background: var(--primary); color: #fff; }
    .check { display: flex; align-items: center; gap: 8px; font-size: 0.92rem; cursor: pointer; }
    .check input { width: 17px; height: 17px; min-height: 0; accent-color: var(--primary); }
    .quota { margin: 12px 0 16px; }
    .sems { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; }
    .head { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 12px; align-items: flex-start; }
    .subjects {
      display: grid;
      gap: 6px;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .subjects .check { padding: 8px 10px; border: 1px solid var(--border); border-radius: 10px; }
    .subjects .check.on { border-color: var(--primary); background: var(--primary-soft); }
    .subjects .name { flex: 1; }
    .weights { display: grid; gap: 12px; }
    .w-rapor { max-width: 220px; }
    .comp {
      display: grid;
      gap: 10px;
      grid-template-columns: minmax(140px, 2fr) minmax(90px, 1fr) minmax(110px, 1fr);
      padding: 12px;
      border: 1px solid var(--border);
      border-radius: 12px;
    }
    .comp .actions { grid-column: 1 / -1; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
    .comp .actions > .cp-small:first-child { flex: 1; }
    .add { justify-self: start; }
    .total { margin: 14px 0 0; font-weight: 700; color: var(--success); }
    .total.bad { color: var(--danger); }
    .savebar { position: sticky; bottom: 0; padding: 12px 0; background: linear-gradient(transparent, var(--bg) 40%); }
    @media (max-width: 860px) {
      .grid { grid-template-columns: 1fr; }
      .comp { grid-template-columns: 1fr; }
    }
  `,
})
export class SnbpSettingsPanel {
  private readonly api = inject(SnbpApi);
  private readonly i18n = inject(I18n);

  readonly t = computed(() => SNBP_TEXT[this.i18n.lang()]);
  readonly data = signal<SnbpSettings | null>(null);
  readonly busy = signal(false);
  readonly message = signal<{ text: string; error: boolean } | null>(null);
  readonly confirmRemove = signal<number | null>(null);

  // draf yang diubah di layar
  readonly accreditation = signal<string | null>(null);
  readonly erapor = signal(false);
  readonly cohort = signal<number>(0);
  readonly semesters = signal<number[]>([]);
  readonly chosen = signal<string[]>([]);
  readonly raporWeight = signal(100);
  private readonly componentWeights = signal<Record<number, number>>({});

  readonly allKeys = computed(() => (this.data()?.subjects ?? []).map((s) => s.key));
  readonly cohortOptions = computed(() => {
    const d = this.data();
    if (!d) return [];
    return [...new Set([d.cohortEntryYear, ...d.cohortOptions])].sort((a, b) => b - a);
  });
  readonly quotaPercent = computed(() => {
    const base = { A: 40, B: 25, C: 5 }[this.accreditation() ?? ''] ?? 0;
    return base ? base + (this.erapor() ? 5 : 0) : 0;
  });
  readonly quota = computed(() => Math.floor(((this.data()?.cohortSize ?? 0) * this.quotaPercent()) / 100));
  readonly totalWeight = computed(() => {
    const w = this.componentWeights();
    return this.raporWeight() + (this.data()?.components ?? []).reduce((n, c) => n + (w[c.id] ?? c.weight), 0);
  });

  constructor() {
    this.api.settings().subscribe({ next: (d) => this.apply(d), error: (e: unknown) => this.fail(e) });
  }

  toggleSemester(s: number): void {
    this.semesters.update((l) => (l.includes(s) ? l.filter((x) => x !== s) : [...l, s].sort()));
  }

  toggleSubject(key: string): void {
    this.chosen.update((l) => (l.includes(key) ? l.filter((x) => x !== key) : [...l, key]));
  }

  draftWeight(id: number, weight: number): void {
    this.componentWeights.update((w) => ({ ...w, [id]: weight }));
  }

  save(): void {
    const all = this.chosen().length === this.allKeys().length;
    this.run(
      this.api.saveSettings({
        accreditation: this.accreditation(),
        cohortEntryYear: this.cohort() || null,
        semesters: this.semesters(),
        subjects: all ? [] : this.chosen(),
        raporWeight: this.raporWeight(),
        eraporBonus: this.erapor(),
      }),
      this.t().saved,
    );
  }

  addComponent(): void {
    this.run(this.api.addComponent({ name: this.t().newComponentName, weight: 0, maxScore: 1000 }), this.t().componentSaved);
  }

  saveComponent(c: ComponentView, name: string, weight: number, max: number): void {
    if (!name.trim() || !(max > 0)) return;
    this.run(this.api.updateComponent(c.id, { name: name.trim(), weight, maxScore: max }), this.t().componentSaved);
  }

  removeComponent(c: ComponentView): void {
    this.run(this.api.deleteComponent(c.id), this.t().componentRemoved);
  }

  private apply(d: SnbpSettings): void {
    this.data.set(d);
    this.accreditation.set(d.accreditation);
    this.erapor.set(d.eraporBonus);
    this.cohort.set(d.cohortEntryYear);
    this.semesters.set([...d.semesters]);
    this.chosen.set(d.subjects.filter((s) => s.selected).map((s) => s.key));
    this.raporWeight.set(d.raporWeight);
    this.componentWeights.set({});
    this.confirmRemove.set(null);
  }

  private run(req: ReturnType<SnbpApi['settings']>, ok: string): void {
    this.busy.set(true);
    this.message.set(null);
    req.subscribe({
      next: (d) => {
        this.busy.set(false);
        this.apply(d);
        this.message.set({ text: ok, error: false });
      },
      error: (e: unknown) => this.fail(e),
    });
  }

  private fail(e: unknown): void {
    this.busy.set(false);
    this.message.set({ text: problemMessage(e), error: true });
  }
}
