import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Emergency, EmergencyType, CreateNovelty, EmergencyFile } from '../interfaces/emergency.interface';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmergencyService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { 
    console.log('EmergencyService initialized with API URL:', this.apiUrl);
  }

  // Headers por defecto con el token JWT
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  // Headers para FormData (sin Content-Type para que el browser lo maneje)
  private getFormDataHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  // Obtener tipos de emergencia del backend
  getEmergencyTypes(): Observable<EmergencyType[]> {
    return this.http.get<EmergencyType[]>(`${this.apiUrl}/emergency-types`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Crear nueva emergencia
  createEmergency(emergency: Emergency, files?: EmergencyFile[]): Observable<any> {
    console.log('EmergencyService - URL base:', this.apiUrl);
    console.log('EmergencyService - URL completa:', `${this.apiUrl}/emergencias`);
    console.log('EmergencyService - Datos recibidos:', emergency);
    
    // Validar que los datos mínimos estén presentes
    if (!emergency.informant || !emergency.ubication || !emergency.emergencyTypeId) {
      return throwError(() => new Error('Faltan datos requeridos: informant, ubication, o emergencyTypeId'));
    }
    
    const formData = new FormData();
    
    // Agregar los datos de la emergencia
    Object.keys(emergency).forEach(key => {
      const value = emergency[key as keyof Emergency];
      if (value !== undefined && value !== null) {
        try {
          if (key === 'novedades' && Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value.toString());
          }
          console.log(`FormData agregado - ${key}:`, value);
        } catch (error) {
          console.error(`Error agregando ${key} a FormData:`, error, 'Valor:', value);
        }
      } else {
        console.warn(`Campo ${key} es undefined o null, se omite`);
      }
    });

    // Agregar archivos si existen
    if (files && files.length > 0) {
      files.forEach((emergencyFile, index) => {
        formData.append('file', emergencyFile.file);
        if (emergencyFile.description) {
          formData.append(`fileDescription_${index}`, emergencyFile.description);
        }
      });
    }

    return this.http.post(`${this.apiUrl}/emergencias`, formData, {
      headers: this.getFormDataHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Obtener todas las emergencias
  getAllEmergencies(filters?: any): Observable<Emergency[]> {
    let params = '';
    if (filters) {
      const queryParams = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null) {
          queryParams.append(key, filters[key].toString());
        }
      });
      params = queryParams.toString() ? `?${queryParams.toString()}` : '';
    }

    return this.http.get<Emergency[]>(`${this.apiUrl}/emergencias${params}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Obtener emergencia por ID
  getEmergencyById(id: number): Observable<Emergency> {
    return this.http.get<Emergency>(`${this.apiUrl}/emergencias/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Actualizar emergencia
  updateEmergency(id: number, emergency: Partial<Emergency>): Observable<Emergency> {
    return this.http.put<Emergency>(`${this.apiUrl}/emergencias/${id}`, emergency, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Editar emergencia (PATCH)
  editEmergency(id: number, changes: Partial<Emergency>): Observable<Emergency> {
    return this.http.patch<Emergency>(`${this.apiUrl}/emergencias/${id}`, changes, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Eliminar emergencia
  deleteEmergency(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/emergencias/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Convertir datos del formulario frontend al formato backend
  mapFormToBackend(formData: any): Emergency {
    return {
      userId: formData.userId || 1, // Debería venir del usuario logueado
      emergencyTypeId: formData.tipoEmergencia,
      emergencyDate: this.formatDateToISO(formData.fechaEmergencia),
      informant: formData.quienInforma,
      vehicle: formData.vehiculo,
      ubication: formData.ubicacion,
      turn: formData.turno,
      reportTime: this.formatDateTimeToISO(formData.fechaEmergencia, formData.horaReporte),
      reportTimeDescription: formData.horaReporteDescripcion,
      departureTime: this.formatDateTimeToISO(formData.fechaEmergencia, formData.horaSalida),
      departureTimeDescription: formData.horaSalidaDescripcion,
      arrivalSceneTime: formData.horaLlegadaEscena ? 
        this.formatDateTimeToISO(formData.fechaEmergencia, formData.horaLlegadaEscena) : undefined,
      arrivalSceneTimeDescription: formData.horaLlegadaEscenaDescripcion,
      arrivalHospitalTime: formData.horaLlegadaHospital ? 
        this.formatDateTimeToISO(formData.fechaEmergencia, formData.horaLlegadaHospital) : undefined,
      arrivalHospitalTimeDescription: formData.horaLlegadaHospitalDescripcion,
      returnEstationTime: this.formatDateTimeToISO(formData.fechaEmergencia, formData.horaRegresoEstacion),
      returnEstationTimeDescription: formData.horaRegresoEstacionDescripcion,
      unitsResponse: Array.isArray(formData.unidades) ? formData.unidades.join(', ') : formData.unidades,
      guardPersonnel: Array.isArray(formData.guardia) ? formData.guardia.join(', ') : formData.guardia,
      novedades: formData.novedades?.map((nov: any) => ({
        novelty: nov.tipo,
        noveltyDate: this.formatDateToISO(nov.fecha),
        description: nov.descripcion
      }))
    };
  }

  // Utilidades para formateo de fechas
  private formatDateToISO(date: Date | string): string {
    if (typeof date === 'string') {
      return new Date(date).toISOString();
    }
    return date.toISOString();
  }

  private formatDateTimeToISO(date: Date | string, time: string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const [hours, minutes] = time.split(':');
    dateObj.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return dateObj.toISOString();
  }

  // Manejo de errores
  private handleError(error: any): Observable<never> {
    console.error('Error en EmergencyService:', error);
    
    let errorMessage = 'Ha ocurrido un error inesperado';
    
    if (error.status === 401) {
      errorMessage = 'No tienes autorización para realizar esta acción';
    } else if (error.status === 403) {
      errorMessage = 'No tienes permisos suficientes';
    } else if (error.status === 404) {
      errorMessage = 'Recurso no encontrado';
    } else if (error.status === 400) {
      errorMessage = 'Datos inválidos enviados al servidor';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }

    return throwError(() => new Error(errorMessage));
  }
}