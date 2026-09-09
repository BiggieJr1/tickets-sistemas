export interface Colaborador {
  id: number;
  nombreCompleto: string;
  email: string;
  esAdministrador: boolean;
  activo: boolean;
}

export interface ColaboradorCreateDto {
  nombreCompleto: string;
  email: string;
  esAdministrador: boolean;
}

export interface ColaboradorUpdateDto {
  nombreCompleto: string;
  email: string;
  esAdministrador: boolean;
  activo: boolean;
}
