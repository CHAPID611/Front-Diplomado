import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { EmergencyReport, TipoEmergencia, PersonalDisponible, VehiculoDisponible } from '../interfaces/emergency-report.interface';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmergencyReportService {

  private apiUrl = environment.apiUrl;

  // Datos mock para el formulario
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

  private personalDisponible: PersonalDisponible[] = [
    { id: 'p1', nombre: 'Carlos Rodríguez', cargo: 'Capitán', activo: true },
    { id: 'p2', nombre: 'Ana García', cargo: 'Teniente', activo: true },
    { id: 'p3', nombre: 'Luis Martínez', cargo: 'Sargento', activo: true },
    { id: 'p4', nombre: 'María López', cargo: 'Bombero', activo: true },
    { id: 'p5', nombre: 'Juan Pérez', cargo: 'Bombero', activo: true },
    { id: 'p6', nombre: 'Sofia Herrera', cargo: 'Paramédico', activo: true },
    { id: 'p7', nombre: 'Diego Torres', cargo: 'Conductor', activo: true },
    { id: 'p8', nombre: 'Carmen Ruiz', cargo: 'Bombero', activo: false }
  ];

  private vehiculosDisponibles: VehiculoDisponible[] = [
    { id: 'v1', nombre: 'AM - 1', tipo: 'ambulancia', disponible: true },
    { id: 'v2', nombre: 'Autobomba AB-02', tipo: 'autobomba', disponible: true },
    { id: 'v3', nombre: 'Ambulancia AMB-01', tipo: 'ambulancia', disponible: true },
    { id: 'v4', nombre: 'Vehículo de Rescate VR-01', tipo: 'rescate', disponible: true },
    { id: 'v5', nombre: 'Escalera E-01', tipo: 'escalera', disponible: false },
    { id: 'v6', nombre: 'Vehículo de Comando VC-01', tipo: 'otro', disponible: true }
  ];

  constructor(private http: HttpClient) { }

  getTiposEmergencia(): Observable<TipoEmergencia[]> {
    return of(this.tiposEmergencia);
  }

  getPersonalDisponible(): Observable<PersonalDisponible[]> {
    return of(this.personalDisponible.filter(p => p.activo));
  }

  getVehiculosDisponibles(): Observable<VehiculoDisponible[]> {
    return of(this.vehiculosDisponibles.filter(v => v.disponible));
  }

  generarDescripcionDetallada(reporte: EmergencyReport): string {
    const tipoEmergencia = this.tiposEmergencia.find(t => t.id === reporte.tipoEmergencia);
    const vehiculo = this.vehiculosDisponibles.find(v => v.id === reporte.vehiculo);
    
    let descripcion = `REPORTE DE EMERGENCIA - ${tipoEmergencia?.nombre.toUpperCase()}\n\n`;
    
    descripcion += `INFORMACIÓN GENERAL:\n`;
    descripcion += `• Fecha del reporte: ${new Date(reporte.fechaReporte).toLocaleDateString('es-ES')}\n`;
    descripcion += `• Informado por: ${reporte.quienInforma}\n`;
    descripcion += `• Tipo de emergencia: ${tipoEmergencia?.nombre}\n`;
    descripcion += `• Ubicación: ${reporte.ubicacion}\n`;
    descripcion += `• Turno: ${reporte.turno === 'sin_convenio' ? 'Sin convenio' : `Turno #${reporte.turno}`}\n`;
    descripcion += `• Vehículo utilizado: ${vehiculo?.nombre}\n\n`;
    
    descripcion += `CRONOLOGÍA DE EVENTOS:\n`;
    descripcion += `• ${reporte.horaReporte} - REPORTE: ${reporte.horaReporteDescripcion}\n`;
    descripcion += `• ${reporte.horaSalida} - SALIDA: ${reporte.horaSalidaDescripcion}\n`;
    descripcion += `• ${reporte.horaLlegadaEscena} - LLEGADA A ESCENA: ${reporte.horaLlegadaEscenaDescripcion}\n`;
    
    if (reporte.horaLlegadaHospital && reporte.horaLlegadaHospitalDescripcion) {
      descripcion += `• ${reporte.horaLlegadaHospital} - LLEGADA A HOSPITAL: ${reporte.horaLlegadaHospitalDescripcion}\n`;
    }
    
    descripcion += `• ${reporte.horaRegresoEstacion} - REGRESO A ESTACIÓN: ${reporte.horaRegresoEstacionDescripcion}\n\n`;
    
    descripcion += `PERSONAL INTERVINIENTE:\n`;
    descripcion += `• Unidades de respuesta: ${reporte.unidades.join(', ')}\n`;
    descripcion += `• Personal de guardia: ${reporte.guardia.join(', ')}\n\n`;
    
    // Agregar evidencias fotográficas
    if (reporte.evidenciasFotograficas && reporte.evidenciasFotograficas.length > 0) {
      descripcion += `EVIDENCIAS FOTOGRÁFICAS:\n`;
      descripcion += `• Total de fotografías: ${reporte.evidenciasFotograficas.length}\n`;
      reporte.evidenciasFotograficas.forEach((evidencia, index) => {
        descripcion += `• Foto ${index + 1}: ${evidencia.fileName}\n`;
        if (evidencia.descripcion) {
          descripcion += `  Descripción: ${evidencia.descripcion}\n`;
        }
        descripcion += `  Tamaño: ${(evidencia.fileSize / 1024 / 1024).toFixed(2)} MB\n`;
        descripcion += `  Fecha: ${new Date(evidencia.fecha).toLocaleString('es-ES')}\n`;
      });
      descripcion += `\n`;
    }
    
    const horaInicio = reporte.horaReporte;
    const horaFin = reporte.horaRegresoEstacion;
    descripcion += `DURACIÓN TOTAL: ${horaInicio} - ${horaFin}\n\n`;
    
    descripcion += `Reporte generado automáticamente el ${new Date().toLocaleString('es-ES')}`;
    
    return descripcion;
  }

  guardarReporte(reporte: EmergencyReport): Observable<EmergencyReport> {
    // Generar descripción detallada
    reporte.descripcionDetallada = this.generarDescripcionDetallada(reporte);
    reporte.fechaCreacion = new Date();
    reporte.estado = 'enviado';
    
    // Aquí se hace la llamada al backend
    console.log('Enviando reporte al backend:', reporte);
    return this.http.post<EmergencyReport>(`${this.apiUrl}/emergencies`, reporte);
  }
} 