// Coinciden en texto con los enums del backend (Categoria, Prioridad, Estado
// en TicketsSistemas.Api), gracias al JsonStringEnumConverter configurado ahí.

export type CategoriaValue = 'Hardware' | 'Software' | 'Red' | 'Accesos' | 'Servidor' | 'Otro';
export type PrioridadValue = 'Critica' | 'Alta' | 'Media' | 'Baja';
export type EstadoValue = 'Abierto' | 'EnProgreso' | 'Resuelto' | 'Cerrado';

export interface Ticket {
  id: number;
  codigoTicket: string;
  titulo: string;
  descripcion: string;
  categoria: CategoriaValue;
  prioridad: PrioridadValue;
  estado: EstadoValue;
  solicitante: string | null;
  creado: string;
  actualizado: string | null;
}

export interface TicketCreateDto {
  titulo: string;
  descripcion: string;
  categoria: CategoriaValue;
  prioridad: PrioridadValue;
  solicitante: string | null;
}

export interface Opcion<T extends string> {
  value: T;
  label: string;
}

export const CATEGORIAS: Opcion<CategoriaValue>[] = [
  { value: 'Hardware', label: 'Hardware' },
  { value: 'Software', label: 'Software' },
  { value: 'Red', label: 'Red / Conectividad' },
  { value: 'Accesos', label: 'Accesos y cuentas' },
  { value: 'Servidor', label: 'Servidor / Infraestructura' },
  { value: 'Otro', label: 'Otro' },
];

export const PRIORIDADES: Opcion<PrioridadValue>[] = [
  { value: 'Critica', label: 'Crítica' },
  { value: 'Alta', label: 'Alta' },
  { value: 'Media', label: 'Media' },
  { value: 'Baja', label: 'Baja' },
];

export const ESTADOS: Opcion<EstadoValue>[] = [
  { value: 'Abierto', label: 'Abierto' },
  { value: 'EnProgreso', label: 'En progreso' },
  { value: 'Resuelto', label: 'Resuelto' },
  { value: 'Cerrado', label: 'Cerrado' },
];

export const PRIORIDAD_ORDEN: Record<PrioridadValue, number> = {
  Critica: 0,
  Alta: 1,
  Media: 2,
  Baja: 3,
};

export const CATEGORIA_CODIGO: Record<CategoriaValue, string> = {
  Hardware: 'HW',
  Software: 'SW',
  Red: 'NET',
  Accesos: 'ACC',
  Servidor: 'SRV',
  Otro: 'OTR',
};

export function labelDe<T extends string>(lista: Opcion<T>[], value: T): string {
  return lista.find((o) => o.value === value)?.label ?? value;
}
