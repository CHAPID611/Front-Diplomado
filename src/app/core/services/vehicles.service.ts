import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Vehicle {
  vehicleId: number;
  name: string;
  plate: string;
  status: 'disponible' | 'en_emergencia' | 'en_mantenimiento';
  createdAt: Date;
  updatedAt: Date;
}

export interface VehicleStats {
  total: number;
  available: number;
  inEmergency: number;
  inMaintenance: number;
}

@Injectable({
  providedIn: 'root'
})
export class VehiclesService {
  private apiUrl = `${environment.apiUrl}/vehicles`;

  constructor(private http: HttpClient) { }

  getVehicles(): Observable<Vehicle[]> {
    return this.http.get<Vehicle[]>(this.apiUrl);
  }

  getVehicleStats(): Observable<VehicleStats> {
    return new Observable<VehicleStats>(observer => {
      this.getVehicles().subscribe({
        next: (vehicles) => {
          const stats: VehicleStats = {
            total: vehicles.length,
            available: vehicles.filter(v => v.status === 'disponible').length,
            inEmergency: vehicles.filter(v => v.status === 'en_emergencia').length,
            inMaintenance: vehicles.filter(v => v.status === 'en_mantenimiento').length
          };
          observer.next(stats);
          observer.complete();
        },
        error: (error) => observer.error(error)
      });
    });
  }

  getVehicle(id: number): Observable<Vehicle> {
    return this.http.get<Vehicle>(`${this.apiUrl}/${id}`);
  }

  createVehicle(vehicle: Partial<Vehicle>): Observable<Vehicle> {
    return this.http.post<Vehicle>(this.apiUrl, vehicle);
  }

  updateVehicle(id: number, vehicle: Partial<Vehicle>): Observable<Vehicle> {
    return this.http.patch<Vehicle>(`${this.apiUrl}/${id}`, vehicle);
  }

  deleteVehicle(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
} 