import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { problemCode, problemMessage } from '../../../core/api/problem';
import { I18n } from '../../../core/i18n/i18n';
import { Icon } from '../../../shared/icon/icon';
import { CLASS_TYPE_TEXT, fmtDateTime } from '../../../shared/labels/labels';
import { MuridProgressService } from '../murid-progress.service';
import { ClassOption, ClassOptions, MuridApi } from '../murid-api';
import { PILIH_KELAS_TEXT } from './pilih-kelas.i18n';

/** Murid memilih kelas dari semua kelas yang memuat mapel jurusan 1. Satu kartu per kelas, dibagi beberapa bagian. */
@Component({
  selector: 'app-pilih-kelas',
  imports: [DecimalPipe, RouterLink, Icon],
  template: `
    <div class="cp-page">
      <header class="intro">
        <div>
          <h1>{{ t().title }}</h1>
          <p>{{ t().intro }}</p>
        </div>
        @if (data(); as d) {
          <aside class="cp-note">
            @if (d.cycleStatus === 'SELECTION_OPEN') {
              <h3>{{ t().closesAt.replace('{date}', fmt(d.selectionCloseAt)) }}</h3>
            } @else {
              <h3>{{ t().closed }}</h3>
            }
            <p>
              @if (d.currentClassId) {
                {{ t().changesLeftBefore }} <strong>{{ t().changesLeftCount.replace('{n}', '' + changesLeft()) }}</strong> {{ t().changesLeftAfter }}
              } @else {
                {{ t().notChosen.replace('{n}', '' + d.maxChanges) }}
              }
            </p>
          </aside>
        }
      </header>

      @if (message(); as m) {
        <div class="cp-alert" [class.cp-alert--error]="m.error" [class.cp-alert--ok]="!m.error">{{ m.text }}</div>
      }

      @if (notOpen()) {
        <div class="cp-empty">
          {{ t().notOpen }}
          <a routerLink="/murid">{{ t().backHome }}</a>
        </div>
      }

      @if (data(); as d) {
        <section class="majors">
          <div>
            <span class="cp-label">{{ t().major1 }}</span>
            <strong>{{ d.major1 ?? '-' }}</strong>
          </div>
          <div>
            <span class="cp-label">{{ t().major2 }}</span>
            <strong>{{ d.major2 ?? t().notFilled }}</strong>
          </div>
          <p class="fine">
            <app-icon name="info" [size]="16" />
            {{ t().fine }}
          </p>
        </section>

        <div class="options">
          @for (o of d.options; track o.classId; let i = $index) {
            <article class="option" [class.chosen]="o.classId === d.currentClassId">
              <!-- judul -->
              <header class="option-head">
                <h2>{{ t().classPrefix }} {{ o.label }}</h2>
                @if (o.classId === d.currentClassId) {
                  <span class="cp-ok"><app-icon name="check-circle" [size]="17" /> {{ t().yourChoice }}</span>
                } @else if (i === 0) {
                  <span class="cp-badge cp-badge--primary">{{ t().bestMatch }}</span>
                }
                <span class="cp-spacer"></span>
                <span class="cp-small cp-muted">{{ typeLabel()[o.type] }}</span>
              </header>

              <!-- kecocokan -->
              <div class="part">
                <div class="score">
                  <strong>{{ o.matchPercent | number: '1.0-0' }}</strong><span>{{ t().matchSuffix }}</span>
                </div>
                <div class="cp-bar"><i [style.width.%]="o.matchPercent"></i></div>
                <p class="tier" [class.good]="o.tier <= 2">
                  @if (o.tier <= 2) { <app-icon name="check-circle" [size]="16" /> } @else { <app-icon name="info" [size]="16" /> }
                  {{ tierText(o.tier, !!d.major2) }}
                </p>
              </div>

              <!-- mapel jurusan -->
              <div class="part">
                <div class="cp-meter">
                  <div class="cp-meter__row">
                    <span>{{ t().forMajor.replace('{major}', d.major1 ?? t().major1Fallback) }}</span>
                    @if (o.missingMajor1.length === 0) {
                      <span class="cp-ok"><app-icon name="check-circle" [size]="16" /> {{ t().complete }}</span>
                    } @else {
                      <b>{{ t().covered.replace('{n}', '' + (o.major1Coverage | number: '1.0-0')) }}</b>
                    }
                  </div>
                  <div class="cp-bar"><i [style.width.%]="o.major1Coverage"></i></div>
                  @if (o.missingMajor1.length) { <small class="missing">{{ t().missing.replace('{list}', o.missingMajor1.join(', ')) }}</small> }
                </div>
                @if (d.major2) {
                  <div class="cp-meter">
                    <div class="cp-meter__row">
                      <span>{{ t().forMajor.replace('{major}', d.major2) }}</span>
                      @if (o.missingMajor2.length === 0) {
                        <span class="cp-ok"><app-icon name="check-circle" [size]="16" /> {{ t().complete }}</span>
                      } @else {
                        <b>{{ t().covered.replace('{n}', '' + (o.major2Coverage | number: '1.0-0')) }}</b>
                      }
                    </div>
                    <div class="cp-bar"><i [style.width.%]="o.major2Coverage"></i></div>
                    @if (o.missingMajor2.length) { <small class="missing">{{ t().missing.replace('{list}', o.missingMajor2.join(', ')) }}</small> }
                  </div>
                }
              </div>

              <!-- mapel kelas -->
              <div class="part">
                <span class="cp-label">{{ t().classSubjects }}</span>
                <div class="cp-chips subjects">
                  @for (s of o.subjects; track s) {
                    <span class="cp-chip" [class.need]="!o.extraSubjects.includes(s)">{{ s }}</span>
                  }
                </div>
                @if (o.extraSubjects.length) {
                  <small class="cp-muted">{{ t().extraNote }}</small>
                }
              </div>

              <!-- aksi -->
              <footer class="option-foot">
                @if (o.classId === d.currentClassId) {
                  <span class="cp-small cp-muted">{{ t().currentNote }}</span>
                } @else if (confirming() === o.classId) {
                  <span class="cp-small confirm-text">
                    {{ d.currentClassId ? t().confirmChange.replace('{label}', o.label).replace('{n}', '' + (changesLeft() - 1)) : t().confirmFirst.replace('{label}', o.label) }}
                  </span>
                  <button class="cp-btn cp-btn--primary cp-btn--sm" type="button" [disabled]="busy()" (click)="choose(o)">{{ t().yes }}</button>
                  <button class="cp-btn cp-btn--sm" type="button" (click)="confirming.set(null)">{{ t().cancel }}</button>
                } @else {
                  <button class="cp-btn" [class.cp-btn--primary]="!d.currentClassId" type="button"
                          [disabled]="!d.editable" (click)="confirming.set(o.classId)">
                    {{ d.currentClassId ? t().changeTo : t().choose }}
                  </button>
                  @if (!d.editable) { <span class="cp-small cp-muted">{{ lockedReason() }}</span> }
                }
              </footer>
            </article>
          } @empty {
            <div class="cp-empty">{{ t().empty }}</div>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .intro {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      justify-content: space-between;
      gap: 20px 40px;
    }
    .intro > div { flex: 1 1 420px; }
    .intro h1 {
      margin: 0 0 8px;
      font-family: var(--font-display);
      font-size: clamp(1.8rem, 3vw, 2.3rem);
      font-weight: 600;
      color: var(--brand-ink);
    }
    .intro p { max-width: 62ch; margin: 0; color: var(--text); line-height: 1.6; }
    .intro .cp-note { flex: 0 1 300px; }

    .majors {
      display: flex;
      flex-wrap: wrap;
      gap: 12px 40px;
      padding: 16px 20px;
      border: 1px solid var(--border);
      border-radius: 10px;
      background: var(--surface);
    }
    .majors > div { display: grid; gap: 2px; }
    .majors strong { font-size: 1.05rem; color: var(--brand-ink); }
    .fine {
      display: flex;
      gap: 8px;
      flex-basis: 100%;
      margin: 4px 0 0;
      padding-top: 12px;
      border-top: 1px dashed var(--border);
      color: var(--muted);
      font-size: 0.88rem;
      line-height: 1.5;
    }
    .fine app-icon { margin-top: 2px; }

    .options {
      display: grid;
      gap: 20px;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 400px), 1fr));
      align-items: start;
    }
    .option {
      display: flex;
      flex-direction: column;
      border: 1px solid var(--border);
      border-radius: 10px;
      background: var(--surface);
    }
    .option.chosen { border: 2px solid var(--primary); }
    .option-head {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 16px 20px 12px;
    }
    .option-head h2 {
      margin: 0;
      font-family: var(--font-display);
      font-size: 1.4rem;
      font-weight: 600;
      color: var(--brand-ink);
    }
    .part {
      display: grid;
      gap: 8px;
      margin: 0 20px;
      padding: 14px 0;
      border-top: 1px solid var(--border);
    }
    .part .cp-meter + .cp-meter { margin-top: 8px; }
    .score { display: flex; align-items: baseline; gap: 4px; }
    .score strong {
      font-family: var(--font-display);
      font-size: 2.6rem;
      font-weight: 600;
      line-height: 1;
      color: var(--brand-ink);
    }
    .score span { color: var(--muted); }
    .tier { display: flex; align-items: center; gap: 6px; margin: 0; font-size: 0.9rem; color: var(--muted); }
    .tier.good { color: var(--success); font-weight: 600; }
    .missing { color: var(--danger); }
    .subjects .cp-chip { background: var(--chip-bg); color: var(--muted); font-weight: 500; }
    .subjects .cp-chip.need { background: var(--primary-soft); color: var(--primary); font-weight: 700; }
    .option-foot {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px;
      margin-top: auto;
      padding: 14px 20px 18px;
      border-top: 1px solid var(--border);
      background: var(--surface-tint);
      border-radius: 0 0 10px 10px;
    }
    .confirm-text { flex-basis: 100%; font-weight: 600; }
  `,
})
export class PilihKelas {
  private readonly api = inject(MuridApi);
  private readonly progress = inject(MuridProgressService);

  private readonly i18n = inject(I18n);
  /** Teks sesuai bahasa aktif. */
  readonly t = computed(() => PILIH_KELAS_TEXT[this.i18n.lang()]);
  readonly typeLabel = computed(() => CLASS_TYPE_TEXT[this.i18n.lang()]);

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
        this.message.set({ text: (first ? this.t().chosen : this.t().changed).replace('{label}', o.label), error: false });
        this.progress.load().subscribe();
      },
      error: (e: unknown) => {
        this.busy.set(false);
        this.confirming.set(null);
        this.message.set({ text: problemMessage(e), error: true });
      },
    });
  }

  /** Kenapa tombol pilih tidak bisa dipakai. */
  readonly lockedReason = computed(() => {
    const d = this.data();
    if (!d) return '';
    if (d.cycleStatus !== 'SELECTION_OPEN') return this.t().lockedClosed;
    return this.t().lockedNoChanges;
  });

  /** Penjelasan prioritas dalam bahasa sehari-hari. */
  tierText(tier: number, hasMajor2: boolean): string {
    const t = this.t();
    switch (tier) {
      case 1: return hasMajor2 ? t.tier1Both : t.tier1One;
      case 2: return t.tier2;
      case 3: return t.tier3;
      case 4: return t.tier4;
      default: return t.tier5;
    }
  }

  fmt(iso: string | null): string {
    return fmtDateTime(iso);
  }
}
