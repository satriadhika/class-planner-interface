import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { problemCode, problemMessage } from '../../../core/api/problem';
import { CLASS_TYPE_LABEL, TIER_LABEL, fmtDateTime } from '../../../shared/labels/labels';
import { MuridProgressService } from '../murid-progress.service';
import { ClassOption, ClassOptions, MuridApi } from '../murid-api';

/** Murid memilih kelas dari semua kelas yang memuat mapel jurusan 1. */
@Component({
  selector: 'app-pilih-kelas',
  imports: [DecimalPipe, RouterLink],
  template: `
    <div class="cp-page">
      <header class="cp-head">
        <div>
          <h1>Pilih kelas</h1>
          <p>Kelas diurutkan dari yang paling cocok dengan jurusan dan minatmu. Pilih yang paling sesuai menurutmu.</p>
        </div>
      </header>

      @if (message(); as m) {
        <div class="cp-alert" [class.cp-alert--error]="m.error" [class.cp-alert--ok]="!m.error">{{ m.text }}</div>
      }

      @if (notOpen()) {
        <div class="cp-empty">
          Pemilihan kelas belum dibuka. Pastikan kuesionermu sudah dikirim, nanti kamu dapat kabar saat kelas bisa dipilih.
          <a routerLink="/murid">Kembali ke beranda</a>
        </div>
      }

      @if (data(); as d) {
        <section class="cp-card summary">
          <div class="cp-row">
            <div>
              <div class="cp-small cp-muted">Jurusan pilihanmu</div>
              <strong>1. {{ d.major1 ?? '-' }}</strong>
              @if (d.major2) { <span class="cp-muted"> · </span><strong>2. {{ d.major2 }}</strong> }
            </div>
            <span class="cp-spacer"></span>
            <div class="right">
              @if (d.cycleStatus === 'SELECTION_OPEN') {
                <div class="cp-small cp-muted">Ditutup {{ fmt(d.selectionCloseAt) }}</div>
              } @else {
                <span class="cp-badge">Pemilihan sudah ditutup</span>
              }
              @if (d.currentClassId) {
                <div class="cp-small">Sisa kesempatan ganti: <strong>{{ changesLeft() }}</strong> dari {{ d.maxChanges }}</div>
              }
            </div>
          </div>
          <div class="cp-alert cp-alert--warn note">
            Pilihanmu jadi prioritas, tapi kelas final bisa berbeda kalau kelas yang kamu pilih kelebihan murid.
            Kalau dipindah, kamu tetap ditempatkan di kelas yang memuat mapel jurusan 1-mu dan sekecil mungkin selisih kecocokannya.
          </div>
        </section>

        <div class="options">
          @for (o of d.options; track o.classId; let i = $index) {
            <article class="cp-card option" [class.chosen]="o.classId === d.currentClassId">
              <div class="cp-row top">
                <h2>Kelas {{ o.label }}</h2>
                @if (i === 0) { <span class="cp-badge cp-badge--ok">Paling cocok</span> }
                @if (o.classId === d.currentClassId) { <span class="cp-badge cp-badge--primary">Pilihanmu</span> }
                <span class="cp-spacer"></span>
                <span class="cp-small cp-muted">{{ typeLabel[o.type] }}</span>
              </div>

              <div class="score">
                <strong>{{ o.matchPercent | number: '1.0-1' }}%</strong>
                <span>kecocokan</span>
              </div>
              <div class="cp-bar"><i [style.width.%]="o.matchPercent"></i></div>
              <p class="cp-small tier"><span [class]="'cp-badge cp-badge--tier' + o.tier">P{{ o.tier }}</span> {{ tierLabel[o.tier] }}</p>

              <div class="cp-chips">
                @for (s of o.subjects; track s) {
                  <span class="cp-chip" [class.need]="!o.extraSubjects.includes(s)">{{ s }}</span>
                }
              </div>

              <dl class="cover cp-small">
                <div><dt>Mapel jurusan 1</dt><dd>{{ o.major1Coverage | number: '1.0-0' }}% terpenuhi</dd></div>
                <div><dt>Mapel jurusan 2</dt><dd>{{ d.major2 ? (o.major2Coverage | number: '1.0-0') + '% terpenuhi' : '-' }}</dd></div>
              </dl>
              @if (o.missingMajor1.length || o.missingMajor2.length) {
                <p class="cp-small missing">
                  Tidak ada di kelas ini:
                  @for (m of missingAll(o); track m) { <span class="cp-chip cp-chip--missing">{{ m }}</span> }
                </p>
              }
              @if (o.extraSubjects.length) {
                <p class="cp-small cp-muted">Mapel tambahan (di luar kebutuhan jurusanmu): {{ o.extraSubjects.join(', ') }}</p>
              }

              @if (d.editable && o.classId !== d.currentClassId) {
                @if (confirming() === o.classId) {
                  <div class="cp-row">
                    <span class="cp-small">{{ d.currentClassId ? 'Ganti ke kelas ' + o.label + '? Sisa kesempatan jadi ' + (changesLeft() - 1) + '.' : 'Pilih kelas ' + o.label + '?' }}</span>
                    <button class="cp-btn cp-btn--primary cp-btn--sm" type="button" [disabled]="busy()" (click)="choose(o)">Ya</button>
                    <button class="cp-btn cp-btn--sm" type="button" (click)="confirming.set(null)">Batal</button>
                  </div>
                } @else {
                  <button class="cp-btn" [class.cp-btn--primary]="!d.currentClassId" type="button" (click)="confirming.set(o.classId)">
                    {{ d.currentClassId ? 'Ganti ke kelas ini' : 'Pilih kelas ini' }}
                  </button>
                }
              }
            </article>
          } @empty {
            <div class="cp-empty">Belum ada kelas yang memuat mapel jurusan 1-mu. Hubungi waka kurikulum.</div>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .summary .right { text-align: right; }
    .note { margin: 14px 0 0; }
    .options { display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); }
    .option { display: flex; flex-direction: column; gap: 10px; }
    .option.chosen { border-color: var(--primary); box-shadow: 0 0 0 2px var(--primary-soft); }
    .option h2 { margin: 0; }
    .top { gap: 8px; }
    .score { display: flex; align-items: baseline; gap: 6px; }
    .score strong { font-size: 2rem; line-height: 1; }
    .score span { color: var(--muted); }
    .tier { margin: 0; display: flex; align-items: center; gap: 6px; }
    .cover { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 0; }
    .cover dt { color: var(--muted); }
    .cover dd { margin: 0; font-weight: 600; }
    .missing { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin: 0; }
    .cp-chip.need { background: var(--primary-soft); color: var(--primary); font-weight: 600; }
    .option > button { margin-top: auto; align-self: flex-start; }
    @media (max-width: 640px) { .summary .right { text-align: left; } }
  `,
})
export class PilihKelas {
  private readonly api = inject(MuridApi);
  private readonly progress = inject(MuridProgressService);

  readonly typeLabel = CLASS_TYPE_LABEL;
  readonly tierLabel = TIER_LABEL;

  readonly data = signal<ClassOptions | null>(null);
  readonly notOpen = signal(false);
  readonly busy = signal(false);
  readonly confirming = signal<number | null>(null);
  readonly message = signal<{ text: string; error: boolean } | null>(null);

  readonly changesLeft = computed(() => {
    const d = this.data();
    return d ? Math.max(0, d.maxChanges - d.changesUsed) : 0;
  });

  constructor() {
    this.api.classOptions().subscribe({
      next: (d) => this.data.set(d),
      error: (e: unknown) => {
        if (problemCode(e) === 'SELECTION_NOT_OPEN') this.notOpen.set(true);
        else this.message.set({ text: problemMessage(e), error: true });
      },
    });
  }

  choose(o: ClassOption): void {
    const first = !this.data()?.currentClassId;
    this.busy.set(true);
    this.message.set(null);
    this.api.choose(o.classId).subscribe({
      next: (d) => {
        this.busy.set(false);
        this.confirming.set(null);
        this.data.set(d);
        this.message.set({ text: first ? `Kamu memilih kelas ${o.label}.` : `Pilihan diganti ke kelas ${o.label}.`, error: false });
        this.progress.load().subscribe();
      },
      error: (e: unknown) => {
        this.busy.set(false);
        this.confirming.set(null);
        this.message.set({ text: problemMessage(e), error: true });
      },
    });
  }

  missingAll(o: ClassOption): string[] {
    return [...new Set([...o.missingMajor1, ...o.missingMajor2])];
  }

  fmt(iso: string | null): string {
    return fmtDateTime(iso);
  }
}
