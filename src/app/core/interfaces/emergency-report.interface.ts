export interface EmergencyReport {
  id?: number;
  fechaReporte: Date;
  quienInforma: string;
  tipoEmergencia: string;
  ubicacion: string;
  
  // Horas del reporte
  horaReporte: string;
  horaReporteDescripcion: string;
  
  horaSalida: string;
  horaSalidaDescripcion: string;
  
  horaLlegadaEscena: string;
  horaLlegadaEscenaDescripcion: string;
  
  horaLlegadaHospital?: string;
  horaLlegadaHospitalDescripcion?: string;
  
  horaRegresoEstacion: string;
  horaRegresoEstacionDescripcion: string;
  
  // Personal y recursos
  unidades: string[];
  guardia: string[];
  vehiculo: string;
  
  // Turno
  turno: number | 'sin_convenio';
  
  // Evidencias fotográficas
  evidenciasFotograficas?: EvidenciaFotograficaData[];
  
  // Descripción generada
  descripcionDetallada?: string;
  
  // Metadatos
  creadoPor?: string;
  fechaCreacion?: Date;
  estado?: 'borrador' | 'enviado' | 'aprobado';
}

export interface TipoEmergencia {
  id: string;
  nombre: string;
  categoria: 'incendio' | 'rescate' | 'accidente' | 'medica' | 'otra';
}

export interface PersonalDisponible {
  id: string;
  nombre: string;
  cargo: string;
  activo: boolean;
}

export interface VehiculoDisponible {
  id: string;
  nombre: string;
  tipo: 'autobomba' | 'ambulancia' | 'rescate' | 'escalera' | 'otro';
  disponible: boolean;
}

export interface EvidenciaFotograficaData {
  id: string;
  fileName: string;
  fileSize: number;
  descripcion: string;
  fecha: Date;
  // Para almacenamiento, se podría agregar también:
  // base64Data?: string; // Si se quiere almacenar en base64
  // url?: string; // Si se almacena en un servidor de archivos
} 