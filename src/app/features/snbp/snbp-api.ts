import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ImportResult } from '../waka/waka-api';

export interface SubjectOption {
  key: string;
  name: string;
  students: number;
  selected: boolean;
}

export interface ComponentView {
  id: number;
  name: string;
  weight: number;
  maxScore: number;
  students: number;
}

export interface SnbpSettings {
  accreditation: 'A' | 'B' | 'C' | null;
  quotaPercent: number;
  eraporBonus: boolean;
  cohortEntryYear: number;
  cohortOptions: number[];
  cohortSize: number;
  quota: number;
  semesters: number[];
  allSubjects: boolean;
  subjects: SubjectOption[];
  coverage: { semester: number; students: number }[];
  raporWeight: number;
  components: ComponentView[];
  totalWeight: number;
}

export interface SettingsInput {
  accreditation: string | null;
  cohortEntryYear: number | null;
  semesters: number[];
  /** kosong = semua mapel */
  subjects: string[];
  raporWeight: number;
  eraporBonus: boolean;
}

export interface RankingRow {
  rank: number | null;
  studentId: number;
  studentNumber: string;
  fullName: string;
  classLabel: string | null;
  raporAverage: number | null;
  gradeCount: number;
  components: { componentId: number; score: number | null; normalized: number | null }[];
  finalScore: number | null;
  eligible: boolean;
  tie: boolean;
  missing: string[];
}

export interface Ranking {
  accreditation: string | null;
  quotaPercent: number;
  cohortSize: number;
  quota: number;
  eligibleCount: number;
  cutoffScore: number | null;
  raporWeight: number;
  components: ComponentView[];
  semesters: number[];
  subjectCount: number;
  problems: string[];
  rows: RankingRow[];
}

/** Perhitungan eligible SNBP (waka & guru BK): /snbp/... */
@Injectable({ providedIn: 'root' })
export class SnbpApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/snbp`;

  settings(): Observable<SnbpSettings> {
    return this.http.get<SnbpSettings>(`${this.base}/settings`);
  }
  saveSettings(body: SettingsInput): Observable<SnbpSettings> {
    return this.http.put<SnbpSettings>(`${this.base}/settings`, body);
  }
  addComponent(body: { name: string; weight: number; maxScore: number }): Observable<SnbpSettings> {
    return this.http.post<SnbpSettings>(`${this.base}/components`, body);
  }
  updateComponent(id: number, body: { name: string; weight: number; maxScore: number }): Observable<SnbpSettings> {
    return this.http.put<SnbpSettings>(`${this.base}/components/${id}`, body);
  }
  deleteComponent(id: number): Observable<SnbpSettings> {
    return this.http.delete<SnbpSettings>(`${this.base}/components/${id}`);
  }
  importGrades(file: File, semester: string): Observable<ImportResult> {
    const body = new FormData();
    body.append('file', file);
    body.append('semester', semester);
    return this.http.post<ImportResult>(`${this.base}/grades/import`, body);
  }
  importComponent(id: number, file: File): Observable<ImportResult> {
    const body = new FormData();
    body.append('file', file);
    return this.http.post<ImportResult>(`${this.base}/components/${id}/import`, body);
  }
  ranking(): Observable<Ranking> {
    return this.http.get<Ranking>(`${this.base}/ranking`);
  }
}
