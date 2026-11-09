import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { problemMessage } from '../../../core/api/problem';
import { Icon, IconName } from '../../../shared/icon/icon';
import { CYCLE_FLOW, CYCLE_STATUS_LABEL, fmtDateTime } from '../../../shared/labels/labels';
import { CycleBar } from '../cycle-bar';
import { CycleStore } from '../cycle-store';

interface NextStep {
  title: string;
  text: string;
  link: string;
  cta: string;
  icon: IconName;
}

const NEXT: Record<string, NextStep> = {
  DRAFT: { title: 'Siapkan siklus', text: 'Lengkapi data murid, mapel, jurusan, dan nilai, lalu buka kuesioner.', link: '/waka/siklus', cta: 'Atur siklus', icon: 'repeat' },
  SURVEY_OPEN: { title: 'Kuesioner sedang berjalan', text: 'Pantau murid yang belum mengirim. Kuesioner bisa ditutup setelah semua murid mengirim.', link: '/waka/kuesioner', cta: 'Pantau kuesioner', icon: 'clipboard' },
  SURVEY_CLOSED: { title: 'Bentuk kelas', text: 'Jalankan simulasi kombinasi mapel per kelas, lalu simpan yang paling pas.', link: '/waka/kelas', cta: 'Simulasi kelas', icon: 'layers' },
  CLASSES_GENERATED: { title: 'Buka pemilihan kelas', text: 'Kelas sudah disimpan. Buka pemilihan supaya murid bisa memilih kelasnya.', link: '/waka/kelas', cta: 'Lihat kelas', icon: 'layers' },
  SELECTION_OPEN: { title: 'Murid sedang memilih kelas', text: 'Pantau jumlah murid yang sudah memilih, lalu tutup pemilihan.', link: '/waka/penempatan', cta: 'Pantau pemilihan', icon: 'shuffle' },
  SELECTION_CLOSED: { title: 'Jalankan pemerataan', text: 'Sistem memindahkan murid dari kelas yang kelebihan dengan tetap menjaga kecocokan.', link: '/waka/penempatan', cta: 'Pemerataan', icon: 'shuffle' },
  REBALANCED: { title: 'Tinjau & setujui', text: 'Periksa hasil penempatan, pindahkan murid secara manual bila perlu, lalu setujui.', link: '/waka/penempatan', cta: 'Tinjau penempatan', icon: 'badge-check' },
  FINALIZED: { title: 'Penjurusan selesai', text: 'Hasil sudah final. Murid bisa melihat kelas dan mengunduh surat pernyataan.', link: '/waka/penempatan', cta: 'Lihat hasil', icon: 'award' },
};

@Component({
  selector: 'app-waka-beranda',
  imports: [RouterLink, Icon, CycleBar],
  template: `
    <div class="cp-page">
      <header class="cp-head">
        <div>
          <h1>Ringkasan penjurusan</h1>
          <p>Pantau setiap tahap penjurusan kelas 11 di satu tempat.</p>
        </div>
      </header>

      @if (error()) {
        <div class="cp-alert cp-alert--error">{{ error() }}</div>
      }

      <app-cycle-bar />

      @if (store.detail(); as d) {
        @if (next(); as n) {
          <section class="cp-card next">
            <span class="next-icon"><app-icon [name]="n.icon" [size]="22" /></span>
            <div class="next-text">
              <h2>{{ n.title }}</h2>
              <p>{{ n.text }}</p>
            </div>
            <a class="cp-btn cp-btn--primary" [routerLink]="n.link">
              {{ n.cta }} <app-icon name="arrow-right" [size]="16" />
            </a>
          </section>
        }

        <section class="cp-stats">
          <div class="cp-stat"><strong>{{ d.stats.students }}</strong><span>Murid angkatan {{ d.cycle.cohortEntryYear }}</span></div>
          <div class="cp-stat">
            <strong>{{ d.stats.questionnaireSubmitted }}<small>/{{ d.stats.students }}</small></strong>
            <span>Kuesioner terkirim</span>
            <div class="cp-bar"><i [style.width.%]="pct(d.stats.questionnaireSubmitted, d.stats.students)"></i></div>
          </div>
          <div class="cp-stat"><strong>{{ d.stats.classes }}</strong><span>Kelas disimpan</span></div>
          <div class="cp-stat">
            <strong>{{ d.stats.choices }}<small>/{{ d.stats.students }}</small></strong>
            <span>Sudah memilih kelas</span>
            <div class="cp-bar"><i [style.width.%]="pct(d.stats.choices, d.stats.students)"></i></div>
          </div>
          <div class="cp-stat"><strong>{{ d.stats.placements }}</strong><span>Murid ditempatkan</span></div>
        </section>

        <section class="cp-card">
          <h2>Tahapan</h2>
          <p class="cp-sub">{{ d.cycle.name }} · tahun ajaran {{ d.cycle.targetAcademicYear }}</p>
          <ol class="flow">
            @for (s of flow; track s; let i = $index) {
              <li [class.done]="i < currentIndex()" [class.current]="i === currentIndex()">
                <span class="dot">
                  @if (i < currentIndex()) {
                    <app-icon name="check" [size]="13" />
                  } @else {
                    {{ i + 1 }}
                  }
                </span>
                <span>{{ statusLabel[s] }}</span>
              </li>
            }
          </ol>
          <div class="cp-row cp-small cp-muted dates">
            <span>Kuesioner ditutup: {{ fmt(d.cycle.surveyCloseAt) }}</span>
            <span>Pemilihan kelas ditutup: {{ fmt(d.cycle.selectionCloseAt) }}</span>
          </div>
        </section>

        <section class="cp-card">
          <h2>Kelengkapan data</h2>
          <p class="cp-sub">Pastikan data ini lengkap sebelum membuka kuesioner.</p>
          <div class="checks">
            <a routerLink="/waka/pengguna" class="check"><app-icon name="users" [size]="18" /> Data murid</a>
            <a routerLink="/waka/master" class="check"><app-icon name="database" [size]="18" /> Mapel & jurusan</a>
            <a routerLink="/waka/upload" class="check"><app-icon name="upload" [size]="18" /> Nilai rapor & minat bakat</a>
            <a routerLink="/waka/surat" class="check"><app-icon name="file-pen" [size]="18" /> Kop surat sekolah</a>
          </div>
        </section>
      }
    </div>
  `,
  styles: `
    .next {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 16px;
      background: linear-gradient(135deg, var(--primary-soft), var(--surface));
    }
    .next-icon {
      display: grid;
      place-items: center;
      width: 46px;
      height: 46px;
      border-radius: 14px;
      background: var(--primary);
      color: #fff;
    }
    .next-text {
      flex: 1 1 260px;
      h2 { margin: 0; font-size: 1.1rem; color: var(--brand-ink); }
      p { margin: 4px 0 0; color: var(--muted); }
    }
    .cp-stat small { font-size: 0.9rem; color: var(--muted); font-weight: 600; }
    .cp-stat .cp-bar { margin-top: 10px; }
    .flow {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 10px;
      margin: 0;
      padding: 0;
      list-style: none;
      li {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px;
        border-radius: 12px;
        background: var(--surface-tint);
        color: var(--muted);
        font-size: 0.85rem;
        font-weight: 600;
      }
      li.done { color: var(--ipa); background: var(--ipa-soft); }
      li.current { color: #fff; background: var(--primary); }
    }
    .dot {
      display: grid;
      place-items: center;
      flex: none;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: rgb(255 255 255 / 0.6);
      font-size: 0.75rem;
    }
    .dates { margin-top: 14px; gap: 6px 20px; }
    .checks {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 10px;
    }
    .check {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 14px;
      border-radius: 12px;
      border: 1px solid var(--border);
      color: var(--brand-ink);
      font-weight: 600;
      text-decoration: none;
      &:hover { border-color: var(--primary); }
    }
  `,
})
export class WakaBeranda {
  readonly store = inject(CycleStore);
  readonly flow = CYCLE_FLOW;
  readonly statusLabel = CYCLE_STATUS_LABEL;
  readonly error = signal<string | null>(null);

  readonly currentIndex = computed(() => CYCLE_FLOW.indexOf((this.store.status() ?? 'DRAFT') as (typeof CYCLE_FLOW)[number]));
  readonly next = computed(() => NEXT[this.store.status() ?? ''] ?? null);

  constructor() {
    this.store.load().subscribe({ error: (e: unknown) => this.error.set(problemMessage(e)) });
  }

  pct(a: number, b: number): number {
    return b ? Math.round((a / b) * 100) : 0;
  }

  fmt(iso: string | null): string {
    return fmtDateTime(iso);
  }
}
