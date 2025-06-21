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
  emergencyColumns: string[] = ['emergencyId', 'emergencyDate', 'emergencyType', 'ubication', 'actions'];
  isGeneratingPdf = false;
  isGeneratingEmergencyPdf = false;
  isGeneratingStatisticsPdf = false;
  isLoadingData = false;
  isLoadingEmergencies = false;
  emergencyTypes: EmergencyType[] = [];
  emergencyTypeLabels: { [key: string]: string } = {};
  
  // Lista de emergencias para mostrar
  emergenciesList: any[] = [];
  emergenciesPreview: any = null;
  
  // Datos de estadísticas del backend
  backendStatistics: EmergencyStatistics | null = null;
  
  // Datos de análisis de tiempo para la UI
  timeAnalysisData = {
    targetTime: 0,
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
      period: ['last_month'],
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
    
    // Cargar preview de emergencias inicial
    this.loadEmergenciesPreview();

    // Observar cambios en los filtros para actualizar automáticamente
    this.filtersForm.valueChanges.subscribe(() => {
      this.loadStatisticsFromBackend();
      this.loadEmergenciesPreview();
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
   * Carga preview de emergencias del backend
   */
  loadEmergenciesPreview(): void {
    this.isLoadingEmergencies = true;
    
    const formValue = this.filtersForm.value;
    const filters: ReportFilters = {
      period: formValue.period,
      emergencyType: formValue.emergencyType
    };

    // Si es período personalizado, agregar fechas
    if (formValue.period === 'custom' && formValue.startDate && formValue.endDate) {
      filters.startDate = formValue.startDate;
      filters.endDate = formValue.endDate;
    }

    this.pdfReportService.getEmergenciesPreview(filters).subscribe({
      next: (data) => {
        this.emergenciesPreview = data.preview;
        this.emergenciesList = data.preview.sampleEmergencies || [];
        this.isLoadingEmergencies = false;
      },
      error: (error) => {
        console.error('Error al cargar preview de emergencias:', error);
        this.snackBar.open('Error al cargar lista de emergencias', 'Cerrar', { duration: 3000 });
        this.isLoadingEmergencies = false;
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
    if (formValue.period === 'custom' && formValue.startDate && formValue.endDate) {
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
      'last_7_days': 'Última semana',
      'last_month': 'Último mes',
      'last_3_months': 'Últimos 3 meses',
      'last_year': 'Último año',
      'custom': 'Período personalizado'
    };
    return labels[period] || period;
  }

  // Descargar reporte de emergencias (para entidades)
  downloadEmergencyReport() {
    this.isGeneratingEmergencyPdf = true;
    
    const formValue = this.filtersForm.value;
    const filters: ReportFilters = {
      period: formValue.period,
      emergencyType: formValue.emergencyType
    };

    if (formValue.period === 'custom' && formValue.startDate && formValue.endDate) {
      filters.startDate = formValue.startDate;
      filters.endDate = formValue.endDate;
    }

    console.log('Descargando reporte de emergencias con filtros:', filters);
    console.log('Valores del formulario:', formValue);

    this.pdfReportService.downloadEmergencyReport(filters).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `reporte_emergencias_${new Date().toISOString().slice(0, 10)}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.isGeneratingEmergencyPdf = false;
        this.snackBar.open('Reporte de emergencias descargado correctamente', 'Cerrar', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error al descargar reporte de emergencias:', error);
        this.snackBar.open('Error al descargar el reporte de emergencias', 'Cerrar', { duration: 5000 });
        this.isGeneratingEmergencyPdf = false;
      }
    });
  }

  // Descargar reporte de estadísticas (para análisis interno)
  downloadStatisticsReport() {
    this.isGeneratingStatisticsPdf = true;
    
    const formValue = this.filtersForm.value;
    const filters: ReportFilters = {
      period: formValue.period,
      emergencyType: formValue.emergencyType
    };

    if (formValue.period === 'custom' && formValue.startDate && formValue.endDate) {
      filters.startDate = formValue.startDate;
      filters.endDate = formValue.endDate;
    }

    this.pdfReportService.downloadStatisticsReport(filters).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `estadisticas_emergencias_${new Date().toISOString().slice(0, 10)}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.isGeneratingStatisticsPdf = false;
        this.snackBar.open('Reporte de estadísticas descargado correctamente', 'Cerrar', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error al descargar reporte de estadísticas:', error);
        this.snackBar.open('Error al descargar el reporte de estadísticas', 'Cerrar', { duration: 5000 });
        this.isGeneratingStatisticsPdf = false;
      }
    });
  }

  // Previsualizar emergencia individual (ventana modal o nueva pestaña)
  previewEmergency(emergency: any) {
    // Por ahora abrimos una ventana simple con la información
    const previewWindow = window.open('', '_blank', 'width=800,height=600');
    if (previewWindow) {
      previewWindow.document.write(`
        <html>
          <head><title>Preview - Emergencia #${emergency.emergencyId}</title></head>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Emergencia #${emergency.emergencyId}</h2>
            <p><strong>Fecha:</strong> ${new Date(emergency.emergencyDate).toLocaleDateString()}</p>
            <p><strong>Tipo:</strong> ${emergency.emergencyType?.emergencyType || 'N/A'}</p>
            <p><strong>Ubicación:</strong> ${emergency.ubication}</p>
            <p><strong>Informante:</strong> ${emergency.informant}</p>
            <p><strong>Turno:</strong> ${emergency.turn}</p>
            <button onclick="window.close()">Cerrar</button>
          </body>
        </html>
      `);
    }
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