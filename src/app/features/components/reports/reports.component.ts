import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { 
  PdfReportService, 
  ReportData, 
  EmergencyTypeStats, 
  MonthlyStats, 
  ReportFilters 
} from '../../../core/services/pdf-report.service';
import { EmergencyService } from '../../../core/services/emergency-report.service';
import { EmergencyType } from '../../../core/interfaces/emergency.interface';
import { 
  StatisticsService, 
  EmergencyStatistics, 
  StatisticsFilters, 
  ReportFilters as BackendReportFilters 
} from '../../../core/services/statistics.service';
import { AuthService } from '../../../core/services/auth.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    MatTabsModule,
    MatTableModule,
    MatChipsModule,
    MatDividerModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit {
  filtersForm: FormGroup;
  displayedColumns: string[] = ['month', 'emergencies', 'avgResponseTime'];
  isGeneratingPdf = false;
  isLoadingData = false;
  emergencyTypes: EmergencyType[] = [];
  emergencyTypeLabels: { [key: string]: string } = {};
  
  // Datos de estadísticas del backend
  backendStatistics: EmergencyStatistics | null = null;
  
  // Datos de análisis de tiempo para la UI
  timeAnalysisData = {
    targetTime: 15,
    minTime: 0,
    maxTime: 0,
    averageTime: 0,
    emergenciesWithinTarget: 0,
    emergenciesWithinTargetPercentage: 0,
    emergenciesOverTarget: 0,
    emergenciesOverTargetPercentage: 0
  };

  // Variables para edición del tiempo objetivo
  isEditingTargetTime = false;
  isSavingTargetTime = false;
  newTargetTime = 15;
  isAdmin = false;

  // Datos que se llenan desde el backend
  reportData: ReportData = {
    period: '',
    totalEmergencies: 0,
    responseTime: 0,
    successRate: 0,
    mostCommonType: ''
  };

  emergencyTypesStats: EmergencyTypeStats[] = [];
  monthlyStats: MonthlyStats[] = [];

  constructor(
    private fb: FormBuilder,
    private pdfReportService: PdfReportService,
    private emergencyService: EmergencyService,
    private statisticsService: StatisticsService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.filtersForm = this.fb.group({
      period: ['30days'],
      startDate: [''],
      endDate: [''],
      emergencyType: ['all']
    });
  }

  ngOnInit() {
    this.filtersForm = this.fb.group({
      period: ['LAST_MONTH'],
      startDate: [''],
      endDate: [''],
      emergencyType: ['all']
      // targetTime removido - ahora se obtiene de la configuración del sistema
    });

    // Verificar si el usuario es administrador
    this.checkAdminRole();

    // Cargar tipos de emergencia del backend
    this.loadEmergencyTypes();

    // Cargar estadísticas iniciales
    this.loadStatisticsFromBackend();

    // Observar cambios en los filtros para actualizar automáticamente
    this.filtersForm.valueChanges.subscribe(() => {
      this.loadStatisticsFromBackend();
    });
  }

  loadEmergencyTypes(): void {
    this.emergencyService.getEmergencyTypes().subscribe({
      next: (types) => {
        this.emergencyTypes = types;
        // Crear mapeo de labels dinámicamente
        this.emergencyTypeLabels = {};
        types.forEach(type => {
          this.emergencyTypeLabels[type.emergencyTypeId.toString()] = type.emergencyType;
        });
        console.log('Tipos de emergencia cargados en reportes:', this.emergencyTypes);
        console.log('Labels mapeados:', this.emergencyTypeLabels);
      },
      error: (error) => {
        console.error('Error loading emergency types for reports:', error);
        this.snackBar.open('Error al cargar tipos de emergencia', 'Cerrar', { duration: 3000 });
        // Fallback a datos hardcodeados si el backend falla
        this.emergencyTypeLabels = {
          'incendio': 'Incendio Estructural',
          'rescate': 'Rescate Vehicular',
          'emergencia_medica': 'Emergencia Médica',
          'materiales_peligrosos': 'Materiales Peligrosos',
          'inundacion': 'Inundación'
        };
      }
    });
  }

  /**
   * Carga estadísticas reales del backend
   */
  loadStatisticsFromBackend(): void {
    this.isLoadingData = true;
    
    const formValue = this.filtersForm.value;
    const filters: StatisticsFilters = {
      period: formValue.period,
      emergencyTypeId: formValue.emergencyType !== 'all' ? Number(formValue.emergencyType) : undefined
      // targetTime removido - ahora se obtiene de la configuración del sistema
    };

    // Si es período personalizado, agregar fechas
    if (formValue.period === 'CUSTOM' && formValue.startDate && formValue.endDate) {
      filters.startDate = formValue.startDate;
      filters.endDate = formValue.endDate;
    }

    console.log('Cargando estadísticas con filtros:', filters);

    this.statisticsService.getStatistics(filters).subscribe({
      next: (statistics) => {
        console.log('Estadísticas recibidas del backend:', statistics);
        this.backendStatistics = statistics;
        this.updateUIWithBackendData(statistics);
        this.isLoadingData = false;
      },
      error: (error) => {
        console.error('Error al cargar estadísticas del backend:', error);
        this.isLoadingData = false;
        
        // Mostrar mensaje de error
        this.snackBar.open('Error al cargar estadísticas del backend', 'Cerrar', { 
          duration: 5000 
        });
      }
    });
  }

  /**
   * Actualiza la UI con datos del backend
   */
  private updateUIWithBackendData(statistics: EmergencyStatistics): void {
    // Actualizar datos principales
    this.reportData = {
      period: this.getPeriodLabel(this.filtersForm.value.period),
      totalEmergencies: statistics.totalEmergencies,
      responseTime: statistics.averageResponseTimeMinutes,
      successRate: statistics.timeAnalysis.emergenciesWithinTargetPercentage,
      mostCommonType: statistics.mostCommonEmergencyType.type
    };

    // Actualizar estadísticas por tipo
    this.emergencyTypesStats = statistics.emergenciesByType.map(type => ({
      type: type.type,
      count: type.count,
      percentage: type.percentage,
      avgResponseTime: type.averageResponseTimeMinutes
    }));

    // Actualizar tendencias mensuales
    this.monthlyStats = statistics.monthlyTrends.map(trend => ({
      month: `${trend.month} ${trend.year}`,
      emergencies: trend.totalEmergencies,
      avgResponseTime: trend.averageResponseTimeMinutes
    }));

    // Actualizar datos de análisis de tiempo
    this.timeAnalysisData = {
      targetTime: statistics.timeAnalysis.targetTime || 0,
      minTime: statistics.timeAnalysis.minTime || 0,
      maxTime: statistics.timeAnalysis.maxTime || 0,
      averageTime: statistics.timeAnalysis.averageTime || 0,
      emergenciesWithinTarget: statistics.timeAnalysis.emergenciesWithinTarget || 0,
      emergenciesWithinTargetPercentage: statistics.timeAnalysis.emergenciesWithinTargetPercentage || 0,
      emergenciesOverTarget: statistics.timeAnalysis.emergenciesOverTarget || 0,
      emergenciesOverTargetPercentage: statistics.timeAnalysis.emergenciesOverTargetPercentage || 0
    };

    console.log('UI actualizada con datos del backend');
  }

  applyFilters() {
    // Los filtros se aplican automáticamente con valueChanges
    this.snackBar.open('Filtros aplicados correctamente', 'Cerrar', { duration: 3000 });
  }

  getEmergencyTypeLabel(type: string): string {
    return this.emergencyTypeLabels[type] || type;
  }

  private getPeriodLabel(period: string): string {
    const labels: { [key: string]: string } = {
      // Nuevos valores del backend
      'LAST_WEEK': 'Última semana',
      'LAST_MONTH': 'Último mes',
      'LAST_3_MONTHS': 'Últimos 3 meses',
      'LAST_YEAR': 'Último año',
      'CUSTOM': 'Período personalizado',
      // Valores legacy para compatibilidad
      '7days': 'Últimos 7 días',
      '30days': 'Últimos 30 días',
      '3months': 'Últimos 3 meses',
      'year': 'Último año',
      'custom': 'Período personalizado'
    };
    return labels[period] || period;
  }

  async exportReport(format: 'pdf') {
    if (this.isGeneratingPdf) return;

    this.isGeneratingPdf = true;
    this.snackBar.open('Generando reporte PDF desde backend...', '', { duration: 2000 });

    try {
      const formValue = this.filtersForm.value;
      const filters: BackendReportFilters = {
        period: formValue.period,
        startDate: formValue.startDate,
        endDate: formValue.endDate,
        emergencyTypeId: formValue.emergencyType !== 'all' ? Number(formValue.emergencyType) : undefined,
        format: 'PDF'
      };

      // Usar el servicio de estadísticas para descargar el reporte
      this.statisticsService.downloadReport(filters).subscribe({
        next: (blob) => {
          // Crear URL blob y descargar
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `reporte_emergencias_${new Date().getTime()}.pdf`;
          link.click();
          window.URL.revokeObjectURL(url);
          
          this.snackBar.open('Reporte PDF descargado exitosamente', 'Cerrar', { duration: 3000 });
        },
        error: (error) => {
          console.error('Error al descargar reporte del backend:', error);
          this.snackBar.open('Error al generar reporte del backend', 'Cerrar', { duration: 3000 });
          
          // Fallback al método legacy
          this.generateLocalPDFReport();
        },
        complete: () => {
          this.isGeneratingPdf = false;
        }
      });

    } catch (error) {
      console.error('Error en exportReport:', error);
      this.snackBar.open('Error al generar reporte', 'Cerrar', { duration: 3000 });
      this.isGeneratingPdf = false;
    }
  }

  /**
   * Método fallback para generar reporte local si el backend falla
   */
  private async generateLocalPDFReport() {
    try {
      const filters: ReportFilters = {
        period: this.filtersForm.value.period,
        startDate: this.filtersForm.value.startDate,
        endDate: this.filtersForm.value.endDate,
        emergencyType: this.filtersForm.value.emergencyType
      };

      await this.pdfReportService.generateEmergencyReport(
        this.reportData,
        this.emergencyTypesStats,
        this.monthlyStats,
        filters
      );
      
      this.snackBar.open('Reporte local generado exitosamente', 'Cerrar', { duration: 3000 });
    } catch (error) {
      console.error('Error generando reporte local:', error);
      this.snackBar.open('Error al generar reporte local', 'Cerrar', { duration: 3000 });
    }
  }

  printReport() {
    window.print();
  }

  // ===== MÉTODOS PARA EDICIÓN DE TIEMPO OBJETIVO =====

  /**
   * Verifica si el usuario actual es administrador
   */
  checkAdminRole(): void {
    // Verificar si el usuario tiene rol de administrador
    const userRole = this.authService.getUserRole();
    this.isAdmin = userRole === 'admin';
  }

  /**
   * Inicia la edición del tiempo objetivo
   */
  startEditTargetTime(): void {
    this.isEditingTargetTime = true;
    this.newTargetTime = this.timeAnalysisData.targetTime || 15;
  }

  /**
   * Cancela la edición del tiempo objetivo
   */
  cancelEditTargetTime(): void {
    this.isEditingTargetTime = false;
    this.newTargetTime = this.timeAnalysisData.targetTime || 15;
  }

  /**
   * Guarda el nuevo tiempo objetivo
   */
  saveTargetTime(): void {
    if (!this.newTargetTime || this.newTargetTime < 1 || this.newTargetTime > 120) {
      this.snackBar.open('El tiempo objetivo debe estar entre 1 y 120 minutos', 'Cerrar', { 
        duration: 3000 
      });
      return;
    }

    this.isSavingTargetTime = true;

    this.statisticsService.updateTargetTime(this.newTargetTime, 'Tiempo objetivo actualizado desde reportes').subscribe({
      next: (response) => {
        this.isSavingTargetTime = false;
        this.isEditingTargetTime = false;
        this.timeAnalysisData.targetTime = this.newTargetTime;
        
        this.snackBar.open('Tiempo objetivo actualizado exitosamente', 'Cerrar', { 
          duration: 3000 
        });

        // Recargar estadísticas para reflejar el cambio
        this.loadStatisticsFromBackend();
      },
      error: (error) => {
        console.error('Error al actualizar tiempo objetivo:', error);
        this.isSavingTargetTime = false;
        
        this.snackBar.open('Error al actualizar el tiempo objetivo', 'Cerrar', { 
          duration: 3000 
        });
      }
    });
  }
} 