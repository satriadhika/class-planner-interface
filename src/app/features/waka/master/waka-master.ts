import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

import { problemMessage } from '../../../core/api/problem';
import { Major, Subject, WakaApi } from '../waka-api';

type Tab = 'subjects' | 'majors';

/** Master data: mapel dan jurusan kuliah beserta mapel pendukungnya. */
@Component({
  selector: 'app-waka-master',
  imports: [ReactiveFormsModule],
  template: `
    <div class="cp-page">
      <header class="cp-head">
        <div>
          <h1>Mapel &amp; jurusan</h1>
          <p>Mapel pilihan kelas 11 dan jurusan kuliah yang bisa dipilih murid, beserta mapel yang dibutuhkan tiap jurusan.</p>
        </div>
      </header>

      <div class="cp-tabs" role="tablist">
        <button type="button" role="tab" [attr.aria-selected]="tab() === 'subjects'" (click)="switchTab('subjects')">Mapel ({{ subjects().length }})</button>
        <button type="button" role="tab" [attr.aria-selected]="tab() === 'majors'" (click)="switchTab('majors')">Jurusan ({{ majors().length }})</button>
      </div>

      @if (message(); as m) {
        <div class="cp-alert" [class.cp-alert--error]="m.error" [class.cp-alert--ok]="!m.error">{{ m.text }}</div>
      }

      <!-- ===================== mapel ===================== -->
      @if (tab() === 'subjects') {
        <section class="cp-card">
          <h2>{{ subjectEditId() ? 'Ubah mapel' : 'Tambah mapel' }}</h2>
          <form class="cp-form" [formGroup]="subjectForm" (ngSubmit)="saveSubject()">
            <div class="cp-grid cols4">
              <label class="cp-field">
                <span>Kode</span>
                <input formControlName="code" placeholder="BIO" [readonly]="!!subjectEditId()" />
              </label>
              <label class="cp-field">
                <span>Nama</span>
                <input formControlName="name" placeholder="Biologi" />
              </label>
              <label class="cp-field">
                <span>Kategori</span>
                <select formControlName="category">
                  <option value="PILIHAN">Pilihan (kelas 11–12)</option>
                  <option value="UMUM">Umum (kelas 10)</option>
                </select>
              </label>
              <label class="cp-field">
                <span>Rumpun</span>
                <select formControlName="rumpun">
                  <option value="IPA">IPA</option>
                  <option value="IPS">IPS</option>
                  <option value="">Netral</option>
                </select>
              </label>
            </div>
            <p class="cp-small cp-muted">Rumpun menentukan skor yang dipakai untuk mapel tambahan: IPA memakai skor IPA, IPS memakai skor IPS, netral (misalnya Geografi) memakai rata-rata keduanya.</p>
            <div class="cp-row">
              <button class="cp-btn cp-btn--primary" type="submit" [disabled]="busy() || subjectForm.invalid">Simpan</button>
              @if (subjectEditId()) { <button class="cp-btn" type="button" (click)="resetSubject()">Batal</button> }
            </div>
          </form>
        </section>

        <section class="cp-card">
          <div class="cp-table-wrap">
            <table class="cp-table">
              <thead><tr><th>Kode</th><th>Nama</th><th>Kategori</th><th>Rumpun</th><th></th></tr></thead>
              <tbody>
                @for (s of subjects(); track s.id) {
                  <tr>
                    <td><strong>{{ s.code }}</strong></td>
                    <td>{{ s.name }}</td>
                    <td>{{ s.category === 'PILIHAN' ? 'Pilihan' : 'Umum' }}</td>
                    <td>
                      @if (s.rumpun) { <span class="cp-chip" [class.cp-chip--ipa]="s.rumpun === 'IPA'" [class.cp-chip--ips]="s.rumpun === 'IPS'">{{ s.rumpun }}</span> }
                      @else { <span class="cp-muted">Netral</span> }
                    </td>
                    <td class="end">
                      @if (confirmDelete() === 's' + s.id) {
                        <span class="cp-small">Hapus?</span>
                        <button class="cp-btn cp-btn--sm cp-btn--danger" type="button" (click)="deleteSubject(s)">Ya</button>
                        <button class="cp-btn cp-btn--sm" type="button" (click)="confirmDelete.set(null)">Tidak</button>
                      } @else {
                        <button class="cp-btn cp-btn--sm cp-btn--ghost" type="button" (click)="editSubject(s)">Ubah</button>
                        <button class="cp-btn cp-btn--sm cp-btn--ghost" type="button" (click)="confirmDelete.set('s' + s.id)">Hapus</button>
                      }
                    </td>
                  </tr>
                } @empty {
                  <tr><td colspan="5" class="cp-empty">Belum ada mapel.</td></tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      }

      <!-- ===================== jurusan ===================== -->
      @if (tab() === 'majors') {
        <section class="cp-card">
          <h2>{{ majorEditId() ? 'Ubah jurusan' : 'Tambah jurusan' }}</h2>
          <form class="cp-form" [formGroup]="majorForm" (ngSubmit)="saveMajor()">
            <div class="cp-grid cols2">
              <label class="cp-field">
                <span>Kode</span>
                <input formControlName="code" placeholder="TMESIN" [readonly]="!!majorEditId()" />
              </label>
              <label class="cp-field">
                <span>Nama jurusan</span>
                <input formControlName="name" placeholder="Teknik Mesin" />
              </label>
            </div>
            <div class="cp-field">
              <span>Mapel yang dibutuhkan ({{ picked().length }}/5)</span>
              <div class="pick">
                @for (s of electives(); track s.id) {
                  <label class="pick-item" [class.on]="picked().includes(s.code)">
                    <input type="checkbox" [checked]="picked().includes(s.code)"
                           [disabled]="!picked().includes(s.code) && picked().length >= 5"
                           (change)="togglePick(s.code)" />
                    {{ s.name }}
                  </label>
                }
              </div>
            </div>
            <p class="cp-small cp-muted">Kalau jurusan 1 hanya butuh satu mapel, mapel itu wajib ada di kelas murid. Kalau lebih dari satu, kelas murid minimal memuat salah satunya.</p>
            <div class="cp-row">
              <button class="cp-btn cp-btn--primary" type="submit" [disabled]="busy() || majorForm.invalid || picked().length === 0">Simpan</button>
              @if (majorEditId()) { <button class="cp-btn" type="button" (click)="resetMajor()">Batal</button> }
            </div>
          </form>
        </section>

        <section class="cp-card">
          <div class="cp-row">
            <input class="search" type="search" placeholder="Cari jurusan" [value]="query()" (input)="query.set($any($event.target).value)" aria-label="Cari jurusan" />
          </div>
          <div class="cp-table-wrap">
            <table class="cp-table">
              <thead><tr><th>Kode</th><th>Jurusan</th><th>Mapel dibutuhkan</th><th></th></tr></thead>
              <tbody>
                @for (m of filteredMajors(); track m.id) {
                  <tr>
                    <td><strong>{{ m.code }}</strong></td>
                    <td>{{ m.name }}</td>
                    <td><div class="cp-chips">@for (n of m.subjectNames; track n) { <span class="cp-chip">{{ n }}</span> }</div></td>
                    <td class="end">
                      @if (confirmDelete() === 'm' + m.id) {
                        <span class="cp-small">Hapus?</span>
                        <button class="cp-btn cp-btn--sm cp-btn--danger" type="button" (click)="deleteMajor(m)">Ya</button>
                        <button class="cp-btn cp-btn--sm" type="button" (click)="confirmDelete.set(null)">Tidak</button>
                      } @else {
                        <button class="cp-btn cp-btn--sm cp-btn--ghost" type="button" (click)="editMajor(m)">Ubah</button>
                        <button class="cp-btn cp-btn--sm cp-btn--ghost" type="button" (click)="confirmDelete.set('m' + m.id)">Hapus</button>
                      }
                    </td>
                  </tr>
                } @empty {
                  <tr><td colspan="4" class="cp-empty">Tidak ada jurusan.</td></tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      }
    </div>
  `,
  styles: `
    .cols4 { grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); }
    .cols2 { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
    .end { text-align: right; white-space: nowrap; }
    .search { min-height: 38px; width: min(320px, 100%); }
    .pick { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; }
    .pick-item {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 10px;
      border: 1px solid var(--border);
      border-radius: 999px;
      cursor: pointer;
      font-size: 0.875rem;
    }
    .pick-item.on { border-color: var(--primary); background: var(--primary-soft); }
  `,
})
export class WakaMaster {
  private readonly api = inject(WakaApi);
  private readonly fb = inject(FormBuilder);

  readonly tab = signal<Tab>('subjects');
  readonly subjects = signal<Subject[]>([]);
  readonly majors = signal<Major[]>([]);
  readonly busy = signal(false);
  readonly message = signal<{ text: string; error: boolean } | null>(null);
  readonly confirmDelete = signal<string | null>(null);
  readonly subjectEditId = signal<number | null>(null);
  readonly majorEditId = signal<number | null>(null);
  readonly picked = signal<string[]>([]);
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
      this.ok('Mapel disimpan.');
      this.resetSubject();
      this.load();
    });
  }

  deleteSubject(s: Subject): void {
    this.call(this.api.deleteSubject(s.id), () => {
      this.ok(`Mapel ${s.name} dihapus.`);
      this.load();
    });
  }

  // ---------------------------------------------------------------- jurusan

  togglePick(code: string): void {
    this.picked.update((p) => (p.includes(code) ? p.filter((c) => c !== code) : [...p, code]));
  }

  editMajor(m: Major): void {
    this.majorEditId.set(m.id);
    this.majorForm.setValue({ code: m.code, name: m.name });
    this.picked.set([...m.subjectCodes]);
  }

  resetMajor(): void {
    this.majorEditId.set(null);
    this.majorForm.reset({ code: '', name: '' });
    this.picked.set([]);
  }

  saveMajor(): void {
    const v = this.majorForm.getRawValue();
    const body = { code: v.code.trim(), name: v.name.trim(), subjectCodes: this.picked() };
    this.call(this.api.saveMajor(body, this.majorEditId() ?? undefined), () => {
      this.ok('Jurusan disimpan.');
      this.resetMajor();
      this.load();
    });
  }

  deleteMajor(m: Major): void {
    this.call(this.api.deleteMajor(m.id), () => {
      this.ok(`Jurusan ${m.name} dihapus.`);
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
