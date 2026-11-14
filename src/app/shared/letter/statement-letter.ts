import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, input, signal } from '@angular/core';

import { BRANDING } from '../../core/config/branding';
import { LetterTemplate, LetterValues, Segment, parseLetter, renderLetterText } from './letter-template';

export interface LetterData {
  school: {
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    principalName: string | null;
    /** Isi surat yang diatur waka (JSON); kosong = isi bawaan */
    letterTemplate?: string | null;
  };
  student: { fullName: string; studentNumber: string; nisn: string | null; currentClassLabel: string | null };
  cycleName: string;
  targetAcademicYear: string;
  classLabel: string;
  subjects: string[];
  major1: string | null;
  major2: string | null;
  finalizedAt: string | null;
}

type Rendered = Record<keyof Pick<LetterTemplate,
  'title' | 'subtitle' | 'opening' | 'body' | 'closing' | 'signParent' | 'signStudent' | 'signPrincipal'>, Segment[][]>;

/**
 * Surat pernyataan pemilihan mapel, ukuran A4. Dicetak lewat window.print().
 * Isi teks mengikuti template sekolah (lihat letter-template.ts); kop, data murid, dan daftar mapel tetap otomatis.
 * Surat selalu berbahasa Indonesia karena dokumen resmi sekolah.
 */
@Component({
  selector: 'app-statement-letter',
  template: `
    <ng-template #rich let-lines>
      @for (line of lines; track $index; let last = $last) {
        @for (seg of line; track $index) {
          @if (seg.bold) { <strong>{{ seg.text }}</strong> } @else { {{ seg.text }} }
        }
        @if (!last) { <br /> }
      }
    </ng-template>

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

      @let r = text();
      <h1><ng-container *ngTemplateOutlet="rich; context: { $implicit: r.title }" /></h1>
      @if (tpl().subtitle) {
        <p class="center"><ng-container *ngTemplateOutlet="rich; context: { $implicit: r.subtitle }" /></p>
      }

      @if (tpl().opening) { <p><ng-container *ngTemplateOutlet="rich; context: { $implicit: r.opening }" /></p> }
      <table class="id">
        <tr><td>Nama murid</td><td>:</td><td>{{ data().student.fullName }}</td></tr>
        <tr><td>NIS / NISN</td><td>:</td><td>{{ data().student.studentNumber }} / {{ data().student.nisn ?? '-' }}</td></tr>
        <tr><td>Kelas asal</td><td>:</td><td>{{ data().student.currentClassLabel ?? '-' }}</td></tr>
        <tr><td>Rencana jurusan 1</td><td>:</td><td>{{ data().major1 ?? '-' }}</td></tr>
        <tr><td>Rencana jurusan 2</td><td>:</td><td>{{ data().major2 ?? '-' }}</td></tr>
      </table>

      @if (tpl().body) { <p><ng-container *ngTemplateOutlet="rich; context: { $implicit: r.body }" /></p> }
      <ol class="subjects">
        @for (s of data().subjects; track s) { <li>{{ s }}</li> }
      </ol>
      @if (tpl().closing) { <p><ng-container *ngTemplateOutlet="rich; context: { $implicit: r.closing }" /></p> }

      <p class="place">{{ city() }}, {{ today }}</p>
      <div class="signs" [class.single]="!tpl().showParent">
        @if (tpl().showParent) {
          <div>
            <p><ng-container *ngTemplateOutlet="rich; context: { $implicit: r.signParent }" /></p>
            <span class="line"></span>
            <p class="name">(............................................)</p>
          </div>
        }
        <div>
          <p>@for (pad of studentPad(); track $index) { <br /> }<ng-container *ngTemplateOutlet="rich; context: { $implicit: r.signStudent }" /></p>
          <span class="line"></span>
          <p class="name">{{ data().student.fullName }}</p>
        </div>
      </div>
      @if (tpl().showPrincipal) {
        <div class="signs single principal">
          <div>
            <p><ng-container *ngTemplateOutlet="rich; context: { $implicit: r.signPrincipal }" /></p>
            <span class="line"></span>
            <p class="name">{{ data().school.principalName ?? '(............................................)' }}</p>
          </div>
        </div>
      }
    </article>
  `,
  imports: [NgTemplateOutlet],
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
    .signs.single { grid-template-columns: 1fr; justify-items: center; }
    .signs.principal { margin-top: 18px; }
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
  /** Template yang sedang diedit (pratinjau di halaman waka). Kalau kosong, pakai template dari data sekolah. */
  readonly template = input<LetterTemplate | null>(null);

  readonly logo = BRANDING.logoUrl;
  readonly logoFailed = signal(false);
  readonly today = new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date());

  readonly tpl = computed(() => this.template() ?? parseLetter(this.data().school.letterTemplate));

  /** Nilai isian otomatis untuk {nama}, {kelas}, dst. */
  readonly values = computed<LetterValues>(() => {
    const d = this.data();
    return {
      nama: d.student.fullName,
      nis: d.student.studentNumber,
      nisn: d.student.nisn ?? '-',
      kelas_asal: d.student.currentClassLabel ?? '-',
      kelas: d.classLabel,
      tahun_ajaran: d.targetAcademicYear,
      jurusan1: d.major1 ?? '-',
      jurusan2: d.major2 ?? '-',
      sekolah: d.school.name,
      kepala_sekolah: d.school.principalName ?? '',
    };
  });

  readonly text = computed<Rendered>(() => {
    const t = this.tpl();
    const v = this.values();
    return {
      title: renderLetterText(t.title, v),
      subtitle: renderLetterText(t.subtitle, v),
      opening: renderLetterText(t.opening, v),
      body: renderLetterText(t.body, v),
      closing: renderLetterText(t.closing, v),
      signParent: renderLetterText(t.signParent, v),
      signStudent: renderLetterText(t.signStudent, v),
      signPrincipal: renderLetterText(t.signPrincipal, v),
    };
  });

  /** Kota dari template, atau dari bagian terakhir alamat sekolah; titik-titik kalau tidak ada. */
  readonly city = computed(() => {
    const fromTemplate = this.tpl().city.trim();
    if (fromTemplate) return fromTemplate;
    const addr = this.data().school.address ?? '';
    const last = addr.split(',').map((p) => p.trim()).filter(Boolean).pop() ?? '';
    return last.replace(/\d+/g, '').trim() || '..................';
  });

  /** Baris kosong di atas label "Murid" supaya sejajar dengan label orang tua/wali yang lebih panjang. */
  readonly studentPad = computed(() => {
    if (!this.tpl().showParent) return [];
    const t = this.text();
    return Array.from({ length: Math.max(0, t.signParent.length - t.signStudent.length) });
  });
}
