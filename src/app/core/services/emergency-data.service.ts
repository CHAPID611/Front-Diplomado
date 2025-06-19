import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// Interfaces para datos auxiliares
export interface PersonalDisponible {
  id: string;
  nombre: string;
  cargo: string;
  activo: boolean;
}

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

  // Datos mock temporales hasta conectar con el backend de personal
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

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  getPersonalDisponible(): Observable<PersonalDisponible[]> {
    // TODO: Conectar con el endpoint de personal del backend
    // return this.http.get<PersonalDisponible[]>(`${this.apiUrl}/personal`, {
    //   headers: this.getHeaders()
    // }).pipe(catchError(() => of(this.personalDisponible.filter(p => p.activo))));
    
    return of(this.personalDisponible.filter(p => p.activo));
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

  private handleError(error: any): Observable<any[]> {
    console.error('Error en EmergencyDataService:', error);
    return of([]);
  }
} 