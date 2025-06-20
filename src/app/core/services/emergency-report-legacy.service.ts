import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { TipoEmergencia } from '../interfaces/emergency.interface';
import { PersonalDisponible } from '../interfaces/personal.interface';
import { VehiculoDisponible } from './emergency-data.service';
import { EmergencyService } from './emergency-report.service';
import { EmergencyDataService } from './emergency-data.service';

// Interface temporal para compatibilidad
export interface EmergencyReport {
  fechaReporte: Date;
  quienInforma: string;
  tipoEmergencia: string;
  ubicacion: string;
  vehiculo: string;
  turno: string;
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
  unidades: string[];
  guardia: string[];
  evidenciasFotograficas?: any[];
  eventosAdicionalesSalida?: any[];
  eventosAdicionalesLlegadaEscena?: any[];
  eventosAdicionalesLlegadaHospital?: any[];
  novedades?: any[];
  descripcionDetallada?: string;
  fechaCreacion?: Date;
  estado?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmergencyReportLegacyService {
  
  // Datos mock para compatibilidad
  private tiposEmergencia: TipoEmergencia[] = [
    { id: 'incendio_estructural', nombre: 'Incendio Estructural', categoria: 'incendio' },
    { id: 'incendio_vehicular', nombre: 'Incendio Vehicular', categoria: 'incendio' },
    { id: 'incendio_forestal', nombre: 'Incendio Forestal', categoria: 'incendio' },
    { id: 'rescate_vehicular', nombre: 'Rescate Vehicular', categoria: 'rescate' },
    { id: 'rescate_altura', nombre: 'Rescate en Altura', categoria: 'rescate' },
    { id: 'rescate_agua', nombre: 'Rescate Acuático', categoria: 'rescate' },
    { id: 'accidente_transito', nombre: 'Accidente de Tránsito', categoria: 'accidente' },
    { id: 'emergencia_medica', nombre: 'Emergencia Médica', categoria: 'medica' },
    { id: 'fuga_gas', nombre: 'Fuga de Gas', categoria: 'otra' },
    { id: 'arbol_caido', nombre: 'Árbol Caído', categoria: 'otra' }
  ];

  constructor(
    private emergencyService: EmergencyService,
    private emergencyDataService: EmergencyDataService
  ) { }

  getTiposEmergencia(): Observable<TipoEmergencia[]> {
    return of(this.tiposEmergencia);
  }

  getPersonalDisponible(): Observable<PersonalDisponible[]> {
    return this.emergencyDataService.getPersonalDisponible();
  }

  getVehiculosDisponibles(): Observable<VehiculoDisponible[]> {
    return this.emergencyDataService.getVehiculosDisponibles();
  }

  generarDescripcionDetallada(reporte: EmergencyReport): string {
    const tipoEmergencia = this.tiposEmergencia.find(t => t.id === reporte.tipoEmergencia);
    
    let descripcion = `REPORTE DE EMERGENCIA - ${tipoEmergencia?.nombre.toUpperCase() || 'EMERGENCIA'}\n\n`;
    
    descripcion += `INFORMACIÓN GENERAL:\n`;
    descripcion += `• Fecha del reporte: ${new Date(reporte.fechaReporte).toLocaleDateString('es-ES')}\n`;
    descripcion += `• Informado por: ${reporte.quienInforma}\n`;
    descripcion += `• Tipo de emergencia: ${tipoEmergencia?.nombre || 'N/A'}\n`;
    descripcion += `• Ubicación: ${reporte.ubicacion}\n`;
    descripcion += `• Turno: ${reporte.turno === 'sin_convenio' || reporte.turno === 'false' ? 'Sin convenio' : `Turno #${reporte.turno}`}\n`;
    descripcion += `• Vehículo utilizado: ${reporte.vehiculo}\n\n`;
    
    descripcion += `CRONOLOGÍA DE EVENTOS:\n`;
    descripcion += `• ${reporte.horaReporte} - REPORTE: ${reporte.horaReporteDescripcion}\n`;
    
    // Agregar eventos adicionales de salida si existen
    if (reporte.eventosAdicionalesSalida && reporte.eventosAdicionalesSalida.length > 0) {
      reporte.eventosAdicionalesSalida.forEach(evento => {
        descripcion += `• ${evento.hora} - EVENTO SALIDA: ${evento.descripcion}\n`;
      });
    }
    
    descripcion += `• ${reporte.horaSalida} - SALIDA: ${reporte.horaSalidaDescripcion}\n`;
    descripcion += `• ${reporte.horaLlegadaEscena} - LLEGADA A ESCENA: ${reporte.horaLlegadaEscenaDescripcion}\n`;
    
    // Agregar eventos adicionales de llegada a escena si existen
    if (reporte.eventosAdicionalesLlegadaEscena && reporte.eventosAdicionalesLlegadaEscena.length > 0) {
      reporte.eventosAdicionalesLlegadaEscena.forEach(evento => {
        descripcion += `• ${evento.hora} - EVENTO ESCENA: ${evento.descripcion}\n`;
      });
    }
    
    if (reporte.horaLlegadaHospital && reporte.horaLlegadaHospitalDescripcion) {
      descripcion += `• ${reporte.horaLlegadaHospital} - LLEGADA A HOSPITAL: ${reporte.horaLlegadaHospitalDescripcion}\n`;
      
      // Agregar eventos adicionales de hospital si existen
      if (reporte.eventosAdicionalesLlegadaHospital && reporte.eventosAdicionalesLlegadaHospital.length > 0) {
        reporte.eventosAdicionalesLlegadaHospital.forEach(evento => {
          descripcion += `• ${evento.hora} - EVENTO HOSPITAL: ${evento.descripcion}\n`;
        });
      }
    }
    
    descripcion += `• ${reporte.horaRegresoEstacion} - REGRESO A ESTACIÓN: ${reporte.horaRegresoEstacionDescripcion}\n\n`;
    
    descripcion += `PERSONAL INTERVINIENTE:\n`;
    descripcion += `• Unidades de respuesta: ${reporte.unidades.join(', ')}\n`;
    descripcion += `• Personal de guardia: ${reporte.guardia.join(', ')}\n\n`;
    
    const horaInicio = reporte.horaReporte;
    const horaFin = reporte.horaRegresoEstacion;
    descripcion += `DURACIÓN TOTAL: ${horaInicio} - ${horaFin}\n\n`;
    
    descripcion += `Reporte generado automáticamente el ${new Date().toLocaleString('es-ES')}`;
    
    return descripcion;
  }

  guardarReporte(reporte: EmergencyReport): Observable<any> {
    // Generar descripción detallada
    reporte.descripcionDetallada = this.generarDescripcionDetallada(reporte);
    reporte.fechaCreacion = new Date();
    reporte.estado = 'enviado';
    
    console.log('Reporte legacy procesado:', reporte);
    
    // Por ahora retornamos un observable mock
    // TODO: Implementar conversión al formato del backend
    return of({ success: true, message: 'Reporte guardado (modo legacy)' });
  }
} 