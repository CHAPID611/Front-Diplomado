import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
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
import { NotificationService } from '../../../shared/services/notification.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
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
  isGeneratingIndividualPdf: number | null = null; // ID de la emergencia que se está generando
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
  newTargetTime = 0;
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
    private notificationService: NotificationService,
    private http: HttpClient,
    private router: Router
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

    // Observar cambios en el período para agregar/quitar validaciones
    this.filtersForm.get('period')?.valueChanges.subscribe(period => {
      const startDateControl = this.filtersForm.get('startDate');
      const endDateControl = this.filtersForm.get('endDate');
      
      if (period === 'custom') {
        // Agregar validaciones requeridas para fechas
        startDateControl?.setValidators([Validators.required]);
        endDateControl?.setValidators([Validators.required]);
      } else {
        // Remover validaciones para otros períodos
        startDateControl?.clearValidators();
        endDateControl?.clearValidators();
        // Limpiar valores de fechas cuando no es período personalizado
        startDateControl?.setValue('');
        endDateControl?.setValue('');
      }
      
      startDateControl?.updateValueAndValidity();
      endDateControl?.updateValueAndValidity();
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
        this.notificationService.error('Error de Carga', 'No se pudieron cargar los tipos de emergencia.');
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
    
    // Validar que si es período personalizado, las fechas estén presentes
    if (formValue.period === 'custom') {
      if (!formValue.startDate || !formValue.endDate) {
        console.log('Período personalizado seleccionado pero fechas no definidas, omitiendo carga de preview');
        this.isLoadingEmergencies = false;
        this.emergenciesList = [];
        this.emergenciesPreview = null;
        return;
      }
    }
    
    const filters: ReportFilters = {
      period: formValue.period,
      emergencyType: formValue.emergencyType
    };

    // Si es período personalizado, agregar fechas (ya validadas arriba)
    if (formValue.period === 'custom' && formValue.startDate && formValue.endDate) {
      // Convertir fechas a formato ISO string
      filters.startDate = formValue.startDate instanceof Date 
        ? formValue.startDate.toISOString().split('T')[0] 
        : formValue.startDate;
      filters.endDate = formValue.endDate instanceof Date 
        ? formValue.endDate.toISOString().split('T')[0] 
        : formValue.endDate;
    }

    console.log('Cargando preview de emergencias con filtros:', filters);

    this.pdfReportService.getEmergenciesPreview(filters).subscribe({
      next: (data) => {
        this.emergenciesPreview = data.preview;
        this.emergenciesList = data.preview.sampleEmergencies || [];
        this.isLoadingEmergencies = false;
        console.log('Preview cargado exitosamente:', data.preview);
      },
      error: (error) => {
        console.error('Error al cargar preview de emergencias:', error);
        this.notificationService.error('Error de Carga', 'No se pudo cargar la lista de emergencias.');
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
    
    // Validar que si es período personalizado, las fechas estén presentes
    if (formValue.period === 'custom') {
      if (!formValue.startDate || !formValue.endDate) {
        console.log('Período personalizado seleccionado pero fechas no definidas, omitiendo carga de estadísticas');
        this.isLoadingData = false;
        return;
      }
    }
    
    const filters: StatisticsFilters = {
      period: formValue.period,
      emergencyTypeId: formValue.emergencyType !== 'all' ? Number(formValue.emergencyType) : undefined
      // targetTime removido - ahora se obtiene de la configuración del sistema
    };

    // Si es período personalizado, agregar fechas (ya validadas arriba)
    if (formValue.period === 'custom' && formValue.startDate && formValue.endDate) {
      // Convertir fechas a formato ISO string
      filters.startDate = formValue.startDate instanceof Date 
        ? formValue.startDate.toISOString().split('T')[0] 
        : formValue.startDate;
      filters.endDate = formValue.endDate instanceof Date 
        ? formValue.endDate.toISOString().split('T')[0] 
        : formValue.endDate;
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
        this.notificationService.error('Error de Estadísticas', 'No se pudieron cargar las estadísticas del sistema.');
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
    this.notificationService.success('Filtros Aplicados', 'Los filtros se han aplicado correctamente.');
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
    const formValue = this.filtersForm.value;
    
    // Validar que si es período personalizado, las fechas estén presentes
    if (formValue.period === 'custom') {
      if (!formValue.startDate || !formValue.endDate) {
          this.notificationService.warning('Filtros', 'Por favor selecciona las fechas de inicio y fin para el período personalizado');
        return;
      }
    }
    
    this.isGeneratingEmergencyPdf = true;
    
    const filters: ReportFilters = {
      period: formValue.period,
      emergencyType: formValue.emergencyType
    };

    if (formValue.period === 'custom' && formValue.startDate && formValue.endDate) {
      // Convertir fechas a formato ISO string
      filters.startDate = formValue.startDate instanceof Date 
        ? formValue.startDate.toISOString().split('T')[0] 
        : formValue.startDate;
      filters.endDate = formValue.endDate instanceof Date 
        ? formValue.endDate.toISOString().split('T')[0] 
        : formValue.endDate;
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
        this.notificationService.success('Descarga Exitosa', 'El reporte de emergencias se ha descargado correctamente.');
      },
      error: (error) => {
        console.error('Error al descargar reporte de emergencias:', error);
        this.notificationService.error('Error de Descarga', 'No se pudo descargar el reporte de emergencias.');
        this.isGeneratingEmergencyPdf = false;
      }
    });
  }

  // Descargar reporte de estadísticas (para análisis interno)
  downloadStatisticsReport() {
    const formValue = this.filtersForm.value;
    
    // Validar que si es período personalizado, las fechas estén presentes
    if (formValue.period === 'custom') {
      if (!formValue.startDate || !formValue.endDate) {
        this.notificationService.warning('Filtros', 'Por favor selecciona las fechas de inicio y fin para el período personalizado');
        return;
      }
    }
    
    this.isGeneratingStatisticsPdf = true;
    
    const filters: ReportFilters = {
      period: formValue.period,
      emergencyType: formValue.emergencyType
    };

    if (formValue.period === 'custom' && formValue.startDate && formValue.endDate) {
      // Convertir fechas a formato ISO string
      filters.startDate = formValue.startDate instanceof Date 
        ? formValue.startDate.toISOString().split('T')[0] 
        : formValue.startDate;
      filters.endDate = formValue.endDate instanceof Date 
        ? formValue.endDate.toISOString().split('T')[0] 
        : formValue.endDate;
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
        this.notificationService.success('Descarga Exitosa', 'El reporte de estadísticas se ha descargado correctamente.');
      },
      error: (error) => {
        console.error('Error al descargar reporte de estadísticas:', error);
        this.notificationService.error('Error de Descarga', 'No se pudo descargar el reporte de estadísticas.');
        this.isGeneratingStatisticsPdf = false;
      }
    });
  }

  // Previsualizar emergencia individual
  previewEmergency(emergency: any) {
    console.log('Abriendo vista previa para emergencia:', emergency.emergencyId);
    
    // Navegar a la vista previa con parámetros
    this.router.navigate(['/pdf-preview'], {
      queryParams: {
        type: 'individual',
        emergencyId: emergency.emergencyId,
        period: 'last_year',
        emergencyType: 'all'
      }
    });
  }

  // Previsualizar reporte general
  previewGeneralReport() {
    const formValue = this.filtersForm.value;
    
    // Validar que si es período personalizado, las fechas estén presentes
    if (formValue.period === 'custom') {
      if (!formValue.startDate || !formValue.endDate) {
        this.notificationService.warning('Filtros', 'Por favor selecciona las fechas de inicio y fin para el período personalizado');
        return;
      }
    }

    console.log('Abriendo vista previa de reporte general');
    
    const queryParams: any = {
      type: 'general',
      period: formValue.period,
      emergencyType: formValue.emergencyType
    };

    // Agregar fechas si es período personalizado
    if (formValue.period === 'custom' && formValue.startDate && formValue.endDate) {
      queryParams.startDate = formValue.startDate instanceof Date 
        ? formValue.startDate.toISOString().split('T')[0] 
        : formValue.startDate;
      queryParams.endDate = formValue.endDate instanceof Date 
        ? formValue.endDate.toISOString().split('T')[0] 
        : formValue.endDate;
    }

    this.router.navigate(['/pdf-preview'], { queryParams });
  }

  // Previsualizar reporte de estadísticas
  previewStatisticsReport() {
    const formValue = this.filtersForm.value;
    
    // Validar que si es período personalizado, las fechas estén presentes
    if (formValue.period === 'custom') {
      if (!formValue.startDate || !formValue.endDate) {
        this.notificationService.warning('Filtros', 'Por favor selecciona las fechas de inicio y fin para el período personalizado');
        return;
      }
    }

    console.log('Abriendo vista previa de reporte de estadísticas');
    
    const queryParams: any = {
      type: 'statistics',
      period: formValue.period,
      emergencyType: formValue.emergencyType
    };

    // Agregar fechas si es período personalizado
    if (formValue.period === 'custom' && formValue.startDate && formValue.endDate) {
      queryParams.startDate = formValue.startDate instanceof Date 
        ? formValue.startDate.toISOString().split('T')[0] 
        : formValue.startDate;
      queryParams.endDate = formValue.endDate instanceof Date 
        ? formValue.endDate.toISOString().split('T')[0] 
        : formValue.endDate;
    }

    this.router.navigate(['/pdf-preview'], { queryParams });
  }

  /**
   * Descarga reporte individual de una emergencia específica
   */
  downloadIndividualReport(emergency: any) {
    // Validar que la emergencia tenga ID
    if (!emergency.emergencyId) {
      this.notificationService.error('Error de Reporte', 'No se puede generar reporte para esta emergencia.');
      return;
    }

    this.isGeneratingIndividualPdf = emergency.emergencyId;
    
    // Usar el ID específico para filtrar exactamente esta emergencia
    // Para emergencias individuales, usar un período que no requiera fechas
    const filters: ReportFilters = {
      period: 'last_year', // Usar un período amplio en lugar de custom
      emergencyType: 'all', // No filtrar por tipo cuando usamos ID específico
      emergencyId: emergency.emergencyId // Filtro específico por ID
    };

    console.log('=== DEBUG DESCARGA INDIVIDUAL ===');
    console.log('Emergencia ID:', emergency.emergencyId);
    console.log('Filtros enviados:', filters);
    console.log('Objeto emergency completo:', emergency);
    console.log('Token disponible:', localStorage.getItem('auth_token') ? 'SÍ' : 'NO');
    
    // Construir URL manualmente para debug
    const baseUrl = 'http://localhost:3000/reportes/emergencias';
    const params = new URLSearchParams();
    params.append('format', 'pdf');
    params.append('period', filters.period);
    params.append('emergencyType', filters.emergencyType);
    if (filters.emergencyId) {
      params.append('emergencyId', filters.emergencyId.toString());
    }
    
    const fullUrl = `${baseUrl}?${params.toString()}`;
    console.log('URL completa que se va a llamar:', fullUrl);
    console.log('Parámetros individuales:');
    params.forEach((value, key) => {
      console.log(`  ${key}: ${value} (tipo: ${typeof value})`);
    });

    this.pdfReportService.downloadEmergencyReport(filters).subscribe({
      next: (blob) => {
        console.log('✅ Descarga exitosa, tamaño del blob:', blob.size);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `reporte_emergencia_${emergency.emergencyId}_${new Date().toISOString().slice(0, 10)}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.isGeneratingIndividualPdf = null;
        this.notificationService.success('Reporte de Emergencia', `Reporte de emergencia #${emergency.emergencyId} descargado correctamente`);
      },
      error: (error) => {
        console.error('❌ Error al descargar reporte individual:', error);
        console.error('Status:', error.status);
        console.error('Error message:', error.message);
        console.error('Error details:', error.error);
        this.notificationService.error('Error de Descarga', `No se pudo descargar el reporte de la emergencia #${emergency.emergencyId}`);
        this.isGeneratingIndividualPdf = null;
      }
    });
  }

  async exportReport(format: 'pdf') {
    if (this.isGeneratingPdf) return;

    this.isGeneratingPdf = true;
    this.notificationService.info('Generando Reporte', 'Generando reporte PDF...');

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
          
          this.notificationService.success('Reporte PDF', 'Reporte PDF descargado exitosamente');
        },
        error: (error) => {
          console.error('Error al descargar reporte del backend:', error);
          this.notificationService.error('Error de Descarga', 'No se pudo descargar el reporte PDF');
          
          // Fallback al método legacy
          this.generateLocalPDFReport();
        },
        complete: () => {
          this.isGeneratingPdf = false;
        }
      });

    } catch (error) {
      console.error('Error en exportReport:', error);
      this.notificationService.error('Error de Descarga', 'No se pudo descargar el reporte PDF');
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
      
      this.notificationService.success('Reporte PDF', 'Reporte generado exitosamente');
    } catch (error) {
      console.error('Error generando reporte local:', error);
      this.notificationService.error('Error de Descarga', 'No se pudo descargar el reporte PDF');
    }
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
      this.notificationService.warning('Tiempo Objetivo', 'El tiempo objetivo debe estar entre 1 y 120 minutos');
      return;
    }

    this.isSavingTargetTime = true;

    this.statisticsService.updateTargetTime(this.newTargetTime, 'Tiempo objetivo actualizado desde reportes').subscribe({
      next: (response) => {
        this.isSavingTargetTime = false;
        this.isEditingTargetTime = false;
        this.timeAnalysisData.targetTime = this.newTargetTime;
        
        this.notificationService.success('Tiempo Objetivo', 'Tiempo objetivo actualizado exitosamente');

        // Recargar estadísticas para reflejar el cambio
        this.loadStatisticsFromBackend();
      },
      error: (error) => {
        console.error('Error al actualizar tiempo objetivo:', error);
        this.isSavingTargetTime = false;
        
        this.notificationService.error('Error de Actualización', 'No se pudo actualizar el tiempo objetivo');
      }
    });
  }

  /**
   * Método de debug para probar endpoints
   */
  async testDebugEndpoints() {
    try {
      const filters = {
        period: 'custom',
        emergencyType: 'all',
        emergencyId: 1,
        format: 'pdf'
      };
      
      console.log('🔍 Probando endpoint debug SIN AUTH con filtros:', filters);
      
      // Test sin autenticación
      const responseNoAuth = await this.http.get('http://localhost:3000/reportes/debug', {
        params: filters
      }).toPromise();
      
      console.log('✅ Debug response (sin auth):', responseNoAuth);
      
      // Test con autenticación
      console.log('🔍 Probando endpoint debug CON AUTH...');
      const responseWithAuth = await this.http.get('http://localhost:3000/reportes/debug-auth', {
        params: filters
      }).toPromise();
      
      console.log('✅ Debug response (con auth):', responseWithAuth);
      
      // Test del token
      const token = this.authService.getToken();
      console.log('🔑 Token actual:', token ? `Presente (${token.length} chars)` : 'Ausente');
      
      if (token) {
        console.log('🎯 Primeros 50 chars del token:', token.substring(0, 50) + '...');
      }

      // Test directo del endpoint de descarga individual
      console.log('🔍 Probando endpoint de descarga individual...');
      const downloadFilters: ReportFilters = {
        period: 'custom',
        emergencyType: 'all',
        emergencyId: 1
      };
      
      this.pdfReportService.downloadEmergencyReport(downloadFilters).subscribe({
        next: (blob) => {
          console.log('✅ Descarga individual exitosa, tamaño del blob:', blob.size);
          this.notificationService.success('Test de Descarga', 'Test de descarga individual exitoso');
        },
        error: (error) => {
          console.error('❌ Error en descarga individual:', error);
          this.notificationService.error('Error de Descarga', 'No se pudo descargar el reporte de la emergencia');
        }
      });
      
    } catch (error) {
      console.error('❌ Error en debug endpoints:', error);
    }
  }

} 