import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

import { problemMessage } from '../../../core/api/problem';
import { fmtDate } from '../../../shared/labels/labels';
import { ImportResult, StudentRow, WakaApi } from '../waka-api';

/** Data murid: daftar, tambah/ubah/hapus, impor dari Excel. */
@Component({
  selector: 'app-waka-pengguna',
  imports: [ReactiveFormsModule],
  template: `
    <div class="cp-page">
      <header class="cp-head">
        <div>
          <h1>Data murid</h1>
          <p>Murid masuk dengan NIS dan tanggal lahir. Data bisa diisi satu per satu atau diimpor dari file Excel (format leger e-Rapor juga bisa).</p>
        </div>
      </header>

      @if (message(); as m) {
        <div class="cp-alert" [class.cp-alert--error]="m.error" [class.cp-alert--ok]="!m.error">{{ m.text }}</div>
      }

      <div class="cp-grid two">
        <!-- ===================== form ===================== -->
        <section class="cp-card">
          <h2>{{ editId() ? 'Ubah murid' : 'Tambah murid' }}</h2>
          <form class="cp-form" [formGroup]="form" (ngSubmit)="save()">
            <div class="cp-grid cols2">
              <label class="cp-field">
                <span>NIS</span>
                <input formControlName="studentNumber" inputmode="numeric" [readonly]="!!editId()" />
              </label>
              <label class="cp-field">
                <span>NISN (opsional)</span>
                <input formControlName="nisn" inputmode="numeric" />
              </label>
            </div>
            <label class="cp-field">
              <span>Nama lengkap</span>
              <input formControlName="fullName" />
            </label>
            <div class="cp-grid cols3">
              <label class="cp-field">
                <span>Tanggal lahir</span>
                <input type="date" formControlName="birthDate" />
              </label>
              <label class="cp-field">
                <span>Angkatan</span>
                <input type="number" formControlName="entryYear" />
              </label>
              <label class="cp-field">
                <span>Kelas sekarang</span>
                <input formControlName="classLabel" placeholder="X-1" />
              </label>
            </div>
            <div class="cp-row">
              <button class="cp-btn cp-btn--primary" type="submit" [disabled]="busy() || form.invalid">Simpan</button>
              @if (editId()) { <button class="cp-btn" type="button" (click)="reset()">Batal</button> }
            </div>
          </form>
        </section>

        <!-- ===================== impor ===================== -->
        <section class="cp-card">
          <h2>Impor dari Excel</h2>
          <p class="cp-sub">File .xlsx dengan kolom <strong>NIS</strong> dan <strong>NAMA SISWA</strong>. Kolom NISN, TANGGAL LAHIR, KELAS, dan ANGKATAN dipakai kalau ada.
            Kalau tidak ada kolom KELAS, nama sheet dipakai sebagai kelas. NIS yang sudah ada akan diperbarui.</p>
          <div class="cp-form">
            <label class="cp-field">
              <span>Angkatan (kalau tidak ada di file)</span>
              <input type="number" [value]="importYear() ?? ''" (input)="importYear.set(numOrNull($any($event.target).value))" />
            </label>
            <label class="cp-field">
              <span>File</span>
              <input type="file" accept=".xlsx,.xls" (change)="pick($event)" />
            </label>
            <div class="cp-row">
              <button class="cp-btn cp-btn--primary" type="button" [disabled]="busy() || !file()" (click)="importFile()">
                {{ busy() ? 'Mengimpor…' : 'Impor' }}
              </button>
            </div>
          </div>
          @if (result(); as r) {
            <div class="cp-stats result">
              <div class="cp-stat"><strong>{{ r.created }}</strong><span>baru</span></div>
              <div class="cp-stat"><strong>{{ r.updated }}</strong><span>diperbarui</span></div>
              <div class="cp-stat"><strong>{{ r.skipped }}</strong><span>dilewati</span></div>
            </div>
            @if (r.messages.length) {
              <ul class="msgs cp-small">@for (m of r.messages; track $index) { <li>{{ m }}</li> }</ul>
            }
          }
        </section>
      </div>

      <!-- ===================== daftar ===================== -->
      <section class="cp-card">
        <div class="cp-row">
          <h2>Daftar murid ({{ filtered().length }})</h2>
          <span class="cp-spacer"></span>
          <select (change)="year.set(numOrNull($any($event.target).value))" aria-label="Filter angkatan">
            <option value="" [selected]="year() === null">Semua angkatan</option>
            @for (y of years(); track y) { <option [value]="y" [selected]="year() === y">Angkatan {{ y }}</option> }
          </select>
          <input class="search" type="search" placeholder="Cari nama atau NIS" [value]="query()" (input)="query.set($any($event.target).value)" aria-label="Cari murid" />
        </div>
        <div class="cp-table-wrap">
          <table class="cp-table">
            <thead><tr><th>NIS</th><th>Nama</th><th>Kelas</th><th>Angkatan</th><th>Tgl lahir</th><th>Akun</th><th></th></tr></thead>
            <tbody>
              @for (s of filtered(); track s.id) {
                <tr>
                  <td>{{ s.studentNumber }}</td>
                  <td><strong>{{ s.fullName }}</strong>@if (s.nisn) { <div class="cp-small cp-muted">NISN {{ s.nisn }}</div> }</td>
                  <td>{{ s.classLabel ?? '-' }}</td>
                  <td>{{ s.entryYear }}</td>
                  <td>{{ date(s.birthDate) }}</td>
                  <td><span class="cp-badge" [class.cp-badge--ok]="s.activated">{{ s.activated ? 'Aktif' : 'Belum aktivasi' }}</span></td>
                  <td class="end">
                    @if (confirmDelete() === s.id) {
                      <span class="cp-small">Hapus?</span>
                      <button class="cp-btn cp-btn--sm cp-btn--danger" type="button" (click)="remove(s)">Ya</button>
                      <button class="cp-btn cp-btn--sm" type="button" (click)="confirmDelete.set(null)">Tidak</button>
                    } @else {
                      <button class="cp-btn cp-btn--sm cp-btn--ghost" type="button" (click)="edit(s)">Ubah</button>
                      <button class="cp-btn cp-btn--sm cp-btn--ghost" type="button" (click)="confirmDelete.set(s.id)">Hapus</button>
                    }
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="7" class="cp-empty">Belum ada murid.</td></tr>
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
      this.message.set({ text: 'Data murid disimpan.', error: false });
      this.reset();
      this.load();
    });
  }

  remove(s: StudentRow): void {
    this.call(this.api.deleteStudent(s.id), () => {
      this.message.set({ text: `${s.fullName} dihapus.`, error: false });
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
      this.message.set({ text: 'Impor selesai.', error: false });
      this.load();
    });
  }

  numOrNull(v: string): number | null {
    return v === '' || v == null ? null : Number(v);
  }

  date(iso: string): string {
    return fmtDate(iso);
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
