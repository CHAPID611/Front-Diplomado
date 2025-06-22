import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PdfReportService, ReportFilters } from '../../../core/services/pdf-report.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-pdf-preview',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatToolbarModule,
    MatTooltipModule
  ],
  templateUrl: './pdf-preview.component.html',
  styleUrls: ['./pdf-preview.component.css']
})
export class PdfPreviewComponent implements OnInit, OnDestroy {
  pdfUrl: SafeResourceUrl | null = null;
  isLoading = true;
  error: string | null = null;
  
  // Parámetros del reporte
  reportType: 'individual' | 'general' | 'statistics' = 'general';
  emergencyId: number | null = null;
  filters: ReportFilters | null = null;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pdfReportService: PdfReportService,
    private sanitizer: DomSanitizer,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Obtener parámetros de la ruta
    const routeSubscription = this.route.queryParams.subscribe(params => {
      this.reportType = params['type'] || 'general';
      this.emergencyId = params['emergencyId'] ? Number(params['emergencyId']) : null;
      
      // Reconstruir filtros desde los parámetros
      this.filters = {
        period: params['period'] || 'last_month',
        emergencyType: params['emergencyType'] || 'all',
        startDate: params['startDate'],
        endDate: params['endDate'],
        emergencyId: this.emergencyId || undefined
      };

      console.log('Vista previa PDF - Parámetros recibidos:', {
        reportType: this.reportType,
        emergencyId: this.emergencyId,
        filters: this.filters
      });

      this.loadPdfPreview();
    });

    this.subscriptions.push(routeSubscription);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    
    // Limpiar URL del blob al destruir el componente
    if (this.pdfUrl) {
      const url = (this.pdfUrl as any).changingThisBreaksApplicationSecurity;
      if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    }
  }

  private loadPdfPreview(): void {
    if (!this.filters) {
      this.error = 'No se pudieron cargar los filtros del reporte';
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.error = null;

    let reportObservable;

    // Seleccionar el método correcto según el tipo de reporte
    switch (this.reportType) {
      case 'individual':
        reportObservable = this.pdfReportService.downloadEmergencyReport(this.filters);
        break;
      case 'statistics':
        reportObservable = this.pdfReportService.downloadStatisticsReport(this.filters);
        break;
      case 'general':
      default:
        reportObservable = this.pdfReportService.downloadEmergencyReport(this.filters);
        break;
    }

    const pdfSubscription = reportObservable.subscribe({
      next: (blob) => {
        console.log('PDF cargado para vista previa, tamaño:', blob.size);
        
        // Crear URL del blob para el iframe
        const url = URL.createObjectURL(blob);
        this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar PDF para vista previa:', error);
        this.error = 'Error al cargar la vista previa del PDF';
        this.isLoading = false;
        this.snackBar.open('Error al cargar la vista previa del PDF', 'Cerrar', { duration: 5000 });
      }
    });

    this.subscriptions.push(pdfSubscription);
  }

  downloadPdf(): void {
    if (!this.filters) {
      this.snackBar.open('Error: No se pueden obtener los filtros para la descarga', 'Cerrar', { duration: 3000 });
      return;
    }

    console.log('Descargando PDF desde vista previa...');

    let reportObservable;
    let filename: string;

    // Seleccionar el método y nombre de archivo correcto
    switch (this.reportType) {
      case 'individual':
        reportObservable = this.pdfReportService.downloadEmergencyReport(this.filters);
        filename = `reporte_emergencia_${this.emergencyId}_${new Date().toISOString().slice(0, 10)}.pdf`;
        break;
      case 'statistics':
        reportObservable = this.pdfReportService.downloadStatisticsReport(this.filters);
        filename = `estadisticas_emergencias_${new Date().toISOString().slice(0, 10)}.pdf`;
        break;
      case 'general':
      default:
        reportObservable = this.pdfReportService.downloadEmergencyReport(this.filters);
        filename = `reporte_emergencias_${new Date().toISOString().slice(0, 10)}.pdf`;
        break;
    }

    const downloadSubscription = reportObservable.subscribe({
      next: (blob) => {
        // Crear y activar descarga
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(url);
        
        this.snackBar.open('PDF descargado correctamente', 'Cerrar', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error al descargar PDF:', error);
        this.snackBar.open('Error al descargar el PDF', 'Cerrar', { duration: 3000 });
      }
    });

    this.subscriptions.push(downloadSubscription);
  }

  goBack(): void {
    // Navegar de vuelta a la vista de reportes
    this.router.navigate(['/reportes']);
  }

  getReportTitle(): string {
    switch (this.reportType) {
      case 'individual':
        return `Vista Previa - Reporte Emergencia #${this.emergencyId}`;
      case 'statistics':
        return 'Vista Previa - Reporte de Estadísticas';
      case 'general':
      default:
        return 'Vista Previa - Reporte General de Emergencias';
    }
  }

  retryLoad(): void {
    this.loadPdfPreview();
  }
}
