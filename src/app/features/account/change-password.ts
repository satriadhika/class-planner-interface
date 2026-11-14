import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';

import { environment } from '../../../environments/environment';
import { problemMessage } from '../../core/api/problem';
import { Dictionary, I18n } from '../../core/i18n/i18n';
import { Icon } from '../../shared/icon/icon';

const id = {
  title: 'Ganti password',
  intro: 'Password dipakai untuk masuk dengan kode sekolah + username. Masuk dengan Google tidak terpengaruh.',
  current: 'Password lama',
  currentHint: 'Kosongkan kalau selama ini kamu hanya masuk dengan Google.',
  next: 'Password baru',
  nextHint: 'Minimal 8 karakter.',
  confirm: 'Ulangi password baru',
  mismatch: 'Password baru dan ulangannya tidak sama.',
  tooShort: 'Password baru minimal 8 karakter.',
  show: 'Tampilkan password',
  save: 'Simpan password',
  saving: 'Menyimpan…',
  done: 'Password berhasil diganti. Gunakan password baru saat masuk berikutnya.',
};

const en: typeof id = {
  title: 'Change password',
  intro: 'Your password is used to sign in with the school code + username. Signing in with Google is not affected.',
  current: 'Current password',
  currentHint: 'Leave empty if you have only signed in with Google so far.',
  next: 'New password',
  nextHint: 'At least 8 characters.',
  confirm: 'Repeat new password',
  mismatch: 'The new password and its repeat do not match.',
  tooShort: 'The new password needs at least 8 characters.',
  show: 'Show passwords',
  save: 'Save password',
  saving: 'Saving…',
  done: 'Password changed. Use the new password the next time you sign in.',
};

const TEXT: Dictionary<typeof id> = { id, en };

function sameAsNew(group: AbstractControl): ValidationErrors | null {
  const next = group.get('newPassword')?.value;
  const confirm = group.get('confirm')?.value;
  return confirm && next !== confirm ? { mismatch: true } : null;
}

/** Ganti password akun sendiri (waka & super admin). */
@Component({
  selector: 'app-change-password',
  imports: [ReactiveFormsModule, Icon],
  template: `
    <div class="cp-page">
      <header class="cp-head">
        <div>
          <h1>{{ t().title }}</h1>
          <p>{{ t().intro }}</p>
        </div>
      </header>

      <section class="cp-card box">
        @if (message(); as m) {
          <div class="cp-alert" [class.cp-alert--error]="m.error" [class.cp-alert--ok]="!m.error" role="status">{{ m.text }}</div>
        }
        <form class="fields" [formGroup]="form" (ngSubmit)="save()" novalidate>
          <label class="cp-field">
            <span>{{ t().current }}</span>
            <input [type]="show() ? 'text' : 'password'" formControlName="currentPassword" autocomplete="current-password" />
            <small>{{ t().currentHint }}</small>
          </label>
          <label class="cp-field">
            <span>{{ t().next }}</span>
            <input [type]="show() ? 'text' : 'password'" formControlName="newPassword" autocomplete="new-password" />
            @if (form.controls.newPassword.touched && form.controls.newPassword.invalid) {
              <small class="err">{{ t().tooShort }}</small>
            } @else {
              <small>{{ t().nextHint }}</small>
            }
          </label>
          <label class="cp-field">
            <span>{{ t().confirm }}</span>
            <input [type]="show() ? 'text' : 'password'" formControlName="confirm" autocomplete="new-password" />
            @if (form.controls.confirm.touched && form.hasError('mismatch')) {
              <small class="err">{{ t().mismatch }}</small>
            }
          </label>
          <label class="check">
            <input type="checkbox" [checked]="show()" (change)="show.set(!show())" /> {{ t().show }}
          </label>
          <div>
            <button class="cp-btn cp-btn--primary" type="submit" [disabled]="busy()">
              <app-icon name="key" [size]="16" /> {{ busy() ? t().saving : t().save }}
            </button>
          </div>
        </form>
      </section>
    </div>
  `,
  styles: `
    .box { max-width: 480px; }
    .fields { display: grid; gap: 16px; }
    .err { color: var(--danger); }
    .check { display: flex; align-items: center; gap: 8px; font-size: 0.9rem; }
    .check input { width: auto; min-height: 0; }
  `,
})
export class ChangePassword {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly i18n = inject(I18n);

  readonly t = computed(() => TEXT[this.i18n.lang()]);
  readonly busy = signal(false);
  readonly show = signal(false);
  readonly message = signal<{ text: string; error: boolean } | null>(null);

  readonly form = this.fb.nonNullable.group(
    {
      currentPassword: [''],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirm: ['', Validators.required],
    },
    { validators: sameAsNew },
  );

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.message.set({ text: this.form.hasError('mismatch') ? this.t().mismatch : this.t().tooShort, error: true });
      return;
    }
    const v = this.form.getRawValue();
    this.busy.set(true);
    this.message.set(null);
    this.http
      .post<void>(`${environment.apiUrl}/auth/password`, {
        currentPassword: v.currentPassword || null,
        newPassword: v.newPassword,
      })
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.form.reset();
          this.message.set({ text: this.t().done, error: false });
        },
        error: (e: unknown) => {
          this.busy.set(false);
          this.message.set({ text: problemMessage(e), error: true });
        },
      });
  }
}
