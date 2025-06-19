export interface Personal {
  id?: number;
  cedula: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: Date;
  telefono: string;
  email: string;
  direccion: string;
  tipoSangre: string;
  rango: string;
  fechaIngreso: Date;
  estado: 'activo' | 'licencia';
  cualidades: string[];
  experienciaAnios: number;
  observaciones?: string;
  foto?: string;
  contactoEmergencia: ContactoEmergencia;
  expandedQualifications?: boolean;
}

export interface ContactoEmergencia {
  nombre: string;
  parentesco: string;
  telefono: string;
}

export interface Cualidad {
  id?: string;
  nombre?: string;
  categoria?: 'tecnica' | 'medica' | 'rescate' | 'administrativa' | 'operativa';
  descripcion?: string;
  competenciaId?: string | number;
  competenciaName?: string;
  category?: 'tecnica' | 'medica' | 'rescate' | 'administrativa' | 'operativa';
  name?: string;
  value?: string | number;
}

export interface Rango {
  id?: string;
  nombre?: string;
  nivel?: number;
  descripcion?: string;
  rangeId?: string | number;
  rangeName?: string;
  value?: string | number;
  name?: string;
  label?: string;
  text?: string;
  range?: string;
}

export interface PersonalStats {
  totalPersonal: number;
  personalActivo: number;
  personalEnLicencia: number;
  promedioExperiencia: number;
  distribucuionPorCargo: { [cargo: string]: number };
  cualidadesMasComunes: { cualidad: string; cantidad: number }[];
} 