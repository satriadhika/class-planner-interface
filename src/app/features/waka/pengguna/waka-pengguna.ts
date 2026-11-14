import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

import { problemMessage, translateMessage } from '../../../core/api/problem';
import { I18n } from '../../../core/i18n/i18n';
import { fmtDate } from '../../../shared/labels/labels';
import { ImportResult, StudentRow, WakaApi } from '../waka-api';
import { PENGGUNA_TEXT } from './waka-pengguna.i18n';

/** Data murid: daftar, tambah/ubah/hapus, impor dari Excel. */
@Component({
  selector: 'app-waka-pengguna',
  imports: [ReactiveFormsModule],
  template: `
    <div class="cp-page">
      <header class="cp-head">
        <div>
          <h1>{{ t().title }}</h1>
          <p>{{ t().intro }}</p>
        </div>
      </header>

      @if (message(); as m) {
        <div class="cp-alert" [class.cp-alert--error]="m.error" [class.cp-alert--ok]="!m.error">{{ m.text }}</div>
      }

      <div class="cp-grid two">
        <!-- ===================== form ===================== -->
        <section class="cp-card">
          <h2>{{ editId() ? t().editStudent : t().addStudent }}</h2>
          <form class="cp-form" [formGroup]="form" (ngSubmit)="save()">
            <div class="cp-grid cols2">
              <label class="cp-field">
                <span>{{ t().nis }}</span>
                <input formControlName="studentNumber" inputmode="numeric" [readonly]="!!editId()" />
              </label>
              <label class="cp-field">
                <span>{{ t().nisn }}</span>
                <input formControlName="nisn" inputmode="numeric" />
              </label>
            </div>
            <label class="cp-field">
              <span>{{ t().fullName }}</span>
              <input formControlName="fullName" />
            </label>
            <div class="cp-grid cols3">
              <label class="cp-field">
                <span>{{ t().birthDate }}</span>
                <input type="date" formControlName="birthDate" />
              </label>
              <label class="cp-field">
                <span>{{ t().entryYear }}</span>
                <input type="number" formControlName="entryYear" />
              </label>
              <label class="cp-field">
                <span>{{ t().currentClass }}</span>
                <input formControlName="classLabel" placeholder="X-1" />
              </label>
            </div>
            <div class="cp-row">
              <button class="cp-btn cp-btn--primary" type="submit" [disabled]="busy() || form.invalid">{{ t().save }}</button>
              @if (editId()) { <button class="cp-btn" type="button" (click)="reset()">{{ t().cancel }}</button> }
            </div>
          </form>
        </section>

        <!-- ===================== impor ===================== -->
        <section class="cp-card">
          <h2>{{ t().importTitle }}</h2>
          <p class="cp-sub">{{ t().importHintA }} <strong>NIS</strong> {{ t().and }} <strong>NAMA SISWA</strong>. {{ t().importHintB }}</p>
          <div class="cp-form">
            <label class="cp-field">
              <span>{{ t().importYear }}</span>
              <input type="number" [value]="importYear() ?? ''" (input)="importYear.set(numOrNull($any($event.target).value))" />
            </label>
            <label class="cp-field">
              <span>{{ t().file }}</span>
              <input type="file" accept=".xlsx,.xls" (change)="pick($event)" />
            </label>
            <div class="cp-row">
              <button class="cp-btn cp-btn--primary" type="button" [disabled]="busy() || !file()" (click)="importFile()">
                {{ busy() ? t().importing : t().import }}
              </button>
            </div>
          </div>
          @if (result(); as r) {
            <div class="cp-stats result">
              <div class="cp-stat"><strong>{{ r.created }}</strong><span>{{ t().created }}</span></div>
              <div class="cp-stat"><strong>{{ r.updated }}</strong><span>{{ t().updated }}</span></div>
              <div class="cp-stat"><strong>{{ r.skipped }}</strong><span>{{ t().skipped }}</span></div>
            </div>
            @if (r.messages.length) {
              <ul class="msgs cp-small">@for (m of r.messages; track $index) { <li>{{ tr(m) }}</li> }</ul>
            }
          }
        </section>
      </div>

      <!-- ===================== daftar ===================== -->
      <section class="cp-card">
        <div class="cp-row">
          <h2>{{ t().listTitle.replace('{n}', '' + filtered().length) }}</h2>
          <span class="cp-spacer"></span>
          <select (change)="year.set(numOrNull($any($event.target).value))" [attr.aria-label]="t().filterYear">
            <option value="" [selected]="year() === null">{{ t().allYears }}</option>
            @for (y of years(); track y) { <option [value]="y" [selected]="year() === y">{{ t().yearOption.replace('{y}', '' + y) }}</option> }
          </select>
          <input class="search" type="search" [placeholder]="t().search" [value]="query()" (input)="query.set($any($event.target).value)" [attr.aria-label]="t().searchAria" />
        </div>
        <div class="cp-table-wrap">
          <table class="cp-table">
            <thead><tr><th>{{ t().nis }}</th><th>{{ t().colName }}</th><th>{{ t().colClass }}</th><th>{{ t().colYear }}</th><th>{{ t().colBirth }}</th><th>{{ t().colAccount }}</th><th></th></tr></thead>
            <tbody>
              @for (s of filtered(); track s.id) {
                <tr>
                  <td>{{ s.studentNumber }}</td>
                  <td><strong>{{ s.fullName }}</strong>@if (s.nisn) { <div class="cp-small cp-muted">NISN {{ s.nisn }}</div> }</td>
                  <td>{{ s.classLabel ?? '-' }}</td>
                  <td>{{ s.entryYear }}</td>
                  <td>{{ date(s.birthDate) }}</td>
                  <td><span class="cp-badge" [class.cp-badge--ok]="s.activated">{{ s.activated ? t().active : t().notActivated }}</span></td>
                  <td class="end">
                    @if (confirmDelete() === s.id) {
                      <span class="cp-small">{{ t().deleteQ }}</span>
                      <button class="cp-btn cp-btn--sm cp-btn--danger" type="button" (click)="remove(s)">{{ t().yes }}</button>
                      <button class="cp-btn cp-btn--sm" type="button" (click)="confirmDelete.set(null)">{{ t().no }}</button>
                    } @else {
                      <button class="cp-btn cp-btn--sm cp-btn--ghost" type="button" (click)="edit(s)">{{ t().edit }}</button>
                      <button class="cp-btn cp-btn--sm cp-btn--ghost" type="button" (click)="confirmDelete.set(s.id)">{{ t().remove }}</button>
                    }
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="7" class="cp-empty">{{ t().empty }}</td></tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `,
  styles: `
    .two { grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); align-items: start; }
    .cols2 { grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); }
    .cols3 { grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); }
    .end { text-align: right; white-space: nowrap; }
    .search { min-height: 38px; width: min(260px, 100%); }
    select { min-height: 38px; }
    .result { margin-top: 14px; }
    .msgs { margin: 10px 0 0; padding-left: 18px; max-height: 180px; overflow: auto; }
  `,
})
export class WakaPengguna {
  private readonly api = inject(WakaApi);
  private readonly fb = inject(FormBuilder);
  private readonly i18n = inject(I18n);
  /** Teks sesuai bahasa aktif. */
  readonly t = computed(() => PENGGUNA_TEXT[this.i18n.lang()]);

  readonly students = signal<StudentRow[]>([]);
  readonly year = signal<number | null>(null);
  readonly query = signal('');
  readonly editId = signal<number | null>(null);
  readonly confirmDelete = signal<number | null>(null);
  readonly busy = signal(false);
  readonly message = signal<{ text: string; error: boolean } | null>(null);
  readonly file = signal<File | null>(null);
  readonly importYear = signal<number | null>(new Date().getFullYear());
  readonly result = signal<ImportResult | null>(null);

  readonly years = computed(() => [...new Set(this.students().map((s) => s.entryYear))].sort((a, b) => b - a));
  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const y = this.year();
    return this.students().filter(
      (s) => (y === null || s.entryYear === y) && (!q || s.fullName.toLowerCase().includes(q) || s.studentNumber.includes(q)),
    );
  });

  readonly form = this.fb.nonNullable.group({
    studentNumber: ['', [Validators.required, Validators.maxLength(30)]],
    nisn: [''],
    fullName: ['', [Validators.required, Validators.maxLength(150)]],
    birthDate: ['', Validators.required],
    entryYear: [new Date().getFullYear(), [Validators.required, Validators.min(2000), Validators.max(2100)]],
    classLabel: [''],
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.api.students().subscribe({ next: (s) => this.students.set(s), error: (e: unknown) => this.fail(e) });
  }

  edit(s: StudentRow): void {
    this.editId.set(s.id);
    this.form.setValue({
      studentNumber: s.studentNumber,
      nisn: s.nisn ?? '',
      fullName: s.fullName,
      birthDate: s.birthDate,
      entryYear: s.entryYear,
      classLabel: s.classLabel ?? '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  reset(): void {
    this.editId.set(null);
    this.form.reset();
  }

  save(): void {
    const v = this.form.getRawValue();
    const body = {
      studentNumber: v.studentNumber.trim(),
      nisn: v.nisn.trim() || null,
      fullName: v.fullName.trim(),
      birthDate: v.birthDate,
      entryYear: Number(v.entryYear),
      classLabel: v.classLabel.trim() || null,
    };
    this.call(this.api.saveStudent(body, this.editId() ?? undefined), () => {
      this.message.set({ text: this.t().saved, error: false });
      this.reset();
      this.load();
    });
  }

  remove(s: StudentRow): void {
    this.call(this.api.deleteStudent(s.id), () => {
      this.message.set({ text: this.t().deleted.replace('{name}', s.fullName), error: false });
      this.load();
    });
  }

  pick(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.file.set(input.files?.[0] ?? null);
  }

  importFile(): void {
    const f = this.file();
    if (!f) return;
    this.result.set(null);
    this.call(this.api.importStudents(f, this.importYear()), (r) => {
      this.result.set(r);
      this.message.set({ text: this.t().imported, error: false });
      this.load();
    });
  }

  numOrNull(v: string): number | null {
    return v === '' || v == null ? null : Number(v);
  }

  date(iso: string): string {
    this.i18n.lang();
    return fmtDate(iso);
  }

  /** Pesan hasil impor dari backend, diterjemahkan sesuai bahasa. */
  tr(message: string): string {
    this.i18n.lang();
    return translateMessage(message);
  }

  private call<T>(req: Observable<T>, done: (v: T) => void): void {
    this.busy.set(true);
    this.message.set(null);
    this.confirmDelete.set(null);
    req.subscribe({
      next: (v) => {
        this.busy.set(false);
        done(v);
      },
      error: (e: unknown) => this.fail(e),
    });
  }

  private fail(e: unknown): void {
    this.busy.set(false);
    this.message.set({ text: problemMessage(e), error: true });
  }
}
