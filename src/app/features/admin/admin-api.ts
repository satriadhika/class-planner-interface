import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface LatestCycle {
  id: number;
  name: string;
  status: string;
  cohortEntryYear: number;
  students: number;
  questionnaireSubmitted: number;
}

export interface SchoolRow {
  id: number;
  code: string;
  name: string;
  accreditation: 'A' | 'B' | 'C' | null;
  disabled: boolean;
  createdAt: string;
  students: number;
  activatedStudents: number;
  wakas: number;
  teachers: number;
  pendingTeachers: number;
  latestCycle: LatestCycle | null;
}

export interface WakaAccount {
  id: number;
  username: string;
  displayName: string;
  email: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  hasPassword: boolean;
  googleLinked: boolean;
  lastLoginAt: string | null;
}

export interface SchoolDetail {
  summary: SchoolRow;
  address: string | null;
  phone: string | null;
  email: string | null;
  principalName: string | null;
  disabledWakaMenus: string[];
  allWakaMenus: string[];
  wakas: WakaAccount[];
}

export interface SchoolInput {
  code: string;
  name: string;
  accreditation: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  principalName: string | null;
}

export interface WakaInput {
  username: string;
  displayName: string;
  email: string | null;
  password: string | null;
}

/** Super admin: /admin/schools/... */
@Injectable({ providedIn: 'root' })
export class AdminApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/admin/schools`;

  schools(): Observable<SchoolRow[]> {
    return this.http.get<SchoolRow[]>(this.base);
  }
  school(id: number): Observable<SchoolDetail> {
    return this.http.get<SchoolDetail>(`${this.base}/${id}`);
  }
  create(body: SchoolInput): Observable<SchoolDetail> {
    return this.http.post<SchoolDetail>(this.base, body);
  }
  update(id: number, body: SchoolInput): Observable<SchoolDetail> {
    return this.http.put<SchoolDetail>(`${this.base}/${id}`, body);
  }
  setDisabled(id: number, disabled: boolean): Observable<SchoolDetail> {
    return this.http.post<SchoolDetail>(`${this.base}/${id}/${disabled ? 'disable' : 'enable'}`, {});
  }
  setWakaMenus(id: number, disabled: string[]): Observable<SchoolDetail> {
    return this.http.put<SchoolDetail>(`${this.base}/${id}/waka-menus`, { disabled });
  }
  createWaka(id: number, body: WakaInput): Observable<SchoolDetail> {
    return this.http.post<SchoolDetail>(`${this.base}/${id}/wakas`, body);
  }
  updateWaka(id: number, userId: number, body: { displayName: string; email: string | null }): Observable<SchoolDetail> {
    return this.http.put<SchoolDetail>(`${this.base}/${id}/wakas/${userId}`, body);
  }
  setWakaActive(id: number, userId: number, active: boolean): Observable<SchoolDetail> {
    return this.http.post<SchoolDetail>(`${this.base}/${id}/wakas/${userId}/${active ? 'activate' : 'deactivate'}`, {});
  }
  resetPassword(id: number, userId: number, password: string): Observable<SchoolDetail> {
    return this.http.put<SchoolDetail>(`${this.base}/${id}/wakas/${userId}/password`, { password });
  }
}
