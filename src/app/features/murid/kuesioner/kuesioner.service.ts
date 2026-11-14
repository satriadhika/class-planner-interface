import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';

export type KuesionerStatus = 'NOT_STARTED' | 'DRAFT' | 'SUBMITTED';

export interface MajorOption {
  id: number;
  code: string;
  name: string;
  /** Mapel pilihan yang dibutuhkan jurusan ini */
  requiredSubjects: string[];
  /** Bagian dari requiredSubjects yang wajib ada di kelas (kosong = minimal salah satu) */
  coreSubjects?: string[];
}

export interface KuesionerData {
  status: KuesionerStatus;
  /** false kalau sudah dikirim atau periode kuesioner sudah tutup */
  editable: boolean;
  /** ISO; diformat sesuai bahasa di komponen */
  closeAt: string | null;
  submittedAt: string | null;
  student: {
    fullName: string;
    studentNumber: string;
    classLabel: string | null;
  };
  aspiration: string;
  supportingActivities: string;
  /** Minat IPA & IPS, skala 1–5 */
  interestIpa: number | null;
  interestIps: number | null;
  major1Id: number | null;
  major2Id: number | null;
}

/** Jawaban yang dikirim saat simpan draf / submit. */
export interface KuesionerAnswers {
  aspiration: string;
  supportingActivities: string;
  interestIpa: number | null;
  interestIps: number | null;
  major1Id: number | null;
  major2Id: number | null;
}

/** Bentuk response GET/PUT /me/questionnaire dari backend (tanggal ISO). */
type QuestionnaireView = KuesionerData;

function toData(view: QuestionnaireView): KuesionerData {
  return view;
}

/**
 * Semua data kuesioner lewat backend:
 *   GET    /me/questionnaire                 → jawaban + data murid (sekaligus menandai tahap dimulai)
 *   PUT    /me/questionnaire                 → simpan draf
 *   POST   /me/questionnaire/submit          → kirim final
 *   GET    /majors                           → daftar jurusan + mapel wajib
 */
@Injectable({ providedIn: 'root' })
export class KuesionerService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/me/questionnaire`;

  load(): Observable<KuesionerData> {
    return this.http.get<QuestionnaireView>(this.base).pipe(map(toData));
  }

  majors(): Observable<MajorOption[]> {
    return this.http.get<MajorOption[]>(`${environment.apiUrl}/majors`);
  }

  saveDraft(answers: KuesionerAnswers): Observable<KuesionerData> {
    return this.http.put<QuestionnaireView>(this.base, answers).pipe(map(toData));
  }

  submit(answers: KuesionerAnswers): Observable<KuesionerData> {
    return this.http.post<QuestionnaireView>(`${this.base}/submit`, answers).pipe(map(toData));
  }
}
