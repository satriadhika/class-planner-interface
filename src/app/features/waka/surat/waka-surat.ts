import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { problemMessage } from '../../../core/api/problem';
import { LetterData, StatementLetter } from '../../../shared/letter/statement-letter';
import { SchoolProfile, WakaApi } from '../waka-api';

/** Kop surat (profil sekolah) dan pratinjau surat pernyataan yang diterima murid. */
@Component({
  selector: 'app-waka-surat',
  imports: [ReactiveFormsModule, StatementLetter],
  template: `
    <div class="cp-page">
      <header class="cp-head cp-no-print">
        <div>
          <h1>Surat pernyataan</h1>
          <p>Surat dibuat otomatis untuk tiap murid setelah hasil kelas disetujui. Di sini lu atur kop surat dan nama kepala sekolah.</p>
        </div>
      </header>

      @if (message(); as m) {
        <div class="cp-alert cp-no-print" [class.cp-alert--error]="m.error" [class.cp-alert--ok]="!m.error">{{ m.text }}</div>
      }

      <div class="layout">
        <section class="cp-card cp-no-print">
          <h2>Profil sekolah</h2>
          <form class="cp-form" [formGroup]="form" (ngSubmit)="save()">
            <label class="cp-field"><span>Nama sekolah</span><input formControlName="name" /></label>
            <label class="cp-field"><span>Alamat</span><textarea rows="3" formControlName="address" placeholder="Jl. ..., Kota"></textarea></label>
            <label class="cp-field"><span>Telepon</span><input formControlName="phone" /></label>
            <label class="cp-field"><span>Email</span><input type="email" formControlName="email" /></label>
            <label class="cp-field"><span>Nama kepala sekolah</span><input formControlName="principalName" /></label>
            <p class="cp-small cp-muted">Kota pada tanggal surat diambil dari bagian terakhir alamat (setelah koma terakhir).</p>
            <div class="cp-row">
              <button class="cp-btn cp-btn--primary" type="submit" [disabled]="busy() || form.invalid">Simpan</button>
              <button class="cp-btn" type="button" (click)="print()">Cetak contoh</button>
            </div>
          </form>
        </section>

        <div class="preview">
          <p class="cp-small cp-muted cp-no-print">Pratinjau dengan data contoh</p>
          <div class="cp-print-area">
            <app-statement-letter [data]="sample()" />
          </div>
        </div>
      </div>
    </div>
  `,
  styles: `
    .layout { display: grid; gap: 20px; grid-template-columns: minmax(280px, 360px) 1fr; align-items: start; }
    .preview { min-width: 0; overflow-x: auto; }
    textarea { resize: vertical; }
    @media (max-width: 960px) { .layout { grid-template-columns: 1fr; } }
  `,
})
export class WakaSurat {
  private readonly api = inject(WakaApi);
  private readonly fb = inject(FormBuilder);

  readonly busy = signal(false);
  readonly message = signal<{ text: string; error: boolean } | null>(null);
  private readonly profile = signal<SchoolProfile | null>(null);
  private readonly draft = signal<Partial<SchoolProfile>>({});

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    address: [''],
    phone: [''],
    email: ['', Validators.email],
    principalName: [''],
  });

  readonly sample = computed<LetterData>(() => {
    const p = { ...this.profile(), ...this.draft() };
    return {
      school: {
        name: p.name || 'Nama Sekolah',
        address: p.address || null,
        phone: p.phone || null,
        email: p.email || null,
        principalName: p.principalName || null,
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

  constructor() {
    this.api.school().subscribe({
      next: (s) => {
        this.profile.set(s);
        this.form.setValue({
          name: s.name,
          address: s.address ?? '',
          phone: s.phone ?? '',
          email: s.email ?? '',
          principalName: s.principalName ?? '',
        });
      },
      error: (e: unknown) => this.fail(e),
    });
    this.form.valueChanges.subscribe((v) => this.draft.set(v as Partial<SchoolProfile>));
  }

  save(): void {
    const v = this.form.getRawValue();
    const body = {
      name: v.name.trim(),
      address: v.address.trim() || null,
      phone: v.phone.trim() || null,
      email: v.email.trim() || null,
      principalName: v.principalName.trim() || null,
    };
    this.busy.set(true);
    this.message.set(null);
    this.api.saveSchool(body).subscribe({
      next: (s) => {
        this.busy.set(false);
        this.profile.set(s);
        this.message.set({ text: 'Profil sekolah disimpan.', error: false });
      },
      error: (e: unknown) => this.fail(e),
    });
  }

  print(): void {
    window.print();
  }

  private fail(e: unknown): void {
    this.busy.set(false);
    this.message.set({ text: problemMessage(e), error: true });
  }
}
