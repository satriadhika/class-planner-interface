import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { problemMessage } from '../../../core/api/problem';
import { AuthService } from '../../../core/auth/auth.service';
import { I18n } from '../../../core/i18n/i18n';
import { Icon } from '../../../shared/icon/icon';
import { fmtDate, fmtDateTime } from '../../../shared/labels/labels';
import { WAKA_GURU_TEXT } from './waka-guru.i18n';

export interface TeacherRow {
  id: number;
  userId: number;
  displayName: string;
  email: string | null;
  code: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  /** Guru BK: boleh membuka perhitungan eligible SNBP. */
  counselor: boolean;
  registeredAt: string;
  lastLoginAt: string | null;
}

type Filter = 'ALL' | 'PENDING' | 'ACTIVE' | 'INACTIVE';

/** Waka: setujui pendaftaran guru, nonaktifkan, hapus, ubah NIP. */
@Component({
  selector: 'app-waka-guru',
  imports: [Icon],
  template: `
    <div class="cp-page">
      <header class="cp-head">
        <div>
          <h1>{{ t().title }}</h1>
          <p>{{ t().intro }}</p>
        </div>
        @if (schoolCode()) {
          <aside class="cp-note code-note">
            <span class="cp-small">{{ t().schoolCode }}</span>
            <strong>{{ schoolCode() }}</strong>
          </aside>
        }
      </header>

      @if (message(); as m) {
        <div class="cp-alert" [class.cp-alert--error]="m.error" [class.cp-alert--ok]="!m.error">{{ m.text }}</div>
      }
      @if (count('PENDING') > 0 && filter() !== 'PENDING') {
        <div class="cp-alert cp-alert--warn">
          <span>{{ t().pendingBanner.replace('{n}', '' + count('PENDING')) }}</span>
          <button class="cp-btn cp-btn--sm" type="button" (click)="filter.set('PENDING')">{{ t().pending }}</button>
        </div>
      }

      <section class="cp-card">
        <div class="cp-row toolbar">
          <div class="cp-tabs" role="tablist">
            @for (f of filters(); track f.key) {
              <button type="button" role="tab" [attr.aria-selected]="filter() === f.key" (click)="filter.set(f.key)">
                {{ f.label }} <span class="count">{{ f.key === 'ALL' ? rows().length : count(f.key) }}</span>
              </button>
            }
          </div>
          <span class="cp-spacer"></span>
          <input type="search" [placeholder]="t().search" [attr.aria-label]="t().search" [value]="query()"
                 (input)="query.set($any($event.target).value)" />
        </div>

        <div class="cp-table-wrap">
          <table class="cp-table">
            <thead>
              <tr><th>{{ t().colName }}</th><th>{{ t().colCode }}</th><th>{{ t().colStatus }}</th>
                <th>{{ t().colCounselor }}</th><th>{{ t().colRegistered }}</th><th>{{ t().colLastLogin }}</th><th></th></tr>
            </thead>
            <tbody>
              @for (r of visible(); track r.id) {
                <tr [class.pending]="r.status === 'PENDING'">
                  <td><strong>{{ r.displayName }}</strong><div class="cp-small cp-muted">{{ r.email }}</div></td>
                  <td>
                    @if (editing() === r.id) {
                      <span class="cp-row edit">
                        <input #code [value]="r.code ?? ''" maxlength="30" (keydown.enter)="saveCode(r, code.value)" [attr.aria-label]="t().colCode" />
                        <button class="cp-btn cp-btn--sm cp-btn--primary" type="button" (click)="saveCode(r, code.value)">{{ t().save }}</button>
                        <button class="cp-btn cp-btn--sm" type="button" (click)="editing.set(null)">{{ t().cancel }}</button>
                      </span>
                    } @else {
                      {{ r.code ?? '-' }}
                      <button class="cp-btn cp-btn--sm cp-btn--ghost" type="button" (click)="editing.set(r.id)">{{ t().editCode }}</button>
                    }
                  </td>
                  <td>
                    <span class="cp-badge" [class.cp-badge--ok]="r.status === 'ACTIVE'" [class.cp-badge--warn]="r.status === 'PENDING'">
                      {{ statusLabel(r.status) }}
                    </span>
                  </td>
                  <td>
                    <label class="bk" [title]="t().counselorHint">
                      <input type="checkbox" [checked]="r.counselor" [disabled]="busy() || r.status !== 'ACTIVE'"
                             (change)="setCounselor(r, !r.counselor)" [attr.aria-label]="t().colCounselor + ' ' + r.displayName" />
                      @if (r.counselor) { <span class="cp-badge cp-badge--primary">BK</span> }
                    </label>
                  </td>
                  <td class="cp-small">{{ date(r.registeredAt) }}</td>
                  <td class="cp-small">{{ r.lastLoginAt ? dateTime(r.lastLoginAt) : t().never }}</td>
                  <td class="end">
                    @if (confirm()?.id === r.id) {
                      <span class="cp-small">{{ confirm()!.text }}</span>
                      <button class="cp-btn cp-btn--sm cp-btn--danger" type="button" [disabled]="busy()" (click)="remove(r)">{{ t().yes }}</button>
                      <button class="cp-btn cp-btn--sm" type="button" (click)="confirm.set(null)">{{ t().cancel }}</button>
                    } @else {
                      @switch (r.status) {
                        @case ('PENDING') {
                          <button class="cp-btn cp-btn--sm cp-btn--primary" type="button" [disabled]="busy()" (click)="approve(r)">
                            <app-icon name="check" [size]="15" /> {{ t().approve }}
                          </button>
                          <button class="cp-btn cp-btn--sm cp-btn--ghost" type="button" (click)="askRemove(r, t().rejectQ)">{{ t().reject }}</button>
                        }
                        @case ('ACTIVE') {
                          <button class="cp-btn cp-btn--sm" type="button" [disabled]="busy()" (click)="deactivate(r)">{{ t().deactivate }}</button>
                        }
                        @default {
                          <button class="cp-btn cp-btn--sm" type="button" [disabled]="busy()" (click)="approve(r)">{{ t().activate }}</button>
                          <button class="cp-btn cp-btn--sm cp-btn--ghost" type="button" (click)="askRemove(r, t().removeQ)">{{ t().remove }}</button>
                        }
                      }
                    }
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="7" class="cp-empty">{{ rows().length ? t().noMatch : t().empty }}</td></tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `,
  styles: `
    .code-note { display: grid; gap: 2px; flex: 0 1 240px; }
    .code-note strong { font-size: 1.4rem; letter-spacing: 0.04em; color: var(--brand-ink); }
    .toolbar { margin-bottom: 14px; }
    input[type='search'] { min-height: 38px; width: min(100%, 280px); }
    .count { margin-left: 4px; opacity: 0.7; font-weight: 500; }
    tr.pending td { background: var(--surface-tint); }
    .edit input { width: 140px; min-height: 32px; }
    .end { text-align: right; white-space: nowrap; }
    .bk { display: inline-flex; align-items: center; gap: 6px; cursor: pointer; }
    .bk input { width: 17px; height: 17px; min-height: 0; accent-color: var(--primary); }
    .end .cp-btn + .cp-btn { margin-left: 6px; }
  `,
})
export class WakaGuru {
  private readonly http = inject(HttpClient);
  private readonly i18n = inject(I18n);
  private readonly base = `${environment.apiUrl}/waka/teachers`;

  private readonly auth = inject(AuthService);

  readonly t = computed(() => WAKA_GURU_TEXT[this.i18n.lang()]);
  /** Kode sekolah yang harus diisi guru saat mendaftar. */
  readonly schoolCode = computed(() => this.auth.user()?.school?.code ?? null);

  readonly rows = signal<TeacherRow[]>([]);
  readonly filter = signal<Filter>('ALL');
  readonly query = signal('');
  readonly busy = signal(false);
  readonly editing = signal<number | null>(null);
  readonly confirm = signal<{ id: number; text: string } | null>(null);
  readonly message = signal<{ text: string; error: boolean } | null>(null);

  readonly filters = computed<{ key: Filter; label: string }[]>(() => [
    { key: 'ALL', label: this.t().all },
    { key: 'PENDING', label: this.t().pending },
    { key: 'ACTIVE', label: this.t().active },
    { key: 'INACTIVE', label: this.t().inactive },
  ]);

  readonly visible = computed(() => {
    const q = this.query().trim().toLowerCase();
    return this.rows().filter(
      (r) =>
        (this.filter() === 'ALL' || r.status === this.filter()) &&
        (!q || [r.displayName, r.email ?? '', r.code ?? ''].some((v) => v.toLowerCase().includes(q))),
    );
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.http.get<TeacherRow[]>(this.base).subscribe({
      next: (rows) => {
        this.rows.set(rows);
        if (rows.some((r) => r.status === 'PENDING')) this.filter.set('PENDING');
      },
      error: (e: unknown) => this.fail(e),
    });
  }

  count(status: string): number {
    return this.rows().filter((r) => r.status === status).length;
  }

  statusLabel(status: string): string {
    return status === 'PENDING' ? this.t().pending : status === 'ACTIVE' ? this.t().active : this.t().inactive;
  }

  approve(r: TeacherRow): void {
    const text = (r.status === 'PENDING' ? this.t().approved : this.t().activated).replace('{name}', r.displayName);
    this.update(this.http.post<TeacherRow>(`${this.base}/${r.id}/approve`, {}), text);
  }

  deactivate(r: TeacherRow): void {
    this.update(this.http.post<TeacherRow>(`${this.base}/${r.id}/deactivate`, {}), this.t().deactivated.replace('{name}', r.displayName));
  }

  setCounselor(r: TeacherRow, counselor: boolean): void {
    const text = (counselor ? this.t().counselorOn : this.t().counselorOff).replace('{name}', r.displayName);
    this.update(this.http.put<TeacherRow>(`${this.base}/${r.id}/counselor`, { counselor }), text);
  }

  saveCode(r: TeacherRow, code: string): void {
    if (!code.trim()) return;
    this.update(this.http.put<TeacherRow>(`${this.base}/${r.id}`, { code: code.trim() }), this.t().codeSaved);
  }

  askRemove(r: TeacherRow, question: string): void {
    this.confirm.set({ id: r.id, text: question.replace('{name}', r.displayName) });
  }

  remove(r: TeacherRow): void {
    this.busy.set(true);
    this.http.delete<void>(`${this.base}/${r.id}`).subscribe({
      next: () => {
        this.busy.set(false);
        this.confirm.set(null);
        this.rows.update((list) => list.filter((x) => x.id !== r.id));
        this.message.set({ text: this.t().removed.replace('{name}', r.displayName), error: false });
      },
      error: (e: unknown) => this.fail(e),
    });
  }

  date(iso: string): string {
    this.i18n.lang();
    return fmtDate(iso);
  }

  dateTime(iso: string): string {
    this.i18n.lang();
    return fmtDateTime(iso);
  }

  private update(req: Observable<TeacherRow>, ok: string): void {
    this.busy.set(true);
    this.message.set(null);
    req.subscribe({
      next: (row) => {
        this.busy.set(false);
        this.editing.set(null);
        this.rows.update((list) => list.map((x) => (x.id === row.id ? row : x)));
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
