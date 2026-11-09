import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { problemMessage } from '../../../core/api/problem';
import { CLASS_TYPE_LABEL, TIER_LABEL } from '../../../shared/labels/labels';
import { CycleBar } from '../cycle-bar';
import { CycleStore } from '../cycle-store';
import { ClassInfo, ClassPlanResult, WakaApi } from '../waka-api';

/** Simulasi kombinasi mapel per kelas, simpan sebagai kelas resmi, dan buka pemilihan kelas. */
@Component({
  selector: 'app-waka-kelas',
  imports: [ReactiveFormsModule, RouterLink, DecimalPipe, CycleBar],
  template: `
    <div class="cp-page">
      <header class="cp-head">
        <div>
          <h1>Kelas</h1>
          <p>Sistem mencari kombinasi 5 mapel per kelas yang paling banyak memenuhi jurusan murid, lalu membagi murid secara rata.</p>
        </div>
      </header>

      <app-cycle-bar (changed)="reload()" />

      @if (message(); as m) {
        <div class="cp-alert" [class.cp-alert--error]="m.error" [class.cp-alert--ok]="!m.error">{{ m.text }}</div>
      }

      @if (store.detail(); as d) {
        @if (beforeSurveyClosed()) {
          <div class="cp-alert cp-alert--warn">
            Kelas baru bisa dibentuk setelah kuesioner ditutup ({{ d.stats.questionnaireSubmitted }}/{{ d.stats.students }} murid sudah mengirim).
            <a routerLink="/waka/siklus">Atur siklus</a>
          </div>
        }

        <!-- kelas tersimpan -->
        @if (saved().length > 0) {
          <section class="cp-card">
            <div class="cp-row">
              <div>
                <h2>Kelas resmi</h2>
                <p class="cp-sub">{{ saved().length }} kelas disimpan.</p>
              </div>
              <span class="cp-spacer"></span>
              @if (d.cycle.status === 'CLASSES_GENERATED') {
                @if (confirmCancel()) {
                  <span class="cp-small">Batalkan kelas yang disimpan?</span>
                  <button class="cp-btn cp-btn--danger cp-btn--sm" type="button" (click)="cancelClasses()">Ya, batalkan</button>
                  <button class="cp-btn cp-btn--sm" type="button" (click)="confirmCancel.set(false)">Tidak</button>
                } @else {
                  <button class="cp-btn cp-btn--danger" type="button" (click)="confirmCancel.set(true)">Batalkan kelas</button>
                }
                <button class="cp-btn cp-btn--primary" type="button" [disabled]="busy()" (click)="openSelection()">Buka pemilihan kelas</button>
              }
            </div>
            <div class="classes">
              @for (c of saved(); track c.id) {
                <article class="class-card">
                  <header class="cp-row">
                    <h3>Kelas {{ c.label }}</h3>
                    <span class="cp-badge">{{ typeLabel[c.type] }}</span>
                  </header>
                  <div class="cp-chips">
                    @for (s of c.subjectNames; track s) { <span class="cp-chip">{{ s }}</span> }
                  </div>
                  @if (d.cycle.status !== 'CLASSES_GENERATED') {
                    <p class="cp-small cp-muted counts">Dipilih {{ c.choiceCount }} murid · ditempatkan {{ c.placementCount }}</p>
                  }
                </article>
              }
            </div>
          </section>
        }

        <!-- simulasi -->
        @if (canSimulate()) {
          <section class="cp-card">
            <h2>Simulasi pembentukan kelas</h2>
            <p class="cp-sub">
              Kosongkan isian untuk memakai pengaturan siklus ({{ d.stats.students }} murid,
              {{ d.classCount ?? 'otomatis' }} kelas, isi rata).
              Ketentuan mapel: {{ d.subjectRules.length }} mapel, {{ d.pairRules.length }} aturan pasangan
              (<a routerLink="/waka/siklus">ubah</a>).
            </p>
            <form class="cp-form" [formGroup]="form" (ngSubmit)="simulate()">
              <label class="cp-field"><span>Jumlah kelas</span><input type="number" min="1" formControlName="classCount" placeholder="otomatis" /></label>
              <label class="cp-field"><span>Minimal murid / kelas</span><input type="number" min="1" formControlName="minClassSize" placeholder="rata" /></label>
              <label class="cp-field"><span>Maksimal murid / kelas</span><input type="number" min="1" formControlName="maxClassSize" placeholder="rata" /></label>
              <label class="cp-field check"><input type="checkbox" formControlName="requireOneMajor2Subject" />
                <span>Wajib minimal 1 mapel jurusan 2</span></label>
              <div class="cp-field cp-field--full">
                <div class="cp-row">
                  <button class="cp-btn cp-btn--primary" type="submit" [disabled]="busy()">{{ busy() ? 'Menghitung…' : 'Jalankan simulasi' }}</button>
                  <span class="cp-small cp-muted">Biasanya selesai dalam beberapa detik (maks. 30 detik).</span>
                </div>
              </div>
            </form>
          </section>
        }

        @if (plan(); as p) {
          @if (p.status === 'INFEASIBLE' || p.status === 'NO_SOLUTION_IN_TIME') {
            <div class="cp-alert cp-alert--error">{{ p.message }}</div>
          } @else {
            <section class="cp-card">
              <div class="cp-row">
                <div>
                  <h2>Hasil simulasi</h2>
                  <p class="cp-sub">{{ p.classCount }} kelas · {{ p.minClassSize }}–{{ p.maxClassSize }} murid per kelas</p>
                </div>
                <span class="cp-spacer"></span>
                <button class="cp-btn cp-btn--primary" type="button" [disabled]="busy()" (click)="save()">
                  {{ saved().length ? 'Ganti kelas resmi dengan hasil ini' : 'Simpan sebagai kelas resmi' }}
                </button>
              </div>

              <div class="cp-stats tiers">
                @for (t of [1, 2, 3, 4, 5]; track t) {
                  <div class="cp-stat">
                    <strong>{{ p.studentsPerTier[t] ?? 0 }}</strong>
                    <span><span class="cp-badge" [class]="'cp-badge cp-badge--tier' + t">P{{ t }}</span> {{ tierLabel[t] }}</span>
                  </div>
                }
              </div>

              <div class="classes">
                @for (c of p.classes; track c.label) {
                  <article class="class-card">
                    <header class="cp-row">
                      <h3>Kelas {{ c.label }}</h3>
                      <span class="cp-badge">{{ typeLabel[c.type] }}</span>
                      <span class="cp-spacer"></span>
                      <span class="cp-small"><strong>{{ c.size }}</strong> murid · rata-rata {{ c.averageMatchPercent | number: '1.1-1' }}%</span>
                    </header>
                    <div class="cp-chips">
                      @for (s of c.subjects; track s) { <span class="cp-chip">{{ s }}</span> }
                    </div>
                    <button class="cp-btn cp-btn--ghost cp-btn--sm" type="button" (click)="toggle(c.label)">
                      {{ expanded().has(c.label) ? 'Sembunyikan murid' : 'Lihat murid' }}
                    </button>
                    @if (expanded().has(c.label)) {
                      <ul class="members">
                        @for (s of c.students; track s.id) {
                          <li>
                            <span>{{ s.fullName }}</span>
                            @if (s.tier) { <span [class]="'cp-badge cp-badge--tier' + s.tier">P{{ s.tier }}</span> }
                            <span class="cp-small cp-muted">{{ s.matchPercent | number: '1.1-1' }}%</span>
                          </li>
                        }
                      </ul>
                    }
                  </article>
                }
              </div>

              @if (p.studentsWithGaps.length > 0) {
                <h3 class="gap-title">Murid yang tidak di prioritas 1 ({{ p.studentsWithGaps.length }})</h3>
                <div class="cp-table-wrap">
                  <table class="cp-table">
                    <thead><tr><th>Murid</th><th>Kelas</th><th>Prioritas</th><th>Kurang mapel J1</th><th>Kurang mapel J2</th></tr></thead>
                    <tbody>
                      @for (g of p.studentsWithGaps; track g.studentId) {
                        <tr>
                          <td>{{ g.fullName }}</td>
                          <td>{{ g.classLabel }}</td>
                          <td><span [class]="'cp-badge cp-badge--tier' + g.tier">P{{ g.tier }}</span></td>
                          <td>{{ g.missingMajor1Subjects.join(', ') || '-' }}</td>
                          <td>{{ g.missingMajor2Subjects.join(', ') || '-' }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </section>
          }
        }
      }
    </div>
  `,
  styles: `
    .classes {
      display: grid;
      gap: 12px;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      margin-top: 14px;
    }
    .class-card {
      display: grid;
      gap: 10px;
      align-content: start;
      padding: 14px;
      border-radius: 14px;
      border: 1px solid var(--border);
      background: var(--surface);
      h3 { margin: 0; font-size: 1rem; color: var(--brand-ink); }
      .cp-btn--ghost { justify-self: start; padding-left: 0; }
    }
    .counts { margin: 0; }
    .tiers { margin-top: 6px; }
    .tiers .cp-stat span { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .members {
      display: grid;
      gap: 4px;
      max-height: 280px;
      overflow: auto;
      margin: 0;
      padding: 0;
      list-style: none;
      font-size: 0.85rem;
      li { display: flex; gap: 8px; align-items: center; }
      li span:first-child { flex: 1; min-width: 0; }
    }
    .check { display: flex; align-items: center; gap: 8px; align-self: end; min-height: 40px; }
    .check input { width: auto; min-height: 0; }
    .gap-title { margin: 22px 0 10px; font-size: 0.95rem; color: var(--brand-ink); }
  `,
})
export class WakaKelas {
  readonly store = inject(CycleStore);
  private readonly api = inject(WakaApi);
  private readonly fb = inject(FormBuilder);

  readonly typeLabel = CLASS_TYPE_LABEL;
  readonly tierLabel = TIER_LABEL;

  readonly saved = signal<ClassInfo[]>([]);
  readonly plan = signal<ClassPlanResult | null>(null);
  readonly busy = signal(false);
  readonly confirmCancel = signal(false);
  readonly expanded = signal<Set<string>>(new Set());
  readonly message = signal<{ text: string; error: boolean } | null>(null);

  readonly canSimulate = computed(() => ['SURVEY_CLOSED', 'CLASSES_GENERATED'].includes(this.store.status() ?? ''));
  readonly beforeSurveyClosed = computed(() => ['DRAFT', 'SURVEY_OPEN'].includes(this.store.status() ?? ''));

  readonly form = this.fb.group({
    classCount: [null as number | null],
    minClassSize: [null as number | null],
    maxClassSize: [null as number | null],
    requireOneMajor2Subject: [false],
  });

  constructor() {
    this.store.ensure().subscribe({ next: () => this.reload(), error: (e: unknown) => this.fail(e) });
  }

  reload(): void {
    const id = this.store.selectedId();
    this.plan.set(null);
    this.confirmCancel.set(false);
    if (!id) return;
    this.api.classes(id).subscribe({ next: (c) => this.saved.set(c), error: (e: unknown) => this.fail(e) });
  }

  simulate(): void {
    const id = this.store.selectedId();
    if (!id) return;
    const v = this.form.getRawValue();
    this.busy.set(true);
    this.message.set(null);
    this.api
      .previewPlan(id, {
        classCount: v.classCount || null,
        minClassSize: v.minClassSize || null,
        maxClassSize: v.maxClassSize || null,
        requireOneMajor2Subject: !!v.requireOneMajor2Subject,
      })
      .subscribe({
        next: (p) => {
          this.busy.set(false);
          this.plan.set(p);
          this.expanded.set(new Set());
        },
        error: (e: unknown) => this.fail(e),
      });
  }

  save(): void {
    const id = this.store.selectedId();
    const p = this.plan();
    if (!id || !p) return;
    this.busy.set(true);
    this.api.saveClasses(id, p.classes.map((c) => ({ label: c.label, subjectCodes: c.subjectCodes }))).subscribe({
      next: (classes) => {
        this.busy.set(false);
        this.saved.set(classes);
        this.plan.set(null);
        this.message.set({ text: 'Kelas resmi disimpan. Langkah berikutnya: buka pemilihan kelas.', error: false });
        this.store.refresh().subscribe();
      },
      error: (e: unknown) => this.fail(e),
    });
  }

  openSelection(): void {
    const id = this.store.selectedId();
    if (!id) return;
    this.busy.set(true);
    this.api.changeStatus(id, 'SELECTION_OPEN').subscribe({
      next: (d) => {
        this.busy.set(false);
        this.store.setDetail(d);
        this.message.set({ text: 'Pemilihan kelas dibuka. Murid sekarang bisa memilih kelas.', error: false });
      },
      error: (e: unknown) => this.fail(e),
    });
  }

  cancelClasses(): void {
    const id = this.store.selectedId();
    if (!id) return;
    this.api.deleteClasses(id).subscribe({
      next: () => {
        this.saved.set([]);
        this.confirmCancel.set(false);
        this.message.set({ text: 'Kelas dibatalkan. Silakan jalankan simulasi lagi.', error: false });
        this.store.refresh().subscribe();
      },
      error: (e: unknown) => this.fail(e),
    });
  }

  toggle(label: string): void {
    this.expanded.update((set) => {
      const next = new Set(set);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  private fail(e: unknown): void {
    this.busy.set(false);
    this.message.set({ text: problemMessage(e), error: true });
  }
}
