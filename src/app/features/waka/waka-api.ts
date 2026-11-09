import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

/* ===================== tipe data ===================== */

export interface CycleSummary {
  id: number;
  name: string;
  targetAcademicYear: string;
  cohortEntryYear: number;
  status: string;
  surveyCloseAt: string | null;
  selectionCloseAt: string | null;
  finalizedAt: string | null;
  createdAt: string;
}

export interface Weights {
  major: number;
  major1: number;
  report: number;
  aptitude: number;
  interest: number;
}

export interface SubjectRule {
  subjectCode: string;
  subjectName: string;
  minClasses: number | null;
  maxClasses: number | null;
}

export interface PairRule {
  subjectCode: string;
  subjectName: string;
  requiresSubjectCode: string;
  requiresSubjectName: string;
}

export interface CycleStats {
  students: number;
  questionnaireSubmitted: number;
  questionnaireDraft: number;
  classes: number;
  choices: number;
  placements: number;
}

export interface CycleDetail {
  cycle: CycleSummary;
  classCount: number | null;
  classCapacity: number;
  weights: Weights;
  subjectRules: SubjectRule[];
  pairRules: PairRule[];
  stats: CycleStats;
  allowedTransitions: string[];
}

export interface CycleSettings {
  name: string;
  targetAcademicYear: string;
  cohortEntryYear: number;
  surveyCloseAt: string | null;
  selectionCloseAt: string | null;
  classCount: number | null;
  classCapacity: number | null;
}

export interface QuestionnaireRow {
  studentId: number;
  studentNumber: string;
  fullName: string;
  classLabel: string | null;
  status: 'NOT_STARTED' | 'DRAFT' | 'SUBMITTED';
  major1: string | null;
  major2: string | null;
  interestIpa: number | null;
  interestIps: number | null;
  submittedAt: string | null;
}

export interface ClassPlanRequest {
  classCount?: number | null;
  minClassSize?: number | null;
  maxClassSize?: number | null;
  requireOneMajor2Subject?: boolean;
}

export interface PlanStudent {
  id: number;
  studentNumber: string;
  fullName: string;
  tier: number | null;
  matchPercent: number;
}

export interface PlanClass {
  label: string;
  subjectCodes: string[];
  subjects: string[];
  type: string;
  size: number;
  averageMatchPercent: number;
  students: PlanStudent[];
}

export interface PlanGap {
  studentId: number;
  fullName: string;
  classLabel: string;
  tier: number;
  missingMajor1Subjects: string[];
  missingMajor2Subjects: string[];
}

export interface ClassPlanResult {
  status: 'OPTIMAL' | 'FEASIBLE' | 'INFEASIBLE' | 'NO_SOLUTION_IN_TIME';
  message: string | null;
  penalty: number;
  classCount: number;
  minClassSize: number;
  maxClassSize: number;
  studentsPerTier: Record<string, number>;
  classes: PlanClass[];
  studentsWithGaps: PlanGap[];
}

export interface ClassInfo {
  id: number;
  label: string;
  subjectCodes: string[];
  subjectNames: string[];
  type: string;
  choiceCount: number;
  placementCount: number;
}

export interface RebalanceResult {
  status: string;
  problems: string[];
  warnings: string[];
  classes: { label: string; before: number; after: number }[];
  moves: {
    studentId: number;
    studentNumber: string;
    fullName: string;
    from: string;
    to: string;
    matchBefore: number;
    matchAfter: number;
    tierBefore: number;
    tierAfter: number;
    belowThreshold: boolean;
  }[];
}

export interface PlacementOption {
  classId: number;
  label: string;
  tier: number;
  matchPercent: number;
}

export interface PlacedStudent {
  studentId: number;
  studentNumber: string;
  fullName: string;
  fromClassLabel: string | null;
  chosenClassLabel: string | null;
  source: string;
  tier: number;
  matchPercent: number;
  locked: boolean;
  options: PlacementOption[];
}

export interface PlacementClass {
  classId: number;
  label: string;
  subjectNames: string[];
  type: string;
  size: number;
  averageMatchPercent: number;
  students: PlacedStudent[];
}

export interface PlacementBoard {
  status: string;
  minSize: number;
  maxSize: number;
  classes: PlacementClass[];
}

export interface Subject {
  id: number;
  code: string;
  name: string;
  category: 'UMUM' | 'PILIHAN';
  rumpun: 'IPA' | 'IPS' | null;
}

export interface Major {
  id: number;
  code: string;
  name: string;
  subjectCodes: string[];
  subjectNames: string[];
}

export interface StudentRow {
  id: number;
  studentNumber: string;
  nisn: string | null;
  fullName: string;
  birthDate: string;
  entryYear: number;
  classLabel: string | null;
  activated: boolean;
}

export interface StudentInput {
  studentNumber: string;
  nisn: string | null;
  fullName: string;
  birthDate: string;
  entryYear: number;
  classLabel: string | null;
}

export interface SchoolProfile {
  id: number;
  code: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  principalName: string | null;
}

export interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  messages: string[];
}

/* ===================== API ===================== */

/** Semua endpoint waka (/api/v1/waka/...). */
@Injectable({ providedIn: 'root' })
export class WakaApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/waka`;

  // --- siklus
  cycles(): Observable<CycleSummary[]> {
    return this.http.get<CycleSummary[]>(`${this.base}/cycles`);
  }
  cycle(id: number): Observable<CycleDetail> {
    return this.http.get<CycleDetail>(`${this.base}/cycles/${id}`);
  }
  createCycle(body: CycleSettings): Observable<CycleDetail> {
    return this.http.post<CycleDetail>(`${this.base}/cycles`, body);
  }
  updateCycle(id: number, body: CycleSettings): Observable<CycleDetail> {
    return this.http.put<CycleDetail>(`${this.base}/cycles/${id}`, body);
  }
  deleteCycle(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/cycles/${id}`);
  }
  updateWeights(id: number, body: Weights): Observable<CycleDetail> {
    return this.http.put<CycleDetail>(`${this.base}/cycles/${id}/weights`, body);
  }
  updateRules(
    id: number,
    body: {
      subjectRules: { subjectCode: string; minClasses: number | null; maxClasses: number | null }[];
      pairRules: { subjectCode: string; requiresSubjectCode: string }[];
    },
  ): Observable<CycleDetail> {
    return this.http.put<CycleDetail>(`${this.base}/cycles/${id}/rules`, body);
  }
  changeStatus(id: number, target: string): Observable<CycleDetail> {
    return this.http.post<CycleDetail>(`${this.base}/cycles/${id}/status`, { target });
  }
  questionnaires(id: number): Observable<QuestionnaireRow[]> {
    return this.http.get<QuestionnaireRow[]>(`${this.base}/cycles/${id}/questionnaires`);
  }

  // --- kelas
  previewPlan(id: number, body: ClassPlanRequest): Observable<ClassPlanResult> {
    return this.http.post<ClassPlanResult>(`${this.base}/cycles/${id}/class-plan/preview`, body);
  }
  classes(id: number): Observable<ClassInfo[]> {
    return this.http.get<ClassInfo[]>(`${this.base}/cycles/${id}/classes`);
  }
  saveClasses(id: number, classes: { label: string; subjectCodes: string[] }[]): Observable<ClassInfo[]> {
    return this.http.post<ClassInfo[]>(`${this.base}/cycles/${id}/classes`, { classes });
  }
  deleteClasses(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/cycles/${id}/classes`);
  }

  // --- pemerataan & penempatan
  rebalancePreview(id: number, minMatch: number | null): Observable<RebalanceResult> {
    return this.http.post<RebalanceResult>(`${this.base}/cycles/${id}/rebalance/preview`, { minMatch });
  }
  rebalanceApply(id: number, minMatch: number | null): Observable<RebalanceResult> {
    return this.http.post<RebalanceResult>(`${this.base}/cycles/${id}/rebalance/apply`, { minMatch });
  }
  placements(id: number): Observable<PlacementBoard> {
    return this.http.get<PlacementBoard>(`${this.base}/cycles/${id}/placements`);
  }
  movePlacement(id: number, studentId: number, classId: number): Observable<PlacementBoard> {
    return this.http.put<PlacementBoard>(`${this.base}/cycles/${id}/placements/${studentId}`, { classId });
  }
  finalize(id: number): Observable<PlacementBoard> {
    return this.http.post<PlacementBoard>(`${this.base}/cycles/${id}/finalize`, {});
  }

  // --- nilai
  importAssessments(id: number, file: File): Observable<ImportResult> {
    const body = new FormData();
    body.append('file', file);
    return this.http.post<ImportResult>(`${this.base}/cycles/${id}/assessments/import`, body);
  }

  // --- mapel & jurusan
  subjects(): Observable<Subject[]> {
    return this.http.get<Subject[]>(`${this.base}/subjects`);
  }
  saveSubject(s: Omit<Subject, 'id'>, id?: number): Observable<Subject> {
    return id ? this.http.put<Subject>(`${this.base}/subjects/${id}`, s) : this.http.post<Subject>(`${this.base}/subjects`, s);
  }
  deleteSubject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/subjects/${id}`);
  }
  majors(): Observable<Major[]> {
    return this.http.get<Major[]>(`${this.base}/majors`);
  }
  saveMajor(m: { code: string; name: string; subjectCodes: string[] }, id?: number): Observable<Major> {
    return id ? this.http.put<Major>(`${this.base}/majors/${id}`, m) : this.http.post<Major>(`${this.base}/majors`, m);
  }
  deleteMajor(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/majors/${id}`);
  }

  // --- murid
  students(entryYear?: number | null): Observable<StudentRow[]> {
    const params = entryYear ? new HttpParams().set('entryYear', entryYear) : undefined;
    return this.http.get<StudentRow[]>(`${this.base}/students`, { params });
  }
  saveStudent(s: StudentInput, id?: number): Observable<StudentRow> {
    return id
      ? this.http.put<StudentRow>(`${this.base}/students/${id}`, s)
      : this.http.post<StudentRow>(`${this.base}/students`, s);
  }
  deleteStudent(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/students/${id}`);
  }
  importStudents(file: File, entryYear: number | null): Observable<ImportResult> {
    const body = new FormData();
    body.append('file', file);
    if (entryYear) body.append('entryYear', String(entryYear));
    return this.http.post<ImportResult>(`${this.base}/students/import`, body);
  }

  // --- profil sekolah (kop surat)
  school(): Observable<SchoolProfile> {
    return this.http.get<SchoolProfile>(`${this.base}/school`);
  }
  saveSchool(s: Omit<SchoolProfile, 'id' | 'code'>): Observable<SchoolProfile> {
    return this.http.put<SchoolProfile>(`${this.base}/school`, s);
  }
}
