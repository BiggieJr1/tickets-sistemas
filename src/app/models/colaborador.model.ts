export interface Colaborador {
  id: number;
  nombreCompleto: string;
  email: string;
  esAdministrador: boolean;
  activo: boolean;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponseDto {
  token: string;
  expira: string;
  colaborador: Colaborador;
}

export interface ColaboradorCreateDto {
  nombreCompleto: string;
  email: string;
  password: string;
  esAdministrador: boolean;
}

export interface ColaboradorUpdateDto {
  nombreCompleto: string;
  email: string;
  esAdministrador: boolean;
  activo: boolean;
}
