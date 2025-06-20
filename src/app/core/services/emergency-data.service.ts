import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { PersonalDisponible } from '../interfaces/personal.interface';

export interface VehiculoDisponible {
  id: string;
  nombre: string;
  tipo: string;
  disponible: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class EmergencyDataService {
  private apiUrl = environment.apiUrl;

  // Datos mock como fallback
  private personalDisponibleMock: PersonalDisponible[] = [
    { 
      id: 'p1', 
      personalId: 1,
      nombre: 'Carlos Rodríguez', 
      nombreCompleto: 'Carlos Rodríguez Vásquez',
      rango: 'Capitán',
      rangoId: 1,
      estado: 'Activo',
      email: 'carlos.rodriguez@bomberos.com',
      telefono: '3001234567',
      experiencia: 10,
      activo: true,
      cargo: 'Capitán' 
    },
    { 
      id: 'p2', 
      personalId: 2,
      nombre: 'Ana García', 
      nombreCompleto: 'Ana Patricia García López',
      rango: 'Teniente',
      rangoId: 2,
      estado: 'Activo',
      email: 'ana.garcia@bomberos.com',
      telefono: '3007654321',
      experiencia: 7,
      activo: true,
      cargo: 'Teniente' 
    },
    { 
      id: 'p3', 
      personalId: 3,
      nombre: 'Luis Martínez', 
      nombreCompleto: 'Luis Fernando Martínez Silva',
      rango: 'Sargento',
      rangoId: 3,
      estado: 'Activo',
      email: 'luis.martinez@bomberos.com',
      telefono: '3009876543',
      experiencia: 5,
      activo: true,
      cargo: 'Sargento' 
    },
    { 
      id: 'p4', 
      personalId: 4,
      nombre: 'María López', 
      nombreCompleto: 'María Elena López Ramírez',
      rango: 'Bombero',
      rangoId: 4,
      estado: 'Activo',
      email: 'maria.lopez@bomberos.com',
      telefono: '3005432187',
      experiencia: 3,
      activo: true,
      cargo: 'Bombero' 
    }
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

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  getPersonalDisponible(): Observable<PersonalDisponible[]> {
    return this.http.get<{success: boolean, data: PersonalDisponible[], total: number}>(`${this.apiUrl}/emergencias/personal/disponible`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.data || []),
      catchError((error) => {
        console.warn('Error al obtener personal del backend, usando datos mock:', error);
        return of(this.personalDisponibleMock.filter((p: PersonalDisponible) => p.activo));
      })
    );
  }

  getVehiculosDisponibles(): Observable<VehiculoDisponible[]> {
    // TODO: Conectar con el endpoint de vehículos del backend cuando esté disponible
    return of(this.vehiculosDisponibles.filter(v => v.disponible));
  }

  // Métodos para cuando se conecte con el backend real de personal
  /*
  getPersonalActivo(): Observable<PersonalDisponible[]> {
    return this.http.get<PersonalDisponible[]>(`${this.apiUrl}/personal/activo`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  getVehiculos(): Observable<VehiculoDisponible[]> {
    return this.http.get<VehiculoDisponible[]>(`${this.apiUrl}/vehiculos`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }
  */

  /**
   * Obtiene las emergencias activas (personal ocupado)
   */
  getActiveEmergencies(): Observable<any[]> {
    return this.http.get<{success: boolean, data: any[], total: number}>(`${this.apiUrl}/emergencias/personal/activo`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.data || []),
      catchError((error) => {
        console.warn('Error al obtener emergencias activas:', error);
        return of([]);
      })
    );
  }

  /**
   * Completa una emergencia (libera personal y vehículos)
   */
  completeEmergency(emergencyId: number, returnStationTime: string, description?: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/emergencias/${emergencyId}/completar`, {
      returnStationTime,
      description
    }, {
      headers: this.getHeaders()
    }).pipe(
      catchError((error) => {
        console.error('Error al completar emergencia:', error);
        throw error;
      })
    );
  }

  private handleError(error: any): Observable<any[]> {
    console.error('Error en EmergencyDataService:', error);
    return of([]);
  }
} 