import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ReportFilters {
  period: string;
  startDate?: string;
  endDate?: string;
  emergencyType: string;
  emergencyId?: number; // Para filtrar por emergencia específica
}

export interface ReportData {
  period: string;
  totalEmergencies: number;
  responseTime: number;
  successRate: number;
  mostCommonType: string;
}

export interface EmergencyTypeStats {
  type: string;
  count: number;
  percentage: number;
  avgResponseTime: number;
}

export interface MonthlyStats {
  month: string;
  emergencies: number;
  avgResponseTime: number;
}

@Injectable({
  providedIn: 'root'
})
export class PdfReportService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  // Obtener preview de emergencias (para la lista)
  getEmergenciesPreview(filters: ReportFilters): Observable<any> {
    const params = new URLSearchParams();
    
    if (filters.period) params.append('period', filters.period);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.emergencyType !== 'all' && filters.emergencyType) {
      params.append('emergencyTypeId', filters.emergencyType);
    }
    if (filters.emergencyId) {
      params.append('emergencyId', filters.emergencyId.toString());
    }

    return this.http.get(`${this.apiUrl}/reportes/preview?${params.toString()}`, {
      headers: this.getHeaders()
    });
  }

  // Descargar reporte de emergencias (para entidades)
  downloadEmergencyReport(filters: ReportFilters): Observable<Blob> {
    const params = new URLSearchParams();
    params.append('format', 'pdf');
    
    if (filters.period) params.append('period', filters.period);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.emergencyType !== 'all' && filters.emergencyType) {
      params.append('emergencyTypeId', filters.emergencyType);
    }
    if (filters.emergencyId) {
      params.append('emergencyId', filters.emergencyId.toString());
    }

    console.log('PdfReportService: URL siendo llamada:', `${this.apiUrl}/reportes/emergencias?${params.toString()}`);
    console.log('PdfReportService: Parámetros enviados:', Object.fromEntries(params.entries()));

    // NO usar headers manuales, confiar en el interceptor de Angular
    return this.http.get(`${this.apiUrl}/reportes/emergencias?${params.toString()}`, {
      responseType: 'blob'
    });
  }

  // Descargar reporte de estadísticas (para análisis interno)
  downloadStatisticsReport(filters: ReportFilters): Observable<Blob> {
    const params = new URLSearchParams();
    params.append('format', 'pdf');
    
    if (filters.period) params.append('period', filters.period);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.emergencyType !== 'all' && filters.emergencyType) {
      params.append('emergencyTypeId', filters.emergencyType);
    }

    return this.http.get(`${this.apiUrl}/reportes/estadisticas?${params.toString()}`, {
      headers: this.getHeaders(),
      responseType: 'blob'
    });
  }

  async generateEmergencyReport(
    reportData: ReportData,
    emergencyTypesStats: EmergencyTypeStats[],
    monthlyStats: MonthlyStats[],
    filters: ReportFilters
  ): Promise<void> {
    // Por ahora, generamos un reporte HTML y lo abrimos en una nueva ventana para impresión/PDF
    const reportHtml = this.generateReportHtml(reportData, emergencyTypesStats, monthlyStats, filters);
    
    // Crear una nueva ventana con el reporte
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (printWindow) {
      printWindow.document.write(reportHtml);
      printWindow.document.close();
      
      // Esperar a que se cargue el contenido y luego activar la impresión
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
    }
  }

  private generateReportHtml(
    reportData: ReportData,
    emergencyTypesStats: EmergencyTypeStats[],
    monthlyStats: MonthlyStats[],
    filters: ReportFilters
  ): string {
    const currentDate = this.formatDate(new Date());
    const periodLabel = this.getPeriodLabel(filters.period);
    const typeLabel = this.getEmergencyTypeLabel(filters.emergencyType);

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Reporte de Emergencias - Cuerpo de Bomberos</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                margin: 0;
                padding: 20px;
                color: #2c3e50;
                line-height: 1.6;
            }
            .header {
                text-align: center;
                border-bottom: 3px solid #c62828;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .header h1 {
                color: #c62828;
                font-size: 28px;
                margin: 0;
                font-weight: bold;
            }
            .header h2 {
                color: #6c757d;
                font-size: 18px;
                margin: 10px 0;
                font-weight: normal;
            }
            .header .date {
                color: #6c757d;
                font-size: 14px;
                margin-top: 10px;
            }
            .section {
                margin-bottom: 30px;
                page-break-inside: avoid;
            }
            .section-title {
                color: #c62828;
                font-size: 20px;
                font-weight: bold;
                margin-bottom: 15px;
                border-left: 4px solid #c62828;
                padding-left: 10px;
            }
            .filters-info {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 8px;
                border-left: 4px solid #17a2b8;
                margin-bottom: 20px;
            }
            .filters-info h3 {
                margin: 0 0 10px 0;
                color: #2c3e50;
                font-size: 16px;
            }
            .filter-item {
                margin: 5px 0;
                font-size: 14px;
            }
            .summary-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 20px;
                margin-bottom: 30px;
            }
            .summary-card {
                background: #ffffff;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                padding: 20px;
                text-align: center;
                border-left: 4px solid #c62828;
            }
            .summary-card h4 {
                margin: 0 0 10px 0;
                color: #6c757d;
                font-size: 14px;
                text-transform: uppercase;
            }
            .summary-card .value {
                font-size: 32px;
                font-weight: bold;
                color: #2c3e50;
                margin: 10px 0;
            }
            .summary-card .subtitle {
                color: #6c757d;
                font-size: 12px;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin: 15px 0;
                background: white;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            th {
                background: #c62828;
                color: white;
                padding: 12px;
                text-align: left;
                font-weight: bold;
                font-size: 14px;
            }
            td {
                padding: 12px;
                border-bottom: 1px solid #e0e0e0;
                font-size: 13px;
            }
            tr:nth-child(even) {
                background: #f8f9fa;
            }
            tr:hover {
                background: #e9ecef;
            }
            .metric-badge {
                background: #f8f9fa;
                padding: 4px 8px;
                border-radius: 12px;
                font-weight: bold;
                font-size: 12px;
                border: 1px solid #e0e0e0;
            }
            .badge-success {
                background: #28a745;
                color: white;
                border-color: #28a745;
            }
            .badge-warning {
                background: #ffc107;
                color: #2c3e50;
                border-color: #ffc107;
            }
            .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e0e0e0;
                text-align: center;
                color: #6c757d;
                font-size: 12px;
            }
            @media print {
                body { margin: 0; }
                .section { page-break-inside: avoid; }
                .summary-grid { grid-template-columns: repeat(4, 1fr); }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🚒 CUERPO DE BOMBEROS</h1>
            <h2>Reporte de Emergencias y Estadísticas</h2>
            <div class="date">Generado el: ${currentDate}</div>
        </div>

        <div class="section">
            <div class="filters-info">
                <h3>📋 Filtros Aplicados</h3>
                <div class="filter-item"><strong>Período:</strong> ${periodLabel}</div>
                ${filters.period === 'custom' && filters.startDate && filters.endDate ? 
                    `<div class="filter-item"><strong>Fechas:</strong> ${this.formatDate(new Date(filters.startDate))} - ${this.formatDate(new Date(filters.endDate))}</div>` : ''}
                <div class="filter-item"><strong>Tipo de emergencia:</strong> ${typeLabel}</div>
            </div>
        </div>

        <div class="section">
            <h2 class="section-title">📊 Resumen Ejecutivo</h2>
            <div class="summary-grid">
                <div class="summary-card">
                    <h4>Total Emergencias</h4>
                    <div class="value">${reportData.totalEmergencies}</div>
                    <div class="subtitle">en el período seleccionado</div>
                </div>
                <div class="summary-card">
                    <h4>Tiempo Promedio</h4>
                    <div class="value">${reportData.responseTime}min</div>
                    <div class="subtitle">tiempo de respuesta</div>
                </div>
                <div class="summary-card">
                    <h4>Tasa de Éxito</h4>
                    <div class="value">${reportData.successRate}%</div>
                    <div class="subtitle">emergencias resueltas</div>
                </div>
                <div class="summary-card">
                    <h4>Tipo Más Común</h4>
                    <div class="value" style="font-size: 18px;">${reportData.mostCommonType}</div>
                    <div class="subtitle">tipo de emergencia</div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2 class="section-title">🔥 Estadísticas por Tipo de Emergencia</h2>
            <table>
                <thead>
                    <tr>
                        <th>Tipo de Emergencia</th>
                        <th>Casos</th>
                        <th>Porcentaje</th>
                        <th>Tiempo Promedio</th>
                    </tr>
                </thead>
                <tbody>
                    ${emergencyTypesStats.map(stat => `
                        <tr>
                            <td>${this.getEmergencyTypeLabel(stat.type)}</td>
                            <td><span class="metric-badge">${stat.count}</span></td>
                            <td><span class="metric-badge">${stat.percentage}%</span></td>
                            <td><span class="metric-badge badge-warning">${stat.avgResponseTime} min</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2 class="section-title">📅 Estadísticas Mensuales</h2>
            <table>
                <thead>
                    <tr>
                        <th>Mes</th>
                        <th>Total Emergencias</th>
                        <th>Tiempo Promedio</th>
                    </tr>
                </thead>
                <tbody>
                    ${monthlyStats.map(stat => `
                        <tr>
                            <td>${stat.month}</td>
                            <td><span class="metric-badge">${stat.emergencies}</span></td>
                            <td><span class="metric-badge badge-warning">${stat.avgResponseTime} min</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="footer">
            <p>Sistema de Gestión de Emergencias - Cuerpo de Bomberos</p>
            <p>Este reporte fue generado automáticamente el ${currentDate}</p>
        </div>
    </body>
    </html>
    `;
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private getPeriodLabel(period: string): string {
    const labels: { [key: string]: string } = {
      '7days': 'Últimos 7 días',
      '30days': 'Últimos 30 días',
      '3months': 'Últimos 3 meses',
      'year': 'Último año',
      'custom': 'Período personalizado'
    };
    return labels[period] || period;
  }

  private getEmergencyTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'all': 'Todos los tipos',
      'incendio': 'Incendio Estructural',
      'rescate': 'Rescate Vehicular',
      'emergencia_medica': 'Emergencia Médica',
      'materiales_peligrosos': 'Materiales Peligrosos',
      'inundacion': 'Inundación'
    };
    return labels[type] || type;
  }
} 