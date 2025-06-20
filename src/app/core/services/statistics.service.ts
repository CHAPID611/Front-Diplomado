import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface EmergencyStatistics {
  totalEmergencies: number;
  averageResponseTime: string;
  averageResponseTimeMinutes: number;
  mostCommonEmergencyType: {
    type: string;
    count: number;
    percentage: number;
  };
  emergenciesByType: Array<{
    type: string;
    count: number;
    percentage: number;
    averageResponseTime: string;
    averageResponseTimeMinutes: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    year: number;
    totalEmergencies: number;
    averageResponseTime: string;
    averageResponseTimeMinutes: number;
  }>;
  timeAnalysis: {
    targetTime: number;
    maxTime: number;
    averageTime: number;
    minTime: number;
    emergenciesWithinTarget: number;
    emergenciesWithinTargetPercentage: number;
    emergenciesOverTarget: number;
    emergenciesOverTargetPercentage: number;
  };
}

export interface StatisticsFilters {
  period?: 'LAST_WEEK' | 'LAST_MONTH' | 'LAST_3_MONTHS' | 'LAST_YEAR' | 'CUSTOM';
  startDate?: string;
  endDate?: string;
  emergencyTypeId?: number;
  userId?: number;
  // targetTime removido - ahora se maneja a través de la configuración del sistema
}

export interface ReportFilters {
  period?: 'LAST_WEEK' | 'LAST_MONTH' | 'LAST_3_MONTHS' | 'LAST_YEAR' | 'CUSTOM';
  startDate?: string;
  endDate?: string;
  emergencyTypeId?: number;
  userId?: number;
  format?: 'PDF';
}

export interface ReportPreview {
  period: {
    start: string;
    end: string;
  };
  totalEmergencies: number;
  averageResponseTime: string;
  emergenciesByType: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  emergenciesByUser: Array<{
    user: string;
    count: number;
    percentage: number;
  }>;
  sampleEmergencies: any[];
}

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {
  private readonly apiUrl = environment.production 
    ? 'https://api.bomberos.com' 
    : 'http://localhost:3000';

  constructor(private http: HttpClient) { }

  /**
   * Obtiene estadísticas completas
   */
  getStatistics(filters: StatisticsFilters = {}): Observable<EmergencyStatistics> {
    let params = new HttpParams();
    
    if (filters.period) params = params.set('period', filters.period);
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);
    if (filters.emergencyTypeId) params = params.set('emergencyTypeId', filters.emergencyTypeId.toString());
    if (filters.userId) params = params.set('userId', filters.userId.toString());

    return this.http.get<EmergencyStatistics>(`${this.apiUrl}/statistics`, { params });
  }

  /**
   * Obtiene resumen de estadísticas
   */
  getStatisticsSummary(filters: StatisticsFilters = {}): Observable<{
    totalEmergencies: number;
    averageResponseTime: string;
    mostCommonType: string;
    emergenciesWithinTarget: number;
    emergenciesWithinTargetPercentage: number;
  }> {
    let params = new HttpParams();
    
    if (filters.period) params = params.set('period', filters.period);
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);
    if (filters.emergencyTypeId) params = params.set('emergencyTypeId', filters.emergencyTypeId.toString());
    if (filters.userId) params = params.set('userId', filters.userId.toString());

    return this.http.get<{
      totalEmergencies: number;
      averageResponseTime: string;
      mostCommonType: string;
      emergenciesWithinTarget: number;
      emergenciesWithinTargetPercentage: number;
    }>(`${this.apiUrl}/statistics/summary`, { params });
  }

  /**
   * Obtiene estadísticas por tipo
   */
  getStatisticsByType(filters: StatisticsFilters = {}): Observable<{
    emergenciesByType: Array<{
      type: string;
      count: number;
      percentage: number;
      averageResponseTime: string;
      averageResponseTimeMinutes: number;
    }>;
    mostCommonType: {
      type: string;
      count: number;
      percentage: number;
    };
  }> {
    let params = new HttpParams();
    
    if (filters.period) params = params.set('period', filters.period);
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);
    if (filters.emergencyTypeId) params = params.set('emergencyTypeId', filters.emergencyTypeId.toString());
    if (filters.userId) params = params.set('userId', filters.userId.toString());

    return this.http.get<any>(`${this.apiUrl}/statistics/by-type`, { params });
  }

  /**
   * Obtiene tendencias mensuales
   */
  getMonthlyTrends(filters: StatisticsFilters = {}): Observable<{
    monthlyTrends: Array<{
      month: string;
      year: number;
      totalEmergencies: number;
      averageResponseTime: string;
      averageResponseTimeMinutes: number;
    }>;
  }> {
    let params = new HttpParams();
    
    if (filters.period) params = params.set('period', filters.period);
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);
    if (filters.emergencyTypeId) params = params.set('emergencyTypeId', filters.emergencyTypeId.toString());
    if (filters.userId) params = params.set('userId', filters.userId.toString());

    return this.http.get<any>(`${this.apiUrl}/statistics/monthly-trends`, { params });
  }

  /**
   * Obtiene análisis de tiempos
   */
  getTimeAnalysis(filters: StatisticsFilters = {}): Observable<{
    timeAnalysis: {
      targetTime: number;
      maxTime: number;
      averageTime: number;
      minTime: number;
      emergenciesWithinTarget: number;
      emergenciesWithinTargetPercentage: number;
      emergenciesOverTarget: number;
      emergenciesOverTargetPercentage: number;
    };
  }> {
    let params = new HttpParams();
    
    if (filters.period) params = params.set('period', filters.period);
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);
    if (filters.emergencyTypeId) params = params.set('emergencyTypeId', filters.emergencyTypeId.toString());
    if (filters.userId) params = params.set('userId', filters.userId.toString());

    return this.http.get<any>(`${this.apiUrl}/statistics/time-analysis`, { params });
  }

  /**
   * Obtiene preview de reporte
   */
  getReportPreview(filters: ReportFilters = {}): Observable<{ success: boolean; preview: ReportPreview }> {
    let params = new HttpParams();
    
    if (filters.period) params = params.set('period', filters.period);
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);
    if (filters.emergencyTypeId) params = params.set('emergencyTypeId', filters.emergencyTypeId.toString());
    if (filters.userId) params = params.set('userId', filters.userId.toString());

    return this.http.get<{ success: boolean; preview: ReportPreview }>(`${this.apiUrl}/reportes/preview`, { params });
  }

  /**
   * Genera y descarga un reporte PDF
   */
  downloadReport(filters: ReportFilters = {}): Observable<Blob> {
    let params = new HttpParams();
    
    params = params.set('format', 'pdf');
    if (filters.period) params = params.set('period', filters.period);
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);
    if (filters.emergencyTypeId) params = params.set('emergencyTypeId', filters.emergencyTypeId.toString());
    if (filters.userId) params = params.set('userId', filters.userId.toString());

    return this.http.get(`${this.apiUrl}/reportes`, { 
      params, 
      responseType: 'blob'
    });
  }

  /**
   * Obtiene tiempo objetivo configurado
   */
  getTargetTime(): Observable<{ statusCode: number; message: string; data: { targetTime: number } }> {
    return this.http.get<{ statusCode: number; message: string; data: { targetTime: number } }>(`${this.apiUrl}/system-config/target-time`);
  }

  /**
   * Actualiza tiempo objetivo (solo administradores)
   */
  updateTargetTime(targetTime: number, description?: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/system-config/target-time`, {
      targetTime,
      description
    });
  }

  /**
   * Obtiene todas las configuraciones del sistema (solo administradores)
   */
  getSystemConfigurations(): Observable<any> {
    return this.http.get(`${this.apiUrl}/system-config/configurations`);
  }
} 