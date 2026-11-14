import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { problemMessage } from '../../../core/api/problem';
import { I18n } from '../../../core/i18n/i18n';
import { Icon } from '../../../shared/icon/icon';
import { ADMIN_TEXT } from '../admin.i18n';
import { AdminApi, SchoolRow } from '../admin-api';

/** Super admin: daftar sekolah + tambah sekolah. */
@Component({
  selector: 'app-admin-sekolah',
  imports: [ReactiveFormsModule, RouterLink, Icon],
  template: `
    <div class="cp-page">
      <header class="cp-head">
        <div>
          <h1>{{ t().schoolsTitle }}</h1>
          <p>{{ t().schoolsIntro }}</p>
        </div>
        @if (!adding()) {
          <button class="cp-btn cp-btn--primary" type="button" (click)="adding.set(true)">{{ t().addSchool }}</button>
        }
      </header>

      @if (message(); as m) {
        <div class="cp-alert" [class.cp-alert--error]="m.error" [class.cp-alert--ok]="!m.error">{{ m.text }}</div>
      }

      @if (adding()) {
        <section class="cp-card">
          <h2>{{ t().newSchool }}</h2>
          <form class="cp-form" [formGroup]="form" (ngSubmit)="create()">
            <label class="cp-field"><span>{{ t().code }}</span>
              <input formControlName="code" maxlength="30" autocapitalize="characters" />
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
              <div class="cp-row">
                <button class="cp-btn cp-btn--primary" type="submit" [disabled]="busy() || form.invalid">{{ t().create }}</button>
                <button class="cp-btn" type="button" (click)="adding.set(false)">{{ t().cancel }}</button>
              </div>
            </div>
          </form>
        </section>
      }

      <section class="cp-card">
        <div class="cp-row toolbar">
          <input type="search" [placeholder]="t().search" [attr.aria-label]="t().search" [value]="query()"
                 (input)="query.set($any($event.target).value)" />
        </div>
        <div class="cp-table-wrap">
          <table class="cp-table">
            <thead>
              <tr><th>{{ t().code }}</th><th>{{ t().colSchool }}</th><th>{{ t().accreditation }}</th><th class="num">{{ t().colStudents }}</th>
                <th>{{ t().colAccounts }}</th><th>{{ t().colStatus }}</th><th></th></tr>
            </thead>
            <tbody>
              @for (s of visible(); track s.id) {
                <tr [class.off]="s.disabled">
                  <td><strong>{{ s.code }}</strong></td>
                  <td>{{ s.name }}</td>
                  <td>{{ s.accreditation ?? '-' }}</td>
                  <td class="num">{{ s.students }}</td>
                  <td class="cp-small">
                    {{ t().accountsLine.replace('{w}', '' + s.wakas).replace('{g}', '' + s.teachers) }}
                    @if (s.pendingTeachers) { <span class="cp-badge cp-badge--warn">{{ t().pendingLine.replace('{n}', '' + s.pendingTeachers) }}</span> }
                  </td>
                  <td>
                    <span class="cp-badge" [class.cp-badge--ok]="!s.disabled" [class.cp-badge--danger]="s.disabled">
                      {{ s.disabled ? t().disabled : t().active }}
                    </span>
                  </td>
                  <td class="end"><a class="cp-btn cp-btn--sm" [routerLink]="['/admin/sekolah', s.id]">{{ t().open }} <app-icon name="chevron-right" [size]="15" /></a></td>
                </tr>
              } @empty {
                <tr><td colspan="7" class="cp-empty">{{ t().noSchools }}</td></tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `,
  styles: `
    .toolbar { margin-bottom: 14px; }
    input[type='search'] { min-height: 38px; width: min(100%, 320px); }
    tr.off td { opacity: 0.6; }
    .end { text-align: right; }
  `,
})
export class AdminSekolah {
  private readonly api = inject(AdminApi);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly i18n = inject(I18n);

  readonly t = computed(() => ADMIN_TEXT[this.i18n.lang()]);
  readonly schools = signal<SchoolRow[]>([]);
  readonly query = signal('');
  readonly adding = signal(false);
  readonly busy = signal(false);
  readonly message = signal<{ text: string; error: boolean } | null>(null);

  readonly visible = computed(() => {
    const q = this.query().trim().toLowerCase();
    return q ? this.schools().filter((s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)) : this.schools();
  });

  readonly form = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.maxLength(30), Validators.pattern(/^[A-Za-z0-9._-]+$/)]],
    name: ['', [Validators.required, Validators.maxLength(200)]],
    address: [''],
    phone: [''],
    email: ['', Validators.email],
    principalName: [''],
    accreditation: [''],
  });

  constructor() {
    this.api.schools().subscribe({
      next: (list) => this.schools.set(list),
      error: (e: unknown) => this.message.set({ text: problemMessage(e), error: true }),
    });
  }

  create(): void {
    const v = this.form.getRawValue();
    this.busy.set(true);
    this.message.set(null);
    this.api
      .create({
        code: v.code.trim(),
        name: v.name.trim(),
        address: v.address.trim() || null,
        phone: v.phone.trim() || null,
        email: v.email.trim() || null,
        principalName: v.principalName.trim() || null,
        accreditation: v.accreditation || null,
      })
      .subscribe({
        next: (d) => {
          this.busy.set(false);
          // langsung ke detail sekolah, tab akun waka
          this.router.navigate(['/admin/sekolah', d.summary.id], {
            queryParams: { tab: 'waka', created: '1' },
          });
        },
        error: (e: unknown) => {
          this.busy.set(false);
          this.message.set({ text: problemMessage(e), error: true });
        },
      });
  }
}
