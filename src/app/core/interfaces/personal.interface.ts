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
  estado: 'activo' | 'inactivo' | 'licencia';
  cualidades: string[];
  experienciaAnios: number;
  observaciones?: string;
  foto?: string;
  contactoEmergencia: ContactoEmergencia;
}

export interface ContactoEmergencia {
  nombre: string;
  parentesco: string;
  telefono: string;
}

export interface Cualidad {
  id: string;
  nombre: string;
  categoria: 'tecnica' | 'medica' | 'rescate' | 'administrativa' | 'operativa';
  descripcion: string;
}



export interface Rango {
  id: string;
  nombre: string;
  nivel: number;
  descripcion: string;
}

export interface PersonalStats {
  totalPersonal: number;
  personalActivo: number;
  personalInactivo: number;
  personalEnLicencia: number;
  promedioExperiencia: number;
  distribucuionPorCargo: { [cargo: string]: number };
  cualidadesMasComunes: { cualidad: string; cantidad: number }[];
} 