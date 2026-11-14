import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, output, signal } from '@angular/core';

import { problemMessage, translateMessage } from '../../core/api/problem';
import { I18n } from '../../core/i18n/i18n';
import { ImportResult } from '../waka/waka-api';
import { ComponentView, SnbpApi } from './snbp-api';
import { SNBP_TEXT } from './snbp.i18n';

/** Upload leger rapor per semester dan nilai komponen tambahan. */
@Component({
  selector: 'app-snbp-upload',
  template: `
    @if (error(); as e) { <div class="cp-alert cp-alert--error">{{ e }}</div> }

    <section class="cp-card">
      <h2>{{ t().uGrades }}</h2>
      <p class="cp-sub">{{ t().uGradesHint }}</p>
      <div class="row">
        <label class="cp-field">
          <span>{{ t().semester }}</span>
          <select (change)="semester.set($any($event.target).value)">
            <option value="AUTO">{{ t().semAuto }}</option>
            @for (n of [1, 2, 3, 4, 5, 6]; track n) { <option [value]="n">{{ t().semN.replace('{n}', '' + n) }}</option> }
          </select>
        </label>
        <label class="cp-field">
          <span>{{ t().file }}</span>
          <input #gf type="file" accept=".xlsx,.xls" />
        </label>
        <button class="cp-btn cp-btn--primary" type="button" [disabled]="busy() === 'grades'" (click)="importGrades(gf)">
          {{ busy() === 'grades' ? t().importing : t().import }}
        </button>
      </div>
      @if (results()['grades']; as r) { <ng-container *ngTemplateOutlet="res; context: { $implicit: r }" /> }
    </section>

    @for (c of components(); track c.id) {
      <section class="cp-card">
        <h2>{{ t().uComponent.replace('{name}', c.name) }}</h2>
        <p class="cp-sub">{{ t().uComponentHint.replace('{name}', c.name).replace('{max}', '' + c.maxScore) }}</p>
        <div class="row">
          <label class="cp-field">
            <span>{{ t().file }}</span>
            <input #cf type="file" accept=".xlsx,.xls" />
          </label>
          <button class="cp-btn cp-btn--primary" type="button" [disabled]="busy() === 'c' + c.id" (click)="importComponent(c, cf)">
            {{ busy() === 'c' + c.id ? t().importing : t().import }}
          </button>
        </div>
        @if (results()['c' + c.id]; as r) { <ng-container *ngTemplateOutlet="res; context: { $implicit: r }" /> }
      </section>
    } @empty {
      <section class="cp-card">
        <p class="cp-muted none">{{ t().uNoComponents }}</p>
        <button class="cp-btn cp-btn--sm" type="button" (click)="goto.emit('settings')">{{ t().openSettings }}</button>
      </section>
    }

    <ng-template #res let-r>
      <div class="result">
        <div class="cp-row nums">
          <span><strong>{{ r.created }}</strong> {{ t().created }}</span>
          <span><strong>{{ r.updated }}</strong> {{ t().updated }}</span>
          <span><strong>{{ r.skipped }}</strong> {{ t().skipped }}</span>
        </div>
        @if (r.messages.length) {
          <ul class="msgs">@for (m of r.messages; track $index) { <li>{{ tr(m) }}</li> }</ul>
        }
      </div>
    </ng-template>
  `,
  imports: [NgTemplateOutlet],
  styles: `
    :host { display: grid; gap: 16px; }
    h2 { margin: 0 0 4px; }
    .cp-sub { margin: 0 0 14px; }
    .row { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 12px; }
    .row .cp-field { flex: 1 1 220px; }
    select { min-height: 40px; }
    .result { margin-top: 14px; padding: 12px 14px; border-radius: 12px; background: var(--surface-tint); }
    .nums { gap: 18px; }
    .msgs { margin: 10px 0 0; padding-left: 18px; max-height: 200px; overflow: auto; font-size: 0.88rem; }
    .none { margin: 0 0 10px; }
  `,
})
export class SnbpUpload {
  private readonly api = inject(SnbpApi);
  private readonly i18n = inject(I18n);
  readonly goto = output<'settings'>();

  readonly t = computed(() => SNBP_TEXT[this.i18n.lang()]);
  readonly semester = signal('AUTO');
  readonly components = signal<ComponentView[]>([]);
  readonly busy = signal<string | null>(null);
  readonly results = signal<Record<string, ImportResult>>({});
  readonly error = signal<string | null>(null);

  constructor() {
    this.api.settings().subscribe({
      next: (s) => this.components.set(s.components),
      error: (e: unknown) => this.error.set(problemMessage(e)),
    });
  }

  importGrades(input: HTMLInputElement): void {
    const f = input.files?.[0];
    if (!f) return;
    this.run('grades', this.api.importGrades(f, this.semester()), input);
  }

  importComponent(c: ComponentView, input: HTMLInputElement): void {
    const f = input.files?.[0];
    if (!f) return;
    this.run('c' + c.id, this.api.importComponent(c.id, f), input);
  }

  tr(m: string): string {
    this.i18n.lang();
    return translateMessage(m);
  }

  private run(key: string, req: ReturnType<SnbpApi['importGrades']>, input: HTMLInputElement): void {
    this.busy.set(key);
    this.error.set(null);
    req.subscribe({
      next: (r) => {
        this.busy.set(null);
        input.value = '';
        this.results.update((x) => ({ ...x, [key]: r }));
      },
      error: (e: unknown) => {
        this.busy.set(null);
        this.error.set(problemMessage(e));
      },
    });
  }
}
