import { Component, computed, input, signal } from '@angular/core';

import { BRANDING } from '../../core/config/branding';

export interface LetterData {
  school: { name: string; address: string | null; phone: string | null; email: string | null; principalName: string | null };
  student: { fullName: string; studentNumber: string; nisn: string | null; currentClassLabel: string | null };
  cycleName: string;
  targetAcademicYear: string;
  classLabel: string;
  subjects: string[];
  major1: string | null;
  major2: string | null;
  finalizedAt: string | null;
}

/** Surat pernyataan pemilihan mapel, ukuran A4. Dicetak lewat window.print(). */
@Component({
  selector: 'app-statement-letter',
  template: `
    <article class="letter">
      <header class="kop">
        @if (logo && !logoFailed()) { <img [src]="logo" alt="" (error)="logoFailed.set(true)" /> }
        <div>
          <strong class="school">{{ data().school.name }}</strong>
          @if (data().school.address) { <div>{{ data().school.address }}</div> }
          <div>
            @if (data().school.phone) { Telp. {{ data().school.phone }} }
            @if (data().school.phone && data().school.email) { · }
            @if (data().school.email) { {{ data().school.email }} }
          </div>
        </div>
      </header>

      <h1>SURAT PERNYATAAN<br />PEMILIHAN MATA PELAJARAN PILIHAN</h1>
      <p class="center">Tahun Ajaran {{ data().targetAcademicYear }}</p>

      <p>Yang bertanda tangan di bawah ini:</p>
      <table class="id">
        <tr><td>Nama murid</td><td>:</td><td>{{ data().student.fullName }}</td></tr>
        <tr><td>NIS / NISN</td><td>:</td><td>{{ data().student.studentNumber }} / {{ data().student.nisn ?? '-' }}</td></tr>
        <tr><td>Kelas asal</td><td>:</td><td>{{ data().student.currentClassLabel ?? '-' }}</td></tr>
        <tr><td>Rencana jurusan 1</td><td>:</td><td>{{ data().major1 ?? '-' }}</td></tr>
        <tr><td>Rencana jurusan 2</td><td>:</td><td>{{ data().major2 ?? '-' }}</td></tr>
      </table>

      <p>
        menyatakan bersedia mengikuti pembelajaran di <strong>Kelas {{ data().classLabel }}</strong> pada kelas 11
        dengan mata pelajaran pilihan sebagai berikut:
      </p>
      <ol class="subjects">
        @for (s of data().subjects; track s) { <li>{{ s }}</li> }
      </ol>
      <p>
        Mata pelajaran pilihan tersebut akan diikuti sampai kelas 12. Surat pernyataan ini dibuat dengan sadar dan
        atas persetujuan orang tua/wali.
      </p>

      <p class="place">{{ city() }}, {{ today }}</p>
      <div class="signs">
        <div>
          <p>Mengetahui,<br />Orang tua/wali</p>
          <span class="line"></span>
          <p class="name">(............................................)</p>
        </div>
        <div>
          <p><br />Murid</p>
          <span class="line"></span>
          <p class="name">{{ data().student.fullName }}</p>
        </div>
      </div>
      <div class="signs single">
        <div>
          <p>Mengetahui,<br />Kepala Sekolah</p>
          <span class="line"></span>
          <p class="name">{{ data().school.principalName ?? '(............................................)' }}</p>
        </div>
      </div>
    </article>
  `,
  styles: `
    :host { display: block; }
    .letter {
      box-sizing: border-box;
      width: 100%;
      max-width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 18mm 20mm;
      background: #fff;
      color: #111;
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.5;
      box-shadow: 0 2px 16px rgb(0 0 0 / 0.08);
    }
    .kop {
      display: flex;
      align-items: center;
      gap: 16px;
      padding-bottom: 10px;
      margin-bottom: 18px;
      border-bottom: 3px double #111;
      text-align: center;
      font-size: 10.5pt;
      line-height: 1.35;
    }
    .kop img { width: 72px; height: 72px; object-fit: contain; }
    .kop > div { flex: 1; }
    .school { display: block; font-size: 15pt; text-transform: uppercase; letter-spacing: 0.02em; }
    h1 { margin: 0; font-size: 13pt; text-align: center; text-decoration: underline; line-height: 1.4; }
    .center { text-align: center; margin-top: 2px; }
    .id { border-collapse: collapse; margin: 6px 0 10px 18px; }
    .id td { padding: 1px 6px 1px 0; vertical-align: top; }
    .id td:first-child { width: 150px; }
    .subjects { margin: 4px 0 10px 18px; }
    .place { text-align: right; margin-top: 24px; }
    .signs { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; text-align: center; }
    .signs.single { grid-template-columns: 1fr; justify-items: center; margin-top: 18px; }
    .signs p { margin: 0; }
    .line { display: block; height: 64px; }
    .name { font-weight: 600; }
    @media (max-width: 640px) {
      .letter { padding: 20px 16px; min-height: 0; font-size: 11pt; }
    }
    @media print {
      .letter { box-shadow: none; padding: 0; min-height: 0; max-width: none; }
    }
  `,
})
export class StatementLetter {
  readonly data = input.required<LetterData>();

  readonly logo = BRANDING.logoUrl;
  readonly logoFailed = signal(false);
  readonly today = new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date());

  /** Kota diambil dari bagian terakhir alamat sekolah; kosong kalau tidak ada. */
  readonly city = computed(() => {
    const addr = this.data().school.address ?? '';
    const last = addr.split(',').map((p) => p.trim()).filter(Boolean).pop() ?? '';
    return last.replace(/\d+/g, '').trim() || '..................';
  });
}
