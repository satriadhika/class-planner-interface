import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, map, of, shareReplay, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { currentLang } from '../../core/i18n/i18n';
import { fmtDate, fmtDateTime } from '../../shared/labels/labels';

export type StageKey = 'kuesioner' | 'pilih-kelas' | 'surat' | 'kelas-final';
/** missed = periode tahap sudah lewat tapi belum dikerjakan. */
export type StageStatus = 'done' | 'current' | 'locked' | 'missed';

export interface Stage {
  key: StageKey;
  label: string;
  description: string;
  cta: string;
  route: string;
  status: StageStatus;
  startedAt: string | null;
  completedAt: string | null;
}

export interface CycleInfo {
  id: number;
  name: string;
  status: string;
  surveyCloseAt: string | null;
  selectionCloseAt: string | null;
}

export interface Activity {
  id: number;
  action: string;
  detail: string | null;
  createdAt: string;
}

/* ---------- bentuk response backend ---------- */
type ApiStageKey = 'KUESIONER' | 'PILIH_KELAS' | 'SURAT' | 'KELAS_FINAL';
type ApiStageStatus = 'DONE' | 'CURRENT' | 'LOCKED' | 'MISSED';

interface ProgressResponse {
  cycle: CycleInfo | null;
  stages: { key: ApiStageKey; status: ApiStageStatus; startedAt: string | null; completedAt: string | null }[];
}

/** Teks bawaan per tahap (bahasa Indonesia). Beranda memakai teks dua bahasa dari beranda.i18n.ts. */
const STAGE_TEXT: Record<ApiStageKey, Omit<Stage, 'status' | 'startedAt' | 'completedAt'>> = {
  KUESIONER: {
    key: 'kuesioner',
    label: 'Isi kuesioner',
    description: 'Tulis cita-citamu dan pilih jurusan kuliah 1 dan 2 yang kamu minati.',
    cta: 'Isi kuesioner',
    route: '/murid/kuesioner',
  },
  PILIH_KELAS: {
    key: 'pilih-kelas',
    label: 'Pilih kelas',
    description: 'Bandingkan persentase kecocokan setiap kelas, lalu pilih yang paling sesuai.',
    cta: 'Pilih kelas',
    route: '/murid/pilih-kelas',
  },
  KELAS_FINAL: {
    key: 'kelas-final',
    label: 'Kelas final',
    description: 'Kelasmu ditetapkan setelah pemerataan dan persetujuan waka kurikulum.',
    cta: 'Lihat kelas',
    route: '/murid/kelas',
  },
  SURAT: {
    key: 'surat',
    label: 'Surat pernyataan',
    description: 'Surat pernyataan bisa diunduh setelah waka menyetujui kelasmu.',
    cta: 'Unduh surat',
    route: '/murid/surat',
  },
};

const ACTIVITY_LABEL: Record<string, string> = {
  QUESTIONNAIRE_OPENED: 'Membuka kuesioner',
  QUESTIONNAIRE_DRAFT_SAVED: 'Menyimpan draf kuesioner',
  QUESTIONNAIRE_SUBMITTED: 'Mengirim kuesioner',
  CLASS_CHOSEN: 'Memilih kelas',
  CLASS_CHANGED: 'Mengganti pilihan kelas',
  PLACEMENT_REBALANCED: 'Ditempatkan lewat pemerataan',
  PLACEMENT_MOVED: 'Dipindahkan oleh waka kurikulum',
  CLASS_FINALIZED: 'Kelas final disetujui',
};

export function activityLabel(action: string): string {
  return ACTIVITY_LABEL[action] ?? action;
}

/** Tanggal panjang sesuai bahasa aktif. */
export function formatDate(iso: string | null | undefined): string | null {
  return iso ? fmtDate(iso) : null;
}

/** Tanggal + jam sesuai bahasa aktif. */
export function formatDateTime(iso: string | null | undefined): string | null {
  return iso ? fmtDateTime(iso) : null;
}

/** Progres tahap penjurusan murid yang sedang login. Sumber data: GET /me/progress. */
@Injectable({ providedIn: 'root' })
export class MuridProgressService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  readonly stages = signal<Stage[]>([]);
  readonly cycle = signal<CycleInfo | null>(null);
  readonly loading = signal(false);
  readonly loaded = signal(false);
  readonly error = signal<string | null>(null);

  readonly current = computed(() => this.stages().find((s) => s.status === 'current') ?? null);
  readonly doneCount = computed(() => this.stages().filter((s) => s.status === 'done').length);
  readonly percent = computed(() => {
    const total = this.stages().length;
    return total === 0 ? 0 : Math.round((this.doneCount() / total) * 100);
  });
  /** Belum ada siklus penjurusan yang dibuka untuk angkatan murid. */
  readonly noCycle = computed(() => this.loaded() && this.cycle() === null);

  /** Tenggat yang relevan dengan tahap yang sedang berjalan. */
  readonly deadline = computed(() => {
    const cycle = this.cycle();
    if (!cycle) return null;
    if (cycle.status === 'SURVEY_OPEN' && cycle.surveyCloseAt) {
      return { title: `Kuesioner dibuka sampai ${formatDate(cycle.surveyCloseAt)}`, kind: 'survey' as const };
    }
    if (cycle.status === 'SELECTION_OPEN' && cycle.selectionCloseAt) {
      return { title: `Pemilihan kelas dibuka sampai ${formatDate(cycle.selectionCloseAt)}`, kind: 'selection' as const };
    }
    return null;
  });

  private inflight: Observable<void> | null = null;

  /** Muat ulang progres dari backend. Panggil setelah murid menyelesaikan suatu tahap. */
  load(): Observable<void> {
    if (this.inflight) return this.inflight;
    this.loading.set(true);
    this.error.set(null);
    this.inflight = this.http.get<ProgressResponse>(`${this.api}/me/progress`).pipe(
      tap((res) => {
        this.cycle.set(res.cycle);
        this.stages.set(
          res.stages.map((s) => ({
            ...STAGE_TEXT[s.key],
            status: s.status.toLowerCase() as StageStatus,
            startedAt: s.startedAt,
            completedAt: s.completedAt,
          })),
        );
        this.loaded.set(true);
      }),
      map(() => undefined),
      catchError(() => {
        this.error.set(
          currentLang() === 'en'
            ? 'Could not load your progress. Please reload the page.'
            : 'Progres penjurusan gagal dimuat. Coba muat ulang halaman.',
        );
        return of(undefined);
      }),
      finalize(() => {
        this.loading.set(false);
        this.inflight = null;
      }),
      shareReplay(1),
    );
    return this.inflight;
  }

  /** Riwayat aktivitas murid di siklus aktif (GET /me/activity). */
  activity(): Observable<Activity[]> {
    return this.http.get<Activity[]>(`${this.api}/me/activity`);
  }

  statusOf(key: StageKey): StageStatus | null {
    return this.stages().find((s) => s.key === key)?.status ?? null;
  }

  /** Dipanggil saat logout supaya data murid lain tidak terlihat. */
  reset(): void {
    this.stages.set([]);
    this.cycle.set(null);
    this.loaded.set(false);
    this.error.set(null);
  }
}
