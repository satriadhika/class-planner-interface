import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { formatDateTime } from '../murid-progress.service';

export type KuesionerStatus = 'NOT_STARTED' | 'DRAFT' | 'SUBMITTED';

export interface MajorOption {
  id: number;
  code: string;
  name: string;
  /** Mapel pilihan yang dibutuhkan jurusan ini */
  requiredSubjects: string[];
}

export interface Attachment {
  id: number;
  fileName: string;
  contentType: string;
  size: number;
}

export interface KuesionerData {
  status: KuesionerStatus;
  /** false kalau sudah dikirim atau periode kuesioner sudah tutup */
  editable: boolean;
  closeAtLabel: string | null;
  submittedAtLabel: string | null;
  student: {
    fullName: string;
    studentNumber: string;
    classLabel: string | null;
  };
  aspiration: string;
  supportingActivities: string;
  attachments: Attachment[];
  major1Id: number | null;
  major2Id: number | null;
}

/** Jawaban yang dikirim saat simpan draf / submit. */
export interface KuesionerAnswers {
  aspiration: string;
  supportingActivities: string;
  major1Id: number | null;
  major2Id: number | null;
}

export const MAX_ATTACHMENTS = 3;
export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
export const ALLOWED_ATTACHMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

/** Bentuk response GET/PUT /me/questionnaire dari backend (tanggal ISO). */
interface QuestionnaireView extends Omit<KuesionerData, 'closeAtLabel' | 'submittedAtLabel'> {
  closeAt: string | null;
  submittedAt: string | null;
}

function toData(view: QuestionnaireView): KuesionerData {
  const { closeAt, submittedAt, ...rest } = view;
  return { ...rest, closeAtLabel: formatDateTime(closeAt), submittedAtLabel: formatDateTime(submittedAt) };
}

/**
 * Semua data kuesioner lewat backend:
 *   GET    /me/questionnaire                 → jawaban + data murid (sekaligus menandai tahap dimulai)
 *   PUT    /me/questionnaire                 → simpan draf
 *   POST   /me/questionnaire/submit          → kirim final
 *   POST   /me/questionnaire/attachments     → unggah dokumen (multipart, field "file")
 *   GET    /me/questionnaire/attachments/:id → lihat dokumen
 *   DELETE /me/questionnaire/attachments/:id → hapus dokumen
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

  uploadAttachment(file: File): Observable<Attachment> {
    const body = new FormData();
    body.append('file', file);
    return this.http.post<Attachment>(`${this.base}/attachments`, body);
  }

  /** Ambil file sebagai blob (butuh token, jadi tidak bisa pakai link biasa). */
  downloadAttachment(id: number): Observable<Blob> {
    return this.http.get(`${this.base}/attachments/${id}`, { responseType: 'blob' });
  }

  removeAttachment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/attachments/${id}`);
  }
}
