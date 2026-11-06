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
