export type Role = 'SUPER_ADMIN' | 'WAKA' | 'GURU' | 'MURID';

export interface SchoolRef {
  id: number;
  code?: string;
  name: string;
}

export interface CurrentUser {
  id: number;
  username: string;
  displayName: string;
  role: Role;
  school: SchoolRef | null; // null untuk SUPER_ADMIN
  teacherId: number | null;
  studentId: number | null;
  /** Menu waka yang dimatikan super admin untuk sekolah ini (kunci WakaMenu). */
  disabledMenus?: string[];
  /** Guru BK: boleh membuka perhitungan eligible SNBP. */
  counselor?: boolean;
}

/** Hasil pendaftaran guru: selalu PENDING sampai disetujui waka. */
export interface TeacherRegisterResponse {
  status: 'PENDING';
  schoolName: string;
  email: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: CurrentUser;
}

/** Halaman awal per role setelah login. */
export const ROLE_HOME: Record<Role, string> = {
  SUPER_ADMIN: '/admin',
  WAKA: '/waka',
  GURU: '/guru',
  MURID: '/murid',
};
