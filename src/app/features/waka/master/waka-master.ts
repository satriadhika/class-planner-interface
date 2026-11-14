import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

import { problemMessage, translateMessage } from '../../../core/api/problem';
import { I18n } from '../../../core/i18n/i18n';
import { ImportResult, Major, Subject, WakaApi } from '../waka-api';
import { MASTER_TEXT } from './waka-master.i18n';

type Tab = 'subjects' | 'majors' | 'import';

/** Master data: mapel dan jurusan kuliah beserta mapel pendukungnya. */
@Component({
  selector: 'app-waka-master',
  imports: [ReactiveFormsModule],
  template: `
    <div class="cp-page">
      <header class="cp-head">
        <div>
          <h1>{{ t().title }}</h1>
          <p>{{ t().intro }}</p>
        </div>
      </header>

      <div class="cp-tabs" role="tablist">
        <button type="button" role="tab" [attr.aria-selected]="tab() === 'subjects'" (click)="switchTab('subjects')">{{ t().tabSubjects.replace('{n}', '' + subjects().length) }}</button>
        <button type="button" role="tab" [attr.aria-selected]="tab() === 'majors'" (click)="switchTab('majors')">{{ t().tabMajors.replace('{n}', '' + majors().length) }}</button>
        <button type="button" role="tab" [attr.aria-selected]="tab() === 'import'" (click)="switchTab('import')">{{ t().tabImport }}</button>
      </div>

      @if (message(); as m) {
        <div class="cp-alert" [class.cp-alert--error]="m.error" [class.cp-alert--ok]="!m.error">{{ m.text }}</div>
      }

      <!-- ===================== mapel ===================== -->
      @if (tab() === 'subjects') {
        <section class="cp-card">
          <h2>{{ subjectEditId() ? t().editSubject : t().addSubject }}</h2>
          <form class="cp-form" [formGroup]="subjectForm" (ngSubmit)="saveSubject()">
            <div class="cp-grid cols4">
              <label class="cp-field">
                <span>{{ t().code }}</span>
                <input formControlName="code" placeholder="BIO" [readonly]="!!subjectEditId()" />
              </label>
              <label class="cp-field">
                <span>{{ t().name }}</span>
                <input formControlName="name" [placeholder]="t().namePh" />
              </label>
              <label class="cp-field">
                <span>{{ t().category }}</span>
                <select formControlName="category">
                  <option value="PILIHAN">{{ t().catElective }}</option>
                  <option value="UMUM">{{ t().catCore }}</option>
                </select>
              </label>
              <label class="cp-field">
                <span>{{ t().rumpun }}</span>
                <select formControlName="rumpun">
                  <option value="IPA">IPA</option>
                  <option value="IPS">IPS</option>
                  <option value="">{{ t().neutral }}</option>
                </select>
              </label>
            </div>
            <p class="cp-small cp-muted">{{ t().rumpunHint }}</p>
            <div class="cp-row">
              <button class="cp-btn cp-btn--primary" type="submit" [disabled]="busy() || subjectForm.invalid">{{ t().save }}</button>
              @if (subjectEditId()) { <button class="cp-btn" type="button" (click)="resetSubject()">{{ t().cancel }}</button> }
            </div>
          </form>
        </section>

        <section class="cp-card">
          <div class="cp-table-wrap">
            <table class="cp-table">
              <thead><tr><th>{{ t().code }}</th><th>{{ t().name }}</th><th>{{ t().category }}</th><th>{{ t().rumpun }}</th><th></th></tr></thead>
              <tbody>
                @for (s of subjects(); track s.id) {
                  <tr>
                    <td><strong>{{ s.code }}</strong></td>
                    <td>{{ s.name }}</td>
                    <td>{{ s.category === 'PILIHAN' ? t().elective : t().core }}</td>
                    <td>
                      @if (s.rumpun) { <span class="cp-chip" [class.cp-chip--ipa]="s.rumpun === 'IPA'" [class.cp-chip--ips]="s.rumpun === 'IPS'">{{ s.rumpun }}</span> }
                      @else { <span class="cp-muted">{{ t().neutral }}</span> }
                    </td>
                    <td class="end">
                      @if (confirmDelete() === 's' + s.id) {
                        <span class="cp-small">{{ t().deleteQ }}</span>
                        <button class="cp-btn cp-btn--sm cp-btn--danger" type="button" (click)="deleteSubject(s)">{{ t().yes }}</button>
                        <button class="cp-btn cp-btn--sm" type="button" (click)="confirmDelete.set(null)">{{ t().no }}</button>
                      } @else {
                        <button class="cp-btn cp-btn--sm cp-btn--ghost" type="button" (click)="editSubject(s)">{{ t().edit }}</button>
                        <button class="cp-btn cp-btn--sm cp-btn--ghost" type="button" (click)="confirmDelete.set('s' + s.id)">{{ t().remove }}</button>
                      }
                    </td>
                  </tr>
                } @empty {
                  <tr><td colspan="5" class="cp-empty">{{ t().noSubjects }}</td></tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      }

      <!-- ===================== jurusan ===================== -->
      @if (tab() === 'majors') {
        <section class="cp-card">
          <h2>{{ majorEditId() ? t().editMajor : t().addMajor }}</h2>
          <form class="major-form" [formGroup]="majorForm" (ngSubmit)="saveMajor()">
            <div class="cp-grid cols2">
              <label class="cp-field">
                <span>{{ t().code }}</span>
                <input formControlName="code" placeholder="TMESIN" [readonly]="!!majorEditId()" />
              </label>
              <label class="cp-field">
                <span>{{ t().majorName }}</span>
                <input formControlName="name" [placeholder]="t().majorNamePh" />
              </label>
            </div>
            <fieldset class="subjects">
              <legend>
                {{ t().requiredSubjects.replace('{n}', '' + picked().length) }}
                @if (core().length) { <span class="count">· {{ t().coreCount.replace('{n}', '' + core().length) }}</span> }
              </legend>
              <p class="cp-small cp-muted hint">{{ t().majorHint }}</p>
              <div class="pick">
                @for (s of electives(); track s.id) {
                  @let on = picked().includes(s.code);
                  <div class="pick-item" [class.on]="on" [class.is-core]="core().includes(s.code)">
                    <label class="pick-main">
                      <input type="checkbox" [checked]="on" [disabled]="!on && picked().length >= 5" (change)="togglePick(s.code)" />
                      <span class="pick-name">{{ s.name }}</span>
                      @if (s.rumpun) {
                        <span class="cp-chip" [class.cp-chip--ipa]="s.rumpun === 'IPA'" [class.cp-chip--ips]="s.rumpun === 'IPS'">{{ s.rumpun }}</span>
                      }
                    </label>
                    @if (on) {
                      <button type="button" class="core-toggle" [attr.aria-pressed]="core().includes(s.code)"
                              [attr.aria-label]="t().coreAria.replace('{name}', s.name)" (click)="toggleCore(s.code)">
                        {{ core().includes(s.code) ? t().coreOn : t().coreOff }}
                      </button>
                    }
                  </div>
                } @empty {
                  <p class="cp-small cp-muted">{{ t().noElectives }}</p>
                }
              </div>
              @if (picked().length) {
                <p class="cp-small rule">{{ ruleText() }}</p>
              }
            </fieldset>
            <div class="cp-row">
              <button class="cp-btn cp-btn--primary" type="submit" [disabled]="busy() || majorForm.invalid || picked().length === 0">{{ t().save }}</button>
              @if (majorEditId()) { <button class="cp-btn" type="button" (click)="resetMajor()">{{ t().cancel }}</button> }
            </div>
          </form>
        </section>

        <section class="cp-card">
          <div class="cp-row">
            <input class="search" type="search" [placeholder]="t().searchMajor" [value]="query()" (input)="query.set($any($event.target).value)" [attr.aria-label]="t().searchMajor" />
          </div>
          <div class="cp-table-wrap">
            <table class="cp-table">
              <thead><tr><th>{{ t().code }}</th><th>{{ t().colMajor }}</th><th>{{ t().colRequired }}</th><th></th></tr></thead>
              <tbody>
                @for (m of filteredMajors(); track m.id) {
                  <tr>
                    <td><strong>{{ m.code }}</strong></td>
                    <td>{{ m.name }}</td>
                    <td>
                      <div class="cp-chips">
                        @for (n of m.subjectNames; track n; let i = $index) {
                          @let isCore = m.coreSubjectCodes?.includes(m.subjectCodes[i]);
                          <span class="cp-chip" [class.chip-core]="isCore">{{ n }}@if (isCore) { <small>· {{ t().coreTag }}</small> }</span>
                        }
                      </div>
                    </td>
                    <td class="end">
                      @if (confirmDelete() === 'm' + m.id) {
                        <span class="cp-small">{{ t().deleteQ }}</span>
                        <button class="cp-btn cp-btn--sm cp-btn--danger" type="button" (click)="deleteMajor(m)">{{ t().yes }}</button>
                        <button class="cp-btn cp-btn--sm" type="button" (click)="confirmDelete.set(null)">{{ t().no }}</button>
                      } @else {
                        <button class="cp-btn cp-btn--sm cp-btn--ghost" type="button" (click)="editMajor(m)">{{ t().edit }}</button>
                        <button class="cp-btn cp-btn--sm cp-btn--ghost" type="button" (click)="confirmDelete.set('m' + m.id)">{{ t().remove }}</button>
                      }
                    </td>
                  </tr>
                } @empty {
                  <tr><td colspan="4" class="cp-empty">{{ t().noMajors }}</td></tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      }

      <!-- ===================== impor excel ===================== -->
      @if (tab() === 'import') {
        <div class="cp-grid import-grid">
          <section class="cp-card">
            <h2>{{ t().importTitle }}</h2>
            <p class="cp-sub">{{ t().importHint }}</p>
            <div class="import-form">
              <label class="cp-field">
                <span>{{ t().file }}</span>
                <input type="file" accept=".xlsx,.xls" (change)="pickFile($event)" />
              </label>
              <div class="cp-row">
                <button class="cp-btn cp-btn--primary" type="button" [disabled]="busy() || !file()" (click)="importFile()">
                  {{ busy() ? t().importing : t().import }}
                </button>
                <a class="cp-btn cp-btn--ghost" href="/assets/templates/template-mapel-jurusan.xlsx" download>{{ t().template }}</a>
              </div>
            </div>
            @if (result(); as r) {
              <div class="cp-stats res">
                <div class="cp-stat"><strong>{{ r.created }}</strong><span>{{ t().created }}</span></div>
                <div class="cp-stat"><strong>{{ r.updated }}</strong><span>{{ t().updated }}</span></div>
                <div class="cp-stat"><strong>{{ r.skipped }}</strong><span>{{ t().skipped }}</span></div>
              </div>
              @if (r.messages.length) {
                <ul class="msgs cp-small">@for (m of r.messages; track $index) { <li>{{ tr(m) }}</li> }</ul>
              }
            }
          </section>

          <section class="cp-card">
            <h2>{{ t().formatTitle }}</h2>
            <p class="cp-sub">{{ t().formatHint }}</p>
            <h3 class="sheet-title">{{ t().sheetSubjects }}</h3>
            <div class="cp-table-wrap">
              <table class="sheet" aria-hidden="true">
                <thead><tr><th class="key">KODE MAPEL</th><th>NAMA MAPEL</th><th>KATEGORI</th><th>RUMPUN</th></tr></thead>
                <tbody>
                  <tr><td class="key">BIO</td><td>Biologi</td><td>PILIHAN</td><td>IPA</td></tr>
                  <tr><td class="key">BJEP</td><td>Bahasa Jepang</td><td>PILIHAN</td><td class="dim"></td></tr>
                </tbody>
              </table>
            </div>
            <h3 class="sheet-title">{{ t().sheetMajors }}</h3>
            <div class="cp-table-wrap">
              <table class="sheet" aria-hidden="true">
                <thead><tr><th class="key">KODE JURUSAN</th><th>NAMA JURUSAN</th><th class="core">MAPEL WAJIB</th><th>MAPEL PENDUKUNG</th></tr></thead>
                <tbody>
                  <tr><td class="key">KED</td><td>Kedokteran</td><td class="core">Biologi</td><td>Kimia</td></tr>
                  <tr><td class="key">HUKUM</td><td>Ilmu Hukum</td><td class="dim"></td><td>Sosiologi, Sejarah Tingkat Lanjut</td></tr>
                </tbody>
              </table>
            </div>
            <ol class="rules">
              @for (r of t().importRules; track $index) { <li>{{ r }}</li> }
            </ol>
          </section>
        </div>
      }
    </div>
  `,
  styles: `
    .cols4 { grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); }
    .cols2 { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
    .end { text-align: right; white-space: nowrap; }
    .search { min-height: 38px; width: min(320px, 100%); }
    .major-form { display: grid; gap: 18px; }
    .import-grid { grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); align-items: start; }
    .import-form { display: grid; gap: 14px; max-width: 460px; }
    .res { margin-top: 14px; }
    .msgs { margin: 10px 0 0; padding-left: 18px; max-height: 220px; overflow: auto; }
    .sheet-title { margin: 14px 0 6px; font-size: 0.85rem; color: var(--brand-ink); }
    .sheet { border-collapse: collapse; font-size: 0.78rem; white-space: nowrap; width: 100%; }
    .sheet th, .sheet td { padding: 6px 10px; border: 1px solid var(--border); text-align: left; }
    .sheet th { background: var(--surface-tint); font-weight: 700; }
    .sheet .key { background: var(--primary-soft); color: var(--primary); font-weight: 700; }
    .sheet .core { color: var(--primary); font-weight: 700; }
    .sheet .dim { color: var(--muted); }
    .rules { display: grid; gap: 8px; margin: 14px 0 0; padding-left: 18px; font-size: 0.9rem; line-height: 1.5; }
    .subjects { margin: 0; padding: 0; border: 0; min-width: 0; }
    .subjects legend { padding: 0; font-size: 0.85rem; font-weight: 700; color: var(--brand-ink); }
    .subjects .count { font-weight: 600; color: var(--primary); }
    .subjects .hint { margin: 4px 0 10px; max-width: 70ch; line-height: 1.5; }
    .pick {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
      gap: 8px;
    }
    .pick-item {
      display: flex;
      align-items: center;
      gap: 8px;
      min-height: 48px;
      padding: 6px 8px 6px 12px;
      border: 1px solid var(--border);
      border-radius: 10px;
      background: var(--surface);
      transition: border-color 0.15s, background 0.15s;
    }
    .pick-item.on { border-color: var(--primary); background: var(--primary-soft); }
    .pick-main {
      flex: 1;
      min-width: 0;
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      font-size: 0.9rem;
    }
    .pick-main input[type='checkbox'] {
      flex: none;
      width: 16px;
      height: 16px;
      min-height: 0;
      margin: 0;
      padding: 0;
      accent-color: var(--primary);
    }
    .pick-name { flex: 1; min-width: 0; line-height: 1.3; }
    .pick-main .cp-chip { flex: none; font-size: 0.7rem; padding: 2px 7px; }
    .core-toggle {
      flex: none;
      padding: 4px 10px;
      border-radius: 999px;
      border: 1px solid var(--primary);
      background: var(--surface);
      color: var(--primary);
      font-size: 0.75rem;
      font-weight: 700;
    }
    .core-toggle[aria-pressed='true'] { background: var(--primary); color: #fff; }
    .rule { margin: 10px 0 0; color: var(--brand-ink); }
    .chip-core { background: var(--primary); color: #fff; }
    .chip-core small { font-weight: 500; opacity: 0.85; }
  `,
})
export class WakaMaster {
  private readonly api = inject(WakaApi);
  private readonly fb = inject(FormBuilder);
  private readonly i18n = inject(I18n);
  /** Teks sesuai bahasa aktif. */
  readonly t = computed(() => MASTER_TEXT[this.i18n.lang()]);

  readonly tab = signal<Tab>('subjects');
  readonly subjects = signal<Subject[]>([]);
  readonly majors = signal<Major[]>([]);
  readonly busy = signal(false);
  readonly message = signal<{ text: string; error: boolean } | null>(null);
  readonly confirmDelete = signal<string | null>(null);
  readonly subjectEditId = signal<number | null>(null);
  readonly majorEditId = signal<number | null>(null);
  readonly picked = signal<string[]>([]);
  readonly file = signal<File | null>(null);
  readonly result = signal<ImportResult | null>(null);
  /** Mapel wajib (bagian dari picked). */
  readonly core = signal<string[]>([]);
  /** Penjelasan aturan jurusan yang sedang diisi, sesuai mapel yang dipilih. */
  readonly ruleText = computed(() => {
    const t = this.t();
    const name = (code: string) => this.subjects().find((s) => s.code === code)?.name ?? code;
    const picked = this.picked();
    const core = this.core();
    const list = (codes: string[]) => codes.map(name).join(', ');
    if (picked.length === 1) return t.ruleSingle.replace('{a}', name(picked[0]));
    if (!core.length) return t.ruleAny.replace('{a}', list(picked));
    const support = picked.filter((c) => !core.includes(c));
    if (!support.length) return t.ruleAll.replace('{a}', list(core));
    return t.ruleCore.replace('{a}', list(core)).replace('{b}', list(support));
  });
  readonly query = signal('');

  readonly electives = computed(() => this.subjects().filter((s) => s.category === 'PILIHAN'));
  readonly filteredMajors = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.majors();
    return this.majors().filter((m) => m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q));
  });

  readonly subjectForm = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.maxLength(30)]],
    name: ['', [Validators.required, Validators.maxLength(150)]],
    category: ['PILIHAN' as 'PILIHAN' | 'UMUM'],
    rumpun: ['IPA' as string],
  });

  readonly majorForm = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.maxLength(30)]],
    name: ['', [Validators.required, Validators.maxLength(150)]],
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.api.subjects().subscribe({ next: (s) => this.subjects.set(s), error: (e: unknown) => this.fail(e) });
    this.api.majors().subscribe({ next: (m) => this.majors.set(m), error: (e: unknown) => this.fail(e) });
  }

  switchTab(t: Tab): void {
    this.tab.set(t);
    this.message.set(null);
    this.confirmDelete.set(null);
  }

  // ---------------------------------------------------------------- impor excel

  pickFile(event: Event): void {
    this.file.set((event.target as HTMLInputElement).files?.[0] ?? null);
  }

  importFile(): void {
    const f = this.file();
    if (!f) return;
    this.result.set(null);
    this.call(this.api.importMaster(f), (r) => {
      this.result.set(r);
      this.ok(this.t().imported);
      this.load();
    });
  }

  /** Pesan hasil impor dari backend, diterjemahkan sesuai bahasa. */
  tr(message: string): string {
    this.i18n.lang();
    return translateMessage(message);
  }

  // ---------------------------------------------------------------- mapel

  editSubject(s: Subject): void {
    this.subjectEditId.set(s.id);
    this.subjectForm.setValue({ code: s.code, name: s.name, category: s.category, rumpun: s.rumpun ?? '' });
  }

  resetSubject(): void {
    this.subjectEditId.set(null);
    this.subjectForm.reset({ code: '', name: '', category: 'PILIHAN', rumpun: 'IPA' });
  }

  saveSubject(): void {
    const v = this.subjectForm.getRawValue();
    const body = { code: v.code.trim(), name: v.name.trim(), category: v.category, rumpun: (v.rumpun || null) as Subject['rumpun'] };
    this.call(this.api.saveSubject(body, this.subjectEditId() ?? undefined), () => {
      this.ok(this.t().subjectSaved);
      this.resetSubject();
      this.load();
    });
  }

  deleteSubject(s: Subject): void {
    this.call(this.api.deleteSubject(s.id), () => {
      this.ok(this.t().subjectDeleted.replace('{name}', s.name));
      this.load();
    });
  }

  // ---------------------------------------------------------------- jurusan

  togglePick(code: string): void {
    const removing = this.picked().includes(code);
    this.picked.update((p) => (removing ? p.filter((c) => c !== code) : [...p, code]));
    if (removing) this.core.update((c) => c.filter((x) => x !== code));
  }

  /** Tandai / lepas mapel wajib. Hanya untuk mapel yang sudah dipilih. */
  toggleCore(code: string): void {
    if (!this.picked().includes(code)) return;
    this.core.update((c) => (c.includes(code) ? c.filter((x) => x !== code) : [...c, code]));
  }

  editMajor(m: Major): void {
    this.majorEditId.set(m.id);
    this.majorForm.setValue({ code: m.code, name: m.name });
    this.picked.set([...m.subjectCodes]);
    this.core.set([...(m.coreSubjectCodes ?? [])]);
  }

  resetMajor(): void {
    this.majorEditId.set(null);
    this.majorForm.reset({ code: '', name: '' });
    this.picked.set([]);
    this.core.set([]);
  }

  saveMajor(): void {
    const v = this.majorForm.getRawValue();
    const picked = this.picked();
    const body = {
      code: v.code.trim(),
      name: v.name.trim(),
      subjectCodes: picked,
      coreSubjectCodes: this.core().filter((c) => picked.includes(c)),
    };
    this.call(this.api.saveMajor(body, this.majorEditId() ?? undefined), () => {
      this.ok(this.t().majorSaved);
      this.resetMajor();
      this.load();
    });
  }

  deleteMajor(m: Major): void {
    this.call(this.api.deleteMajor(m.id), () => {
      this.ok(this.t().majorDeleted.replace('{name}', m.name));
      this.load();
    });
  }

  // ---------------------------------------------------------------- util

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

  private ok(text: string): void {
    this.message.set({ text, error: false });
  }

  private fail(e: unknown): void {
    this.busy.set(false);
    this.message.set({ text: problemMessage(e), error: true });
  }
}
