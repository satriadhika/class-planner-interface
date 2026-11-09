import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { LetterData } from '../../shared/letter/statement-letter';

export interface ClassOption {
  classId: number;
  label: string;
  subjects: string[];
  type: string;
  tier: number;
  matchPercent: number;
  major1Coverage: number;
  major2Coverage: number;
  missingMajor1: string[];
  missingMajor2: string[];
  extraSubjects: string[];
}

export interface ClassOptions {
  cycleStatus: string;
  selectionCloseAt: string | null;
  /** true = periode dibuka dan masih ada jatah ganti */
  editable: boolean;
  currentClassId: number | null;
  changesUsed: number;
  maxChanges: number;
  major1: string | null;
  major2: string | null;
  options: ClassOption[];
}

export interface FinalClass {
  cycleName: string;
  targetAcademicYear: string;
  classLabel: string;
  subjects: string[];
  tier: number;
  matchPercent: number;
  classSize: number;
  source: string;
  finalizedAt: string | null;
}

/** Endpoint murid untuk pilih kelas, kelas final, dan surat (/api/v1/me/...). */
@Injectable({ providedIn: 'root' })
export class MuridApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/me`;

  classOptions(): Observable<ClassOptions> {
    return this.http.get<ClassOptions>(`${this.base}/class-options`);
  }

  choose(classId: number): Observable<ClassOptions> {
    return this.http.put<ClassOptions>(`${this.base}/class-choice`, { classId });
  }

  finalClass(): Observable<FinalClass> {
    return this.http.get<FinalClass>(`${this.base}/final-class`);
  }

  letter(): Observable<LetterData> {
    return this.http.get<LetterData>(`${this.base}/statement-letter`);
  }
}
