import { DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';

import { problemMessage } from '../../../core/api/problem';
import { CLASS_TYPE_LABEL, SOURCE_LABEL, TIER_LABEL, fmtDateTime } from '../../../shared/labels/labels';
import { CycleBar } from '../cycle-bar';
import { CycleStore } from '../cycle-store';
import { ClassInfo, PlacementBoard, RebalanceResult, WakaApi } from '../waka-api';

/** Pemilihan kelas → pemerataan → pindah manual → setujui. */
@Component({
  selector: 'app-waka-penempatan',
  imports: [RouterLink, DecimalPipe, NgTemplateOutlet, CycleBar],
  template: `
    <div class="cp-page">
      <header class="cp-head">
        <div>
          <h1>Penempatan murid</h1>
          <p>Tutup pemilihan kelas, jalankan pemerataan, periksa hasilnya, lalu setujui. Setelah disetujui, hasil tidak bisa diubah.</p>
        </div>
      </header>

      <app-cycle-bar (changed)="reload()" />

      @if (message(); as m) {
        <div class="cp-alert" [class.cp-alert--error]="m.error" [class.cp-alert--ok]="!m.error">{{ m.text }}</div>
      }

      @if (store.detail(); as d) {
        @switch (d.cycle.status) {
          <!-- ===================== pemilihan berjalan ===================== -->
          @case ('SELECTION_OPEN') {
            <section class="cp-card">
              <h2>Pemilihan kelas sedang berjalan</h2>
              <p class="cp-sub">{{ d.stats.choices }} dari {{ d.stats.students }} murid sudah memilih. Ditutup: {{ fmt(d.cycle.selectionCloseAt) }}.
                Murid yang tidak memilih akan ditempatkan di kelas yang paling cocok.</p>
              <div class="cp-bar"><i [style.width.%]="pct(d.stats.choices, d.stats.students)"></i></div>
              <div class="choice-grid">
                @for (c of classes(); track c.id) {
                  <div class="cp-stat"><strong>{{ c.choiceCount }}</strong><span>memilih kelas {{ c.label }}</span></div>
                }
              </div>
              <div class="cp-row actions">
                <button class="cp-btn cp-btn--primary" type="button" [disabled]="busy()" (click)="status('SELECTION_CLOSED')">Tutup pemilihan kelas</button>
              </div>
            </section>
          }

          <!-- ===================== siap pemerataan ===================== -->
          @case ('SELECTION_CLOSED') {
            <section class="cp-card">
              <h2>Pemerataan kelas</h2>
              <p class="cp-sub">
                Pilihan murid diutamakan. Murid dipindah hanya kalau kelasnya kelebihan, ke kelas yang tetap memuat mapel jurusan 1
                dengan kecocokan di atas batas. Turun prioritas lebih dihindari daripada jumlah murid yang dipindah.
              </p>
              <div class="cp-row">
                <label class="cp-field min">
                  <span>Batas kecocokan minimal (%)</span>
                  <input type="number" min="0" max="100" [value]="minMatch()" (input)="minMatch.set(+$any($event.target).value)" />
                </label>
                <button class="cp-btn cp-btn--primary" type="button" [disabled]="busy()" (click)="preview()">
                  {{ busy() ? 'Menghitung…' : 'Hitung pemerataan' }}
                </button>
                <button class="cp-btn" type="button" [disabled]="busy()" (click)="status('SELECTION_OPEN')">Buka lagi pemilihan</button>
              </div>
            </section>

            @if (rebalance(); as r) {
              <section class="cp-card">
                <div class="cp-row">
                  <div>
                    <h2>Hasil pemerataan</h2>
                    <p class="cp-sub">{{ r.moves.length }} murid dipindah.</p>
                  </div>
                  <span class="cp-spacer"></span>
                  @if (r.status !== 'INFEASIBLE' && r.status !== 'NO_SOLUTION_IN_TIME') {
                    <button class="cp-btn cp-btn--primary" type="button" [disabled]="busy()" (click)="apply()">Terapkan hasil ini</button>
                  }
                </div>
                @for (p of r.problems; track p) { <div class="cp-alert cp-alert--error">{{ p }}</div> }
                @for (w of r.warnings; track w) { <div class="cp-alert cp-alert--warn">{{ w }}</div> }

                <div class="cp-table-wrap sizes">
                  <table class="cp-table">
                    <thead><tr><th>Kelas</th><th class="num">Sebelum</th><th class="num">Sesudah</th></tr></thead>
                    <tbody>
                      @for (c of r.classes; track c.label) {
                        <tr><td>Kelas {{ c.label }}</td><td class="num">{{ c.before }}</td><td class="num"><strong>{{ c.after }}</strong></td></tr>
                      }
                    </tbody>
                  </table>
                </div>

                @if (r.moves.length > 0) {
                  <div class="cp-table-wrap">
                    <table class="cp-table">
                      <thead><tr><th>Murid</th><th>Dari</th><th>Ke</th><th class="num">Kecocokan</th><th>Prioritas</th></tr></thead>
                      <tbody>
                        @for (m of r.moves; track m.studentId) {
                          <tr>
                            <td><strong>{{ m.fullName }}</strong><div class="cp-small cp-muted">{{ m.studentNumber }}</div></td>
                            <td>{{ m.from }}</td>
                            <td>{{ m.to }}</td>
                            <td class="num">{{ m.matchBefore | number: '1.1-1' }}% → <strong [class.bad]="m.belowThreshold">{{ m.matchAfter | number: '1.1-1' }}%</strong></td>
                            <td><span [class]="'cp-badge cp-badge--tier' + m.tierBefore">P{{ m.tierBefore }}</span> → <span [class]="'cp-badge cp-badge--tier' + m.tierAfter">P{{ m.tierAfter }}</span></td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                }
              </section>
            }
          }

          <!-- ===================== tinjau / final ===================== -->
          @case ('REBALANCED') {
            <ng-container [ngTemplateOutlet]="boardTpl" />
          }
          @case ('FINALIZED') {
            <div class="cp-alert cp-alert--ok">Hasil kelas sudah disetujui pada {{ fmt(d.cycle.finalizedAt) }}. Murid sudah bisa melihat kelas final dan surat pernyataan.</div>
            <ng-container [ngTemplateOutlet]="boardTpl" />
          }
          @default {
            <div class="cp-empty">
              Penempatan dimulai setelah kelas disimpan dan pemilihan kelas dibuka.
              <a routerLink="/waka/kelas">Ke halaman Kelas</a>
            </div>
          }
        }
      }
    </div>

    <ng-template #boardTpl>
      @if (board(); as b) {
        <section class="cp-card">
          <div class="cp-row">
            <div>
              <h2>Hasil penempatan</h2>
              <p class="cp-sub">Ukuran rata: {{ b.minSize }}–{{ b.maxSize }} murid per kelas. {{ locked() ? '' : 'Ganti kelas murid lewat kolom "Pindah ke".' }}</p>
            </div>
            <span class="cp-spacer"></span>
            @if (!locked()) {
              <button class="cp-btn" type="button" [disabled]="busy()" (click)="status('SELECTION_CLOSED')">Batalkan pemerataan</button>
              @if (confirmFinal()) {
                <span class="cp-small">Setujui? Hasil tidak bisa diubah lagi.</span>
                <button class="cp-btn cp-btn--primary" type="button" [disabled]="busy()" (click)="finalize()">Ya, setujui</button>
                <button class="cp-btn" type="button" (click)="confirmFinal.set(false)">Batal</button>
              } @else {
                <button class="cp-btn cp-btn--primary" type="button" (click)="confirmFinal.set(true)">Setujui hasil</button>
              }
            }
          </div>

          <div class="cp-tabs class-tabs" role="tablist">
            @for (c of b.classes; track c.classId) {
              <button type="button" role="tab" [attr.aria-selected]="active() === c.classId" (click)="active.set(c.classId)">
                Kelas {{ c.label }}
                <span class="size" [class.bad]="c.size < b.minSize || c.size > b.maxSize">{{ c.size }}</span>
              </button>
            }
          </div>

          @for (c of b.classes; track c.classId) {
            @if (active() === c.classId) {
              <div class="cp-row class-info">
                <span class="cp-badge">{{ typeLabel[c.type] }}</span>
                <div class="cp-chips">@for (s of c.subjectNames; track s) { <span class="cp-chip">{{ s }}</span> }</div>
                <span class="cp-spacer"></span>
                <span class="cp-small">Rata-rata kecocokan <strong>{{ c.averageMatchPercent | number: '1.1-1' }}%</strong></span>
              </div>
              <div class="cp-table-wrap">
                <table class="cp-table">
                  <thead>
                    <tr><th>Murid</th><th>Kelas asal</th><th>Pilihan</th><th>Sumber</th><th>Prioritas</th><th class="num">Kecocokan</th>
                      @if (!locked()) { <th>Pindah ke</th> }</tr>
                  </thead>
                  <tbody>
                    @for (s of c.students; track s.studentId) {
                      <tr>
                        <td><strong>{{ s.fullName }}</strong><div class="cp-small cp-muted">{{ s.studentNumber }}</div></td>
                        <td>{{ s.fromClassLabel ?? '-' }}</td>
                        <td>{{ s.chosenClassLabel ?? 'tidak memilih' }}</td>
                        <td><span class="cp-badge" [class.cp-badge--primary]="s.source === 'MANUAL'">{{ sourceLabel[s.source] }}</span></td>
                        <td><span [class]="'cp-badge cp-badge--tier' + s.tier" [title]="tierLabel[s.tier]">P{{ s.tier }}</span></td>
                        <td class="num">{{ s.matchPercent | number: '1.1-1' }}%</td>
                        @if (!locked()) {
                          <td>
                            @if (s.locked) {
                              <span class="cp-small cp-muted">Terkunci</span>
                            } @else {
                              <select (change)="move(s.studentId, $any($event.target).value)" [attr.aria-label]="'Pindahkan ' + s.fullName">
                                <option value="" selected>—</option>
                                @for (o of s.options; track o.classId) {
                                  @if (o.classId !== c.classId) {
                                    <option [value]="o.classId">{{ o.label }} · P{{ o.tier }} · {{ o.matchPercent | number: '1.0-0' }}%</option>
                                  }
                                }
                              </select>
                            }
                          </td>
                        }
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          }
        </section>
      }
    </ng-template>
  `,
  styles: `
    .actions { margin-top: 16px; }
    .choice-grid { display: grid; gap: 10px; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); margin-top: 14px; }
    .min { max-width: 220px; }
    .sizes { margin: 12px 0; max-width: 420px; }
    .bad { color: var(--danger); }
    .class-tabs { margin: 14px 0; }
    .size {
      display: inline-grid;
      place-items: center;
      min-width: 24px;
      margin-left: 6px;
      padding: 0 6px;
      border-radius: 999px;
      background: var(--chip-bg);
      font-size: 0.75rem;
    }
    .size.bad { background: var(--danger-soft); }
    .class-info { margin-bottom: 12px; }
    select { min-height: 34px; max-width: 220px; }
  `,
})
export class WakaPenempatan {
  readonly store = inject(CycleStore);
  private readonly api = inject(WakaApi);

  readonly typeLabel = CLASS_TYPE_LABEL;
  readonly tierLabel = TIER_LABEL;
  readonly sourceLabel = SOURCE_LABEL;

  readonly classes = signal<ClassInfo[]>([]);
  readonly rebalance = signal<RebalanceResult | null>(null);
  readonly board = signal<PlacementBoard | null>(null);
  readonly active = signal<number | null>(null);
  readonly minMatch = signal(50);
  readonly busy = signal(false);
  readonly confirmFinal = signal(false);
  readonly message = signal<{ text: string; error: boolean } | null>(null);

  readonly locked = computed(() => this.store.status() === 'FINALIZED');

  constructor() {
    this.store.ensure().subscribe({ next: () => this.reload(), error: (e: unknown) => this.fail(e) });
  }

  reload(): void {
    const id = this.store.selectedId();
    this.rebalance.set(null);
    this.board.set(null);
    this.confirmFinal.set(false);
    if (!id) return;
    const status = this.store.status();
    if (status === 'SELECTION_OPEN') {
      this.api.classes(id).subscribe({ next: (c) => this.classes.set(c), error: (e: unknown) => this.fail(e) });
    }
    if (status === 'REBALANCED' || status === 'FINALIZED') {
      this.api.placements(id).subscribe({ next: (b) => this.setBoard(b), error: (e: unknown) => this.fail(e) });
    }
  }

  status(target: string): void {
    const id = this.store.selectedId();
    if (!id) return;
    this.busy.set(true);
    this.message.set(null);
    this.api.changeStatus(id, target).subscribe({
      next: (d) => {
        this.busy.set(false);
        this.store.setDetail(d);
        this.reload();
      },
      error: (e: unknown) => this.fail(e),
    });
  }

  preview(): void {
    const id = this.store.selectedId();
    if (!id) return;
    this.call(this.api.rebalancePreview(id, this.minMatch()), (r) => this.rebalance.set(r));
  }

  apply(): void {
    const id = this.store.selectedId();
    if (!id) return;
    this.call(this.api.rebalanceApply(id, this.minMatch()), () => {
      this.message.set({ text: 'Pemerataan diterapkan. Periksa hasilnya lalu setujui.', error: false });
      this.store.refresh().subscribe(() => this.reload());
    });
  }

  move(studentId: number, classId: string): void {
    const id = this.store.selectedId();
    if (!id || !classId) return;
    this.call(this.api.movePlacement(id, studentId, Number(classId)), (b) => {
      this.setBoard(b);
      this.message.set({ text: 'Murid dipindahkan.', error: false });
    });
  }

  finalize(): void {
    const id = this.store.selectedId();
    if (!id) return;
    this.call(this.api.finalize(id), () => {
      this.message.set({ text: 'Hasil kelas disetujui. Murid sekarang bisa melihat kelas final dan surat pernyataan.', error: false });
      this.store.refresh().subscribe(() => this.reload());
    });
  }

  pct(a: number, b: number): number {
    return b ? Math.round((a / b) * 100) : 0;
  }

  fmt(iso: string | null): string {
    return fmtDateTime(iso);
  }

  private setBoard(b: PlacementBoard): void {
    this.board.set(b);
    if (!b.classes.some((c) => c.classId === this.active())) this.active.set(b.classes[0]?.classId ?? null);
  }

  private call<T>(req: Observable<T>, done: (value: T) => void): void {
    this.busy.set(true);
    this.message.set(null);
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
