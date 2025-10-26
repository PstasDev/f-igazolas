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
  allapot: string;
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
