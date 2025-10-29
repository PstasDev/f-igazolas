// TypeScript types matching Django Ninja API schemas

export interface User {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

export interface OsztalySimple {
  id: number;
  tagozat: string;
  kezdes_eve: number;
  nev: string;
}

export interface Profile {
  id: number;
  user: User;
  osztalyom?: OsztalySimple;
}

export interface Osztaly {
  id: number;
  tagozat: string;
  kezdes_eve: number;
  nev: string;
  tanulok: User[];
  osztalyfonokok: User[];
}

export interface Mulasztas {
  id: number;
  datum: string; // ISO datetime string
  ora: number;
  tantargy: string;
  tema: string;
  tipus: string;
  igazolt: boolean;
  igazolas_tipusa?: string;
  rogzites_datuma: string; // ISO datetime string
}

export interface IgazolasTipus {
  id: number;
  nev: string;
  leiras?: string;
  beleszamit: boolean;
  iskolaerdeku: boolean;
}

export interface Igazolas {
  id: number;
  profile: Profile;
  mulasztasok: Mulasztas[];
  eleje: string; // ISO datetime string
  vege: string; // ISO datetime string
  tipus: IgazolasTipus;
  megjegyzes?: string;
  rogzites_datuma: string; // ISO date string
  megjegyzes_diak?: string;
  diak: boolean;
  ftv: boolean;
  korrigalt: boolean;
  diak_extra_ido_elotte?: number;
  diak_extra_ido_utana?: number;
  imgDriveURL?: string;
  bkk_verification?: object; // BKKVerification object
  allapot: 'Függőben' | 'Elfogadva' | 'Elutasítva';
  megjegyzes_tanar?: string;
  kretaban_rogzitettem: boolean;
}

export interface IgazolasCreateRequest {
  eleje: string; // ISO datetime string
  vege: string; // ISO datetime string
  tipus: number; // IgazolasTipus ID
  megjegyzes_diak?: string;
  diak?: boolean;
  korrigalt?: boolean;
  diak_extra_ido_elotte?: number;
  diak_extra_ido_utana?: number;
  imgDriveURL?: string;
  bkk_verification?: object; // BKKVerification object
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface TokenResponse {
  token: string;
  user_id: number;
  username: string;
  iat: number;
  exp: number;
}

export interface ErrorResponse {
  error: string;
  detail: string;
}

// Quick Action types
export interface QuickActionRequest {
  action: 'Elfogadva' | 'Elutasítva' | 'Függőben'; // Updated to include all valid actions
}

export interface BulkQuickActionRequest {
  action: 'Elfogadva' | 'Elutasítva' | 'Függőben'; // Updated to include all valid actions
  ids: number[]; // List of igazolas IDs
}

export interface QuickActionResponse {
  id: number;
  allapot: 'Függőben' | 'Elfogadva' | 'Elutasítva';
  message: string;
}

export interface BulkQuickActionResponse {
  updated_count: number;
  failed_ids: number[];
  message: string;
}

// Teacher comment update types
export interface TeacherCommentUpdateRequest {
  megjegyzes_tanar?: string;
}

export interface TeacherCommentUpdateResponse {
  id: number;
  megjegyzes_tanar?: string;
  message: string;
}

// Diakjaim (Students Management) types
export interface IgazolasSimple {
  id: number;
  eleje: string; // ISO datetime string
  vege: string; // ISO datetime string
  tipus: IgazolasTipus;
  allapot: 'Függőben' | 'Elfogadva' | 'Elutasítva';
  rogzites_datuma: string; // ISO date string
  megjegyzes_diak?: string;
}

export interface DiakjaSignle {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  igazolasok: IgazolasSimple[];
}

export interface DiakjaCreateRequest {
  last_name: string;
  first_name: string;
  email: string;
}

export interface DiakjaCreateResponse {
  created_count: number;
  failed_users: string[];
  message: string;
}

// Forgot Password types
export interface ForgotPasswordRequest {
  username: string;
}

export interface ForgotPasswordResponse {
  message: string;
  email_sent: boolean;
}

export interface CheckOTPRequest {
  username: string;
  otp_code: string;
}

export interface CheckOTPResponse {
  message: string;
  reset_token: string;
  expires_in_minutes: number;
}

export interface ChangePasswordOTPRequest {
  username: string;
  reset_token: string;
  new_password: string;
}

export interface ChangePasswordOTPResponse {
  message: string;
  success: boolean;
}
