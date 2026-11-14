import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { startWith } from 'rxjs';

import { problemMessage } from '../../../core/api/problem';
import { I18n } from '../../../core/i18n/i18n';
import {
  DEFAULT_LETTER,
  LETTER_FIELDS,
  LetterField,
  LetterTemplate,
  parseLetter,
  serializeLetter,
} from '../../../shared/letter/letter-template';
import { LetterData, StatementLetter } from '../../../shared/letter/statement-letter';
import { SchoolProfile, WakaApi } from '../waka-api';
import { WAKA_SURAT_TEXT } from './waka-surat.i18n';

type Tab = 'profile' | 'content';
type TextKey = Exclude<keyof LetterTemplate, 'showParent' | 'showPrincipal'>;

/** Kop surat (profil sekolah), isi surat pernyataan, dan pratinjau surat yang diterima murid. */
@Component({
  selector: 'app-waka-surat',
  imports: [ReactiveFormsModule, StatementLetter],
  template: `
    <div class="cp-page">
      <header class="cp-head cp-no-print">
        <div>
          <h1>{{ t().title }}</h1>
          <p>{{ t().intro }}</p>
        </div>
      </header>

      @if (message(); as m) {
        <div class="cp-alert cp-no-print" [class.cp-alert--error]="m.error" [class.cp-alert--ok]="!m.error">{{ m.text }}</div>
      }

      <div class="layout">
        <section class="cp-card cp-no-print editor">
          <div class="cp-tabs" role="tablist">
            <button type="button" role="tab" [attr.aria-selected]="tab() === 'profile'" (click)="tab.set('profile')">{{ t().tabProfile }}</button>
            <button type="button" role="tab" [attr.aria-selected]="tab() === 'content'" (click)="tab.set('content')">{{ t().tabContent }}</button>
          </div>

          <!-- ============ kop surat ============ -->
          @if (tab() === 'profile') {
            <form class="cp-form" [formGroup]="form" (ngSubmit)="save()">
              <label class="cp-field"><span>{{ t().name }}</span><input formControlName="name" /></label>
              <label class="cp-field"><span>{{ t().address }}</span><textarea rows="3" formControlName="address" [placeholder]="t().addressPh"></textarea></label>
              <label class="cp-field"><span>{{ t().phone }}</span><input formControlName="phone" /></label>
              <label class="cp-field"><span>{{ t().email }}</span><input type="email" formControlName="email" /></label>
              <label class="cp-field"><span>{{ t().principal }}</span><input formControlName="principalName" /></label>
            </form>
          }

          <!-- ============ isi surat ============ -->
          @if (tab() === 'content') {
            <p class="cp-small cp-muted hint">{{ t().contentHint }}</p>
            <div class="fields" [attr.aria-label]="t().fieldsLabel">
              @for (f of fields; track f.key) {
                <button type="button" class="field-chip" (mousedown)="$event.preventDefault()" (click)="insert(f.key)"
                        [title]="t().fields[f.key]" [textContent]="f.token"></button>
              }
            </div>

            <form class="cp-form" [formGroup]="letter">
              <label class="cp-field"><span>{{ t().fTitle }}</span>
                <textarea rows="2" formControlName="title" (focus)="focusOn('title', $event)"></textarea></label>
              <label class="cp-field"><span>{{ t().fSubtitle }}</span>
                <input formControlName="subtitle" (focus)="focusOn('subtitle', $event)" /></label>
              <label class="cp-field"><span>{{ t().fOpening }}</span>
                <textarea rows="2" formControlName="opening" (focus)="focusOn('opening', $event)"></textarea></label>
              <label class="cp-field"><span>{{ t().fBody }}</span>
                <textarea rows="4" formControlName="body" (focus)="focusOn('body', $event)"></textarea></label>
              <label class="cp-field"><span>{{ t().fClosing }}</span>
                <textarea rows="4" formControlName="closing" (focus)="focusOn('closing', $event)"></textarea></label>
              <label class="cp-field"><span>{{ t().fCity }}</span>
                <input formControlName="city" [placeholder]="t().fCityPh" (focus)="focusOn('city', $event)" /></label>

              <h3>{{ t().signTitle }}</h3>
              <label class="check"><input type="checkbox" formControlName="showParent" /> {{ t().showParent }}</label>
              @if (letter.value.showParent) {
                <label class="cp-field"><span>{{ t().fSignParent }}</span>
                  <textarea rows="2" formControlName="signParent" (focus)="focusOn('signParent', $event)"></textarea></label>
              }
              <label class="cp-field"><span>{{ t().fSignStudent }}</span>
                <textarea rows="2" formControlName="signStudent" (focus)="focusOn('signStudent', $event)"></textarea></label>
              <label class="check"><input type="checkbox" formControlName="showPrincipal" /> {{ t().showPrincipal }}</label>
              @if (letter.value.showPrincipal) {
                <label class="cp-field"><span>{{ t().fSignPrincipal }}</span>
                  <textarea rows="2" formControlName="signPrincipal" (focus)="focusOn('signPrincipal', $event)"></textarea></label>
              }
            </form>
            <p class="cp-small cp-muted">{{ t().fixedNote }}</p>
            <div class="cp-row">
              @if (confirmReset()) {
                <span class="cp-small">{{ t().resetQ }}</span>
                <button class="cp-btn cp-btn--sm cp-btn--danger" type="button" (click)="resetLetter()">{{ t().yes }}</button>
                <button class="cp-btn cp-btn--sm" type="button" (click)="confirmReset.set(false)">{{ t().cancel }}</button>
              } @else {
                <button class="cp-btn cp-btn--sm cp-btn--ghost" type="button" (click)="confirmReset.set(true)">{{ t().reset }}</button>
              }
            </div>
          }

          <div class="cp-row actions">
            <button class="cp-btn cp-btn--primary" type="button" [disabled]="busy() || form.invalid" (click)="save()">{{ t().save }}</button>
            <button class="cp-btn" type="button" (click)="print()">{{ t().printSample }}</button>
            @if (dirty()) { <span class="cp-small cp-muted">{{ t().unsaved }}</span> }
          </div>
        </section>

        <div class="preview">
          <p class="cp-small cp-muted cp-no-print">{{ t().preview }} {{ t().officialNote }}</p>
          <div class="cp-print-area">
            <app-statement-letter [data]="sample()" [template]="letterDraft()" />
          </div>
        </div>
      </div>
    </div>
  `,
  styles: `
    .layout { display: grid; gap: 20px; grid-template-columns: minmax(300px, 400px) 1fr; align-items: start; }
    .editor { position: sticky; top: calc(var(--topbar-h) + 16px); max-height: calc(100vh - var(--topbar-h) - 32px); overflow: auto; }
    .editor .cp-tabs { margin-bottom: 16px; }
    .preview { min-width: 0; overflow-x: auto; }
    textarea { resize: vertical; }
    .hint { margin: 0 0 10px; line-height: 1.5; }
    .fields { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px; }
    .field-chip {
      padding: 3px 9px;
      border: 1px solid var(--border);
      border-radius: 999px;
      background: var(--primary-soft);
      color: var(--primary);
      font: 600 0.78rem/1.4 ui-monospace, SFMono-Regular, Menlo, monospace;
      cursor: pointer;
    }
    .field-chip:hover { border-color: var(--primary); }
    h3 { margin: 8px 0 0; font-size: 0.95rem; color: var(--brand-ink); }
    .check { display: flex; align-items: center; gap: 8px; font-size: 0.9rem; }
    .check input { width: auto; min-height: 0; }
    .actions { margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--border); }
    @media (max-width: 960px) {
      .layout { grid-template-columns: 1fr; }
      .editor { position: static; max-height: none; }
    }
  `,
})
export class WakaSurat {
  private readonly api = inject(WakaApi);
  private readonly fb = inject(FormBuilder);
  private readonly i18n = inject(I18n);
  /** Teks halaman sesuai bahasa aktif. Isi surat sendiri tetap bahasa Indonesia (dokumen resmi). */
  readonly t = computed(() => WAKA_SURAT_TEXT[this.i18n.lang()]);

  /** Isian otomatis beserta teks yang disisipkan, misalnya {nama}. */
  readonly fields = LETTER_FIELDS.map((key) => ({ key, token: `{${key}}` }));
  readonly tab = signal<Tab>('profile');
  readonly busy = signal(false);
  readonly confirmReset = signal(false);
  readonly message = signal<{ text: string; error: boolean } | null>(null);
  private readonly profile = signal<SchoolProfile | null>(null);
  /** JSON isi surat yang terakhir tersimpan, untuk penanda "belum disimpan". */
  private readonly savedLetter = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    address: [''],
    phone: [''],
    email: ['', Validators.email],
    principalName: [''],
  });

  readonly letter = this.fb.nonNullable.group({ ...DEFAULT_LETTER });

  private readonly formValue = toSignal(this.form.valueChanges.pipe(startWith(this.form.getRawValue())), {
    initialValue: this.form.getRawValue(),
  });
  private readonly letterValue = toSignal(this.letter.valueChanges.pipe(startWith(this.letter.getRawValue())), {
    initialValue: this.letter.getRawValue(),
  });

  /** Template yang sedang diedit, untuk pratinjau langsung. */
  readonly letterDraft = computed<LetterTemplate>(() => ({ ...DEFAULT_LETTER, ...this.letterValue() }));

  readonly dirty = computed(() => {
    const p = this.profile();
    if (!p) return false;
    const v = this.formValue();
    const profileChanged =
      (v.name ?? '') !== p.name ||
      (v.address ?? '') !== (p.address ?? '') ||
      (v.phone ?? '') !== (p.phone ?? '') ||
      (v.email ?? '') !== (p.email ?? '') ||
      (v.principalName ?? '') !== (p.principalName ?? '');
    return profileChanged || serializeLetter(this.letterDraft()) !== this.savedLetter();
  });

  readonly sample = computed<LetterData>(() => {
    const v = this.formValue();
    return {
      school: {
        name: v.name || 'Nama Sekolah',
        address: v.address || null,
        phone: v.phone || null,
        email: v.email || null,
        principalName: v.principalName || null,
      },
      student: { fullName: 'Nama Murid Contoh', studentNumber: '26001', nisn: '0012345678', currentClassLabel: 'X-1' },
      cycleName: 'Penjurusan Kelas 11',
      targetAcademicYear: '2027/2028',
      classLabel: 'C',
      subjects: ['Biologi', 'Fisika', 'Kimia', 'Matematika Tingkat Lanjut', 'Geografi'],
      major1: 'Kedokteran',
      major2: 'Teknik Mesin',
      finalizedAt: null,
    };
  });

  /** Kolom teks terakhir yang difokus, untuk menyisipkan {isian} di posisi kursor. */
  private focused: { key: TextKey; el: HTMLInputElement | HTMLTextAreaElement } | null = null;

  constructor() {
    this.api.school().subscribe({
      next: (s) => this.apply(s),
      error: (e: unknown) => this.fail(e),
    });
  }

  focusOn(key: TextKey, event: FocusEvent): void {
    this.focused = { key, el: event.target as HTMLInputElement | HTMLTextAreaElement };
  }

  /** Sisipkan {isian} di posisi kursor kolom terakhir yang difokus (default: kolom pernyataan). */
  insert(field: LetterField): void {
    const token = `{${field}}`;
    const key = this.focused?.key ?? 'body';
    const control = this.letter.controls[key];
    const el = this.focused?.el;
    const value = control.value;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    control.setValue(value.slice(0, start) + token + value.slice(end));
    if (el) {
      queueMicrotask(() => {
        el.focus();
        el.setSelectionRange(start + token.length, start + token.length);
      });
    }
  }

  resetLetter(): void {
    this.letter.setValue({ ...DEFAULT_LETTER });
    this.confirmReset.set(false);
  }

  save(): void {
    if (this.form.invalid) {
      this.tab.set('profile');
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const body = {
      name: v.name.trim(),
      address: v.address.trim() || null,
      phone: v.phone.trim() || null,
      email: v.email.trim() || null,
      principalName: v.principalName.trim() || null,
      letterTemplate: serializeLetter(this.letterDraft()),
    };
    this.busy.set(true);
    this.message.set(null);
    this.api.saveSchool(body).subscribe({
      next: (s) => {
        this.busy.set(false);
        this.apply(s);
        this.message.set({ text: this.t().saved, error: false });
      },
      error: (e: unknown) => this.fail(e),
    });
  }

  print(): void {
    window.print();
  }

  private apply(s: SchoolProfile): void {
    this.profile.set(s);
    this.savedLetter.set(serializeLetter(parseLetter(s.letterTemplate)));
    this.form.setValue({
      name: s.name,
      address: s.address ?? '',
      phone: s.phone ?? '',
      email: s.email ?? '',
      principalName: s.principalName ?? '',
    });
    this.letter.setValue(parseLetter(s.letterTemplate));
  }

  private fail(e: unknown): void {
    this.busy.set(false);
    this.message.set({ text: problemMessage(e), error: true });
  }
}
