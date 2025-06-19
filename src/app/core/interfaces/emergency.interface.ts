// Interfaces para el BACKEND (nuevas)
export interface Emergency {
  emergencyId?: number;
  userId: number;
  emergencyTypeId: number;
  emergencyDate: string; // ISO string para enviar al backend
  informant: string;
  vehicle: string;
  ubication: string;
  turn: string;
  reportTime: string; // ISO string
  reportTimeDescription: string;
  departureTime: string; // ISO string
  departureTimeDescription: string;
  arrivalSceneTime?: string; // ISO string, opcional
  arrivalSceneTimeDescription?: string;
  arrivalHospitalTime?: string; // ISO string, opcional
  arrivalHospitalTimeDescription?: string;
  returnEstationTime: string; // ISO string
  returnEstationTimeDescription: string;
  unitsResponse: string;
  guardPersonnel: string;
  novedades?: CreateNovelty[];
  // Eventos adicionales para cronología completa
  eventosAdicionalesSalida?: { hora: string; descripcion: string }[];
  eventosAdicionalesLlegadaEscena?: { hora: string; descripcion: string }[];
  eventosAdicionalesLlegadaHospital?: { hora: string; descripcion: string }[];
}

export interface CreateNovelty {
  novelty: string;
  noveltyDate: string; // ISO string
  description: string;
}

export interface EmergencyType {
  emergencyTypeId: number;
  emergencyType: string;
}

export interface EmergencyResponse {
  emergencyId: number;
  user: any;
  emergencyType: EmergencyType;
  emergencyFiles: any[];
  emergenciesNovelties: any[];
  // ... resto de campos de la entidad
}

// Interface para archivos
export interface EmergencyFile {
  file: File;
  description?: string;
}

// Interfaces para DASHBOARD y componentes existentes (compatibilidad)
export interface EmergencyOld {
  id: number;
  tipo: string;
  direccion: string;
  fecha: Date;
  estado: 'activa' | 'resuelta' | 'en_proceso';
  descripcion: string;
  unidades: number;
}

// Interface para tipos de emergencia (compatibilidad con componente viejo)
export interface TipoEmergencia {
  id: string;
  nombre: string;
  categoria: string;
} 