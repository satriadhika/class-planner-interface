import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  ClassInfo,
  CycleDetail,
  CycleSummary,
  PlacementBoard,
  QuestionnaireRow,
  StudentRow,
} from '../../features/waka/waka-api';

/**
 * Data penjurusan baca-saja (GET /view/...).
 * Guru: sekolahnya sendiri (schoolId diabaikan backend). Super admin: wajib schoolId.
 */
@Injectable({ providedIn: 'root' })
export class ViewApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/view`;

  private params(schoolId: number | null): HttpParams {
    return schoolId == null ? new HttpParams() : new HttpParams().set('schoolId', schoolId);
  }

  cycles(schoolId: number | null): Observable<CycleSummary[]> {
    return this.http.get<CycleSummary[]>(`${this.base}/cycles`, { params: this.params(schoolId) });
  }
  cycle(schoolId: number | null, id: number): Observable<CycleDetail> {
    return this.http.get<CycleDetail>(`${this.base}/cycles/${id}`, { params: this.params(schoolId) });
  }
  classes(schoolId: number | null, id: number): Observable<ClassInfo[]> {
    return this.http.get<ClassInfo[]>(`${this.base}/cycles/${id}/classes`, { params: this.params(schoolId) });
  }
  placements(schoolId: number | null, id: number): Observable<PlacementBoard> {
    return this.http.get<PlacementBoard>(`${this.base}/cycles/${id}/placements`, { params: this.params(schoolId) });
  }
  /** Hanya super admin. */
  questionnaires(schoolId: number, id: number): Observable<QuestionnaireRow[]> {
    return this.http.get<QuestionnaireRow[]>(`${this.base}/cycles/${id}/questionnaires`, { params: this.params(schoolId) });
  }
  /** Hanya super admin. */
  students(schoolId: number): Observable<StudentRow[]> {
    return this.http.get<StudentRow[]>(`${this.base}/students`, { params: this.params(schoolId) });
  }
}
