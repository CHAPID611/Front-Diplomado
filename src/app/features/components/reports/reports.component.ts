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
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { 
  PdfReportService, 
  ReportData, 
  EmergencyTypeStats, 
  MonthlyStats, 
  ReportFilters 
} from '../../../core/services/pdf-report.service';
import { EmergencyService } from '../../../core/services/emergency-report.service';
import { EmergencyType } from '../../../core/interfaces/emergency.interface';

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
    ReactiveFormsModule
  ],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit {
  filtersForm: FormGroup;
  displayedColumns: string[] = ['month', 'emergencies', 'resolved', 'avgResponseTime', 'efficiency'];
  isGeneratingPdf = false;
  emergencyTypes: EmergencyType[] = [];
  emergencyTypeLabels: { [key: string]: string } = {};

  // Datos base (simulan una base de datos completa)
  private baseData = {
    emergencies: [
      // Enero 2024
      { date: '2024-01-03', type: 'incendio', responseTime: 7.2, resolved: true, location: 'Centro Comercial Plaza Mayor', severity: 'media' },
      { date: '2024-01-05', type: 'rescate', responseTime: 9.1, resolved: true, location: 'Autopista Norte Km 45', severity: 'alta' },
      { date: '2024-01-08', type: 'emergencia_medica', responseTime: 6.8, resolved: true, location: 'Residencial Los Pinos', severity: 'baja' },
      { date: '2024-01-12', type: 'materiales_peligrosos', responseTime: 12.3, resolved: true, location: 'Zona Industrial El Progreso', severity: 'alta' },
      { date: '2024-01-15', type: 'incendio', responseTime: 8.5, resolved: true, location: 'Barrio La Esperanza', severity: 'media' },
      { date: '2024-01-18', type: 'rescate', responseTime: 11.2, resolved: true, location: 'Puente Río Verde', severity: 'alta' },
      { date: '2024-01-22', type: 'inundacion', responseTime: 15.2, resolved: true, location: 'Sector Valle Bajo', severity: 'media' },
      { date: '2024-01-25', type: 'emergencia_medica', responseTime: 5.9, resolved: true, location: 'Universidad Central', severity: 'baja' },
      { date: '2024-01-28', type: 'incendio', responseTime: 7.8, resolved: true, location: 'Mercado Central', severity: 'alta' },
      { date: '2024-01-30', type: 'rescate', responseTime: 10.5, resolved: false, location: 'Cerro Las Águilas', severity: 'alta' },

      // Febrero 2024
      { date: '2024-02-02', type: 'incendio', responseTime: 6.9, resolved: true, location: 'Fábrica Textil San José', severity: 'alta' },
      { date: '2024-02-05', type: 'emergencia_medica', responseTime: 7.1, resolved: true, location: 'Colegio Santa María', severity: 'media' },
      { date: '2024-02-08', type: 'materiales_peligrosos', responseTime: 14.5, resolved: true, location: 'Planta Química Norte', severity: 'alta' },
      { date: '2024-02-11', type: 'rescate', responseTime: 8.7, resolved: true, location: 'Túnel La Montaña', severity: 'media' },
      { date: '2024-02-14', type: 'incendio', responseTime: 9.2, resolved: true, location: 'Hotel Plaza Central', severity: 'media' },
      { date: '2024-02-17', type: 'inundacion', responseTime: 16.8, resolved: true, location: 'Barrio El Río', severity: 'media' },
      { date: '2024-02-20', type: 'emergencia_medica', responseTime: 6.3, resolved: true, location: 'Terminal de Buses', severity: 'baja' },
      { date: '2024-02-23', type: 'rescate', responseTime: 12.1, resolved: true, location: 'Mina El Dorado', severity: 'alta' },
      { date: '2024-02-26', type: 'incendio', responseTime: 8.1, resolved: true, location: 'Bosque Municipal', severity: 'media' },
      { date: '2024-02-28', type: 'materiales_peligrosos', responseTime: 13.7, resolved: false, location: 'Depósito Combustibles', severity: 'alta' },

      // Marzo 2024
      { date: '2024-03-02', type: 'incendio', responseTime: 7.5, resolved: true, location: 'Almacén La Economía', severity: 'media' },
      { date: '2024-03-05', type: 'rescate', responseTime: 10.2, resolved: true, location: 'Cantera El Peñón', severity: 'alta' },
      { date: '2024-03-08', type: 'emergencia_medica', responseTime: 5.8, resolved: true, location: 'Parque Central', severity: 'baja' },
      { date: '2024-03-11', type: 'inundacion', responseTime: 18.3, resolved: true, location: 'Urbanización Vista Hermosa', severity: 'alta' },
      { date: '2024-03-14', type: 'incendio', responseTime: 8.8, resolved: true, location: 'Taller Mecánico El Rayo', severity: 'media' },
      { date: '2024-03-17', type: 'materiales_peligrosos', responseTime: 11.9, resolved: true, location: 'Laboratorio Farmacéutico', severity: 'media' },
      { date: '2024-03-20', type: 'rescate', responseTime: 9.6, resolved: true, location: 'Edificio Torre Norte', severity: 'alta' },
      { date: '2024-03-23', type: 'emergencia_medica', responseTime: 6.7, resolved: true, location: 'Centro Deportivo Municipal', severity: 'baja' },
      { date: '2024-03-26', type: 'incendio', responseTime: 7.3, resolved: true, location: 'Gasolinera El Trebol', severity: 'alta' },
      { date: '2024-03-29', type: 'rescate', responseTime: 11.4, resolved: true, location: 'Río Cristal', severity: 'media' },

      // Abril 2024
      { date: '2024-04-01', type: 'emergencia_medica', responseTime: 6.1, resolved: true, location: 'Biblioteca Municipal', severity: 'baja' },
      { date: '2024-04-04', type: 'incendio', responseTime: 8.4, resolved: true, location: 'Restaurante El Fogón', severity: 'media' },
      { date: '2024-04-07', type: 'rescate', responseTime: 9.8, resolved: true, location: 'Vía al Aeropuerto', severity: 'media' },
      { date: '2024-04-10', type: 'materiales_peligrosos', responseTime: 13.2, resolved: true, location: 'Refinería Petroquímica', severity: 'alta' },
      { date: '2024-04-13', type: 'inundacion', responseTime: 17.1, resolved: true, location: 'Conjunto Residencial El Sol', severity: 'media' },
      { date: '2024-04-16', type: 'incendio', responseTime: 7.7, resolved: true, location: 'Supermercado Gran Plaza', severity: 'media' },
      { date: '2024-04-19', type: 'emergencia_medica', responseTime: 5.5, resolved: true, location: 'Estadio Municipal', severity: 'baja' },
      { date: '2024-04-22', type: 'rescate', responseTime: 10.7, resolved: true, location: 'Quebrada Honda', severity: 'alta' },
      { date: '2024-04-25', type: 'incendio', responseTime: 8.9, resolved: false, location: 'Depósito Maderas El Pino', severity: 'alta' },
      { date: '2024-04-28', type: 'materiales_peligrosos', responseTime: 12.6, resolved: true, location: 'Centro de Acopio Residuos', severity: 'media' },

      // Mayo 2024
      { date: '2024-05-01', type: 'incendio', responseTime: 6.8, resolved: true, location: 'Casa Colonial Centro Histórico', severity: 'alta' },
      { date: '2024-05-04', type: 'emergencia_medica', responseTime: 7.2, resolved: true, location: 'Clínica San Rafael', severity: 'media' },
      { date: '2024-05-07', type: 'rescate', responseTime: 11.1, resolved: true, location: 'Construcción Torre Empresarial', severity: 'alta' },
      { date: '2024-05-10', type: 'inundacion', responseTime: 19.5, resolved: true, location: 'Barrio Popular', severity: 'alta' },
      { date: '2024-05-13', type: 'incendio', responseTime: 8.2, resolved: true, location: 'Panadería La Espiga', severity: 'baja' },
      { date: '2024-05-16', type: 'materiales_peligrosos', responseTime: 14.8, resolved: true, location: 'Hospital General', severity: 'media' },
      { date: '2024-05-19', type: 'emergencia_medica', responseTime: 6.9, resolved: true, location: 'Centro Comercial Norte', severity: 'baja' },
      { date: '2024-05-22', type: 'rescate', responseTime: 9.3, resolved: true, location: 'Parque Nacional El Verde', severity: 'media' },
      { date: '2024-05-25', type: 'incendio', responseTime: 7.6, resolved: true, location: 'Iglesia San Francisco', severity: 'media' },
      { date: '2024-05-28', type: 'emergencia_medica', responseTime: 5.7, resolved: true, location: 'Escuela Primaria El Futuro', severity: 'baja' },

      // Junio 2024
      { date: '2024-06-02', type: 'rescate', responseTime: 10.8, resolved: true, location: 'Montaña Azul', severity: 'alta' },
      { date: '2024-06-05', type: 'incendio', responseTime: 8.1, resolved: true, location: 'Ferretería El Martillo', severity: 'media' },
      { date: '2024-06-08', type: 'emergencia_medica', responseTime: 6.4, resolved: true, location: 'Plaza de Mercado', severity: 'baja' },
      { date: '2024-06-11', type: 'materiales_peligrosos', responseTime: 13.5, resolved: true, location: 'Estación de Servicio Sur', severity: 'media' },
      { date: '2024-06-14', type: 'inundacion', responseTime: 16.2, resolved: true, location: 'Sector La Colina', severity: 'media' },
      { date: '2024-06-17', type: 'incendio', responseTime: 7.9, resolved: true, location: 'Oficinas Gubernamentales', severity: 'media' },
      { date: '2024-06-20', type: 'rescate', responseTime: 9.7, resolved: true, location: 'Puente Colgante', severity: 'alta' },
      { date: '2024-06-23', type: 'emergencia_medica', responseTime: 6.2, resolved: true, location: 'Centro Cultural', severity: 'baja' },
      { date: '2024-06-26', type: 'incendio', responseTime: 8.6, resolved: false, location: 'Almacén de Pinturas', severity: 'alta' },
      { date: '2024-06-29', type: 'materiales_peligrosos', responseTime: 12.4, resolved: true, location: 'Planta Tratamiento Aguas', severity: 'media' },

      // Julio 2024
      { date: '2024-07-02', type: 'incendio', responseTime: 7.1, resolved: true, location: 'Centro de Convenciones', severity: 'media' },
      { date: '2024-07-05', type: 'emergencia_medica', responseTime: 5.9, resolved: true, location: 'Gimnasio Municipal', severity: 'baja' },
      { date: '2024-07-08', type: 'rescate', responseTime: 11.3, resolved: true, location: 'Carretera a la Costa', severity: 'alta' },
      { date: '2024-07-11', type: 'inundacion', responseTime: 18.7, resolved: true, location: 'Distrito Financiero', severity: 'alta' },
      { date: '2024-07-14', type: 'incendio', responseTime: 8.3, resolved: true, location: 'Laboratorio Universidad', severity: 'media' },
      { date: '2024-07-17', type: 'materiales_peligrosos', responseTime: 14.1, resolved: true, location: 'Bodega Productos Químicos', severity: 'alta' },
      { date: '2024-07-20', type: 'emergencia_medica', responseTime: 6.8, resolved: true, location: 'Aeropuerto Internacional', severity: 'media' },
      { date: '2024-07-23', type: 'rescate', responseTime: 10.1, resolved: true, location: 'Reserva Natural El Bosque', severity: 'media' },
      { date: '2024-07-26', type: 'incendio', responseTime: 7.4, resolved: true, location: 'Teatro Municipal', severity: 'baja' },
      { date: '2024-07-29', type: 'emergencia_medica', responseTime: 6.5, resolved: true, location: 'Complejo Deportivo', severity: 'baja' },

      // Agosto 2024
      { date: '2024-08-01', type: 'rescate', responseTime: 9.9, resolved: true, location: 'Torre de Telecomunicaciones', severity: 'alta' },
      { date: '2024-08-04', type: 'incendio', responseTime: 8.7, resolved: true, location: 'Zona Industrial Norte', severity: 'alta' },
      { date: '2024-08-07', type: 'emergencia_medica', responseTime: 6.1, resolved: true, location: 'Centro de Rehabilitación', severity: 'media' },
      { date: '2024-08-10', type: 'materiales_peligrosos', responseTime: 13.8, resolved: true, location: 'Puerto Fluvial', severity: 'media' },
      { date: '2024-08-13', type: 'inundacion', responseTime: 17.4, resolved: true, location: 'Urbanización El Paraíso', severity: 'media' },
      { date: '2024-08-16', type: 'incendio', responseTime: 7.8, resolved: true, location: 'Carpintería El Cedro', severity: 'media' },
      { date: '2024-08-19', type: 'rescate', responseTime: 10.6, resolved: true, location: 'Acantilado Los Halcones', severity: 'alta' },
      { date: '2024-08-22', type: 'emergencia_medica', responseTime: 5.8, resolved: true, location: 'Centro Geriátrico', severity: 'baja' },
      { date: '2024-08-25', type: 'incendio', responseTime: 8.9, resolved: false, location: 'Fábrica de Muebles', severity: 'alta' },
      { date: '2024-08-28', type: 'materiales_peligrosos', responseTime: 12.7, resolved: true, location: 'Centro de Distribución Gas', severity: 'alta' },

      // Septiembre 2024
      { date: '2024-09-02', type: 'incendio', responseTime: 7.2, resolved: true, location: 'Concesionario de Autos', severity: 'media' },
      { date: '2024-09-05', type: 'emergencia_medica', responseTime: 6.7, resolved: true, location: 'Hogar de Ancianos', severity: 'media' },
      { date: '2024-09-08', type: 'rescate', responseTime: 11.8, resolved: true, location: 'Teleférico Cerro Azul', severity: 'alta' },
      { date: '2024-09-11', type: 'inundacion', responseTime: 19.1, resolved: true, location: 'Barrio Ribereño', severity: 'alta' },
      { date: '2024-09-14', type: 'incendio', responseTime: 8.5, resolved: true, location: 'Imprenta El Papel', severity: 'media' },
      { date: '2024-09-17', type: 'materiales_peligrosos', responseTime: 15.2, resolved: true, location: 'Centro Médico Especializado', severity: 'media' },
      { date: '2024-09-20', type: 'emergencia_medica', responseTime: 5.4, resolved: true, location: 'Centro Juvenil', severity: 'baja' },
      { date: '2024-09-23', type: 'rescate', responseTime: 9.4, resolved: true, location: 'Cueva Los Murciélagos', severity: 'media' },
      { date: '2024-09-26', type: 'incendio', responseTime: 7.6, resolved: true, location: 'Sala de Cine', severity: 'baja' },
      { date: '2024-09-29', type: 'emergencia_medica', responseTime: 6.9, resolved: true, location: 'Instituto Tecnológico', severity: 'baja' },

      // Octubre 2024
      { date: '2024-10-02', type: 'rescate', responseTime: 10.3, resolved: true, location: 'Edificio en Construcción', severity: 'alta' },
      { date: '2024-10-05', type: 'incendio', responseTime: 8.1, resolved: true, location: 'Droguería Central', severity: 'media' },
      { date: '2024-10-08', type: 'emergencia_medica', responseTime: 6.3, resolved: true, location: 'Refugio de Animales', severity: 'baja' },
      { date: '2024-10-11', type: 'materiales_peligrosos', responseTime: 14.6, resolved: true, location: 'Planta de Reciclaje', severity: 'media' },
      { date: '2024-10-14', type: 'inundacion', responseTime: 16.8, resolved: true, location: 'Sector Industrial Sur', severity: 'media' },
      { date: '2024-10-17', type: 'incendio', responseTime: 7.9, resolved: true, location: 'Residencia Estudiantil', severity: 'media' },
      { date: '2024-10-20', type: 'rescate', responseTime: 11.2, resolved: true, location: 'Parque de Diversiones', severity: 'alta' },
      { date: '2024-10-23', type: 'emergencia_medica', responseTime: 5.7, resolved: true, location: 'Casa de la Cultura', severity: 'baja' },
      { date: '2024-10-26', type: 'incendio', responseTime: 8.4, resolved: true, location: 'Boutique El Estilo', severity: 'baja' },
      { date: '2024-10-29', type: 'materiales_peligrosos', responseTime: 13.1, resolved: false, location: 'Terminal de Carga', severity: 'alta' },

      // Noviembre 2024
      { date: '2024-11-01', type: 'incendio', responseTime: 7.8, resolved: true, location: 'Museo de Arte', severity: 'alta' },
      { date: '2024-11-04', type: 'emergencia_medica', responseTime: 6.2, resolved: true, location: 'Centro de Investigación', severity: 'media' },
      { date: '2024-11-07', type: 'rescate', responseTime: 9.7, resolved: true, location: 'Laguna El Espejo', severity: 'media' },
      { date: '2024-11-10', type: 'inundacion', responseTime: 18.3, resolved: true, location: 'Zona Comercial Este', severity: 'alta' },
      { date: '2024-11-13', type: 'incendio', responseTime: 8.6, resolved: true, location: 'Agencia de Viajes', severity: 'baja' },
      { date: '2024-11-16', type: 'materiales_peligrosos', responseTime: 12.9, resolved: true, location: 'Clínica Veterinaria', severity: 'media' },
      { date: '2024-11-19', type: 'emergencia_medica', responseTime: 5.9, resolved: true, location: 'Jardín Botánico', severity: 'baja' },
      { date: '2024-11-22', type: 'rescate', responseTime: 10.5, resolved: true, location: 'Granja Experimental', severity: 'media' },
      { date: '2024-11-25', type: 'incendio', responseTime: 7.3, resolved: true, location: 'Pizzería La Italiana', severity: 'baja' },
      { date: '2024-11-28', type: 'emergencia_medica', responseTime: 6.6, resolved: true, location: 'Observatorio Astronómico', severity: 'baja' },

      // Diciembre 2024
      { date: '2024-12-01', type: 'rescate', responseTime: 11.4, resolved: true, location: 'Mirador Cerro Alto', severity: 'alta' },
      { date: '2024-12-04', type: 'incendio', responseTime: 8.2, resolved: true, location: 'Almacén de Juguetes', severity: 'media' },
      { date: '2024-12-07', type: 'emergencia_medica', responseTime: 6.1, resolved: true, location: 'Fundación Benéfica', severity: 'baja' },
      { date: '2024-12-10', type: 'materiales_peligrosos', responseTime: 13.7, resolved: true, location: 'Lavandería Industrial', severity: 'media' },
      { date: '2024-12-13', type: 'inundacion', responseTime: 17.9, resolved: true, location: 'Complejo Habitacional', severity: 'media' },
      { date: '2024-12-16', type: 'incendio', responseTime: 7.5, resolved: true, location: 'Cafetería Universitaria', severity: 'baja' },
      { date: '2024-12-19', type: 'rescate', responseTime: 9.8, resolved: true, location: 'Sendero Ecológico', severity: 'media' },
      { date: '2024-12-22', type: 'emergencia_medica', responseTime: 5.6, resolved: true, location: 'Centro de Convenciones', severity: 'baja' },
      { date: '2024-12-25', type: 'incendio', responseTime: 8.7, resolved: true, location: 'Restaurant El Parador', severity: 'media' },
      { date: '2024-12-28', type: 'materiales_peligrosos', responseTime: 14.3, resolved: true, location: 'Estación de Bombeo', severity: 'media' }
    ]
  };

  // Datos filtrados que se muestran en la UI
  reportData: ReportData = {
    period: 'Últimos 30 días',
    totalEmergencies: 120,
    responseTime: 9.2,
    successRate: 93,
    mostCommonType: 'Incendio estructural'
  };

  emergencyTypesStats: EmergencyTypeStats[] = [
    { type: 'incendio', count: 40, percentage: 33, avgResponseTime: 7.8 },
    { type: 'rescate', count: 30, percentage: 25, avgResponseTime: 10.2 },
    { type: 'emergencia_medica', count: 30, percentage: 25, avgResponseTime: 6.2 },
    { type: 'materiales_peligrosos', count: 12, percentage: 10, avgResponseTime: 13.4 },
    { type: 'inundacion', count: 8, percentage: 7, avgResponseTime: 17.3 }
  ];

  monthlyStats: MonthlyStats[] = [
    { month: 'Enero 2024', emergencies: 10, resolved: 9, avgResponseTime: 9.2 },
    { month: 'Febrero 2024', emergencies: 10, resolved: 9, avgResponseTime: 10.1 },
    { month: 'Marzo 2024', emergencies: 10, resolved: 10, avgResponseTime: 9.8 },
    { month: 'Abril 2024', emergencies: 10, resolved: 9, avgResponseTime: 9.4 },
    { month: 'Mayo 2024', emergencies: 10, resolved: 10, avgResponseTime: 8.9 },
    { month: 'Junio 2024', emergencies: 10, resolved: 9, avgResponseTime: 9.6 },
    { month: 'Julio 2024', emergencies: 10, resolved: 10, avgResponseTime: 9.1 },
    { month: 'Agosto 2024', emergencies: 10, resolved: 9, avgResponseTime: 9.3 },
    { month: 'Septiembre 2024', emergencies: 10, resolved: 10, avgResponseTime: 8.8 },
    { month: 'Octubre 2024', emergencies: 10, resolved: 9, avgResponseTime: 9.7 },
    { month: 'Noviembre 2024', emergencies: 10, resolved: 10, avgResponseTime: 8.6 },
    { month: 'Diciembre 2024', emergencies: 10, resolved: 10, avgResponseTime: 9.0 }
  ];

  constructor(
    private fb: FormBuilder,
    private pdfReportService: PdfReportService,
    private emergencyService: EmergencyService,
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
      period: ['30days'],
      startDate: [''],
      endDate: [''],
      emergencyType: ['all']
    });

    // Cargar tipos de emergencia del backend
    this.loadEmergencyTypes();

    // Observar cambios en los filtros para actualizar automáticamente
    this.filtersForm.valueChanges.subscribe(() => {
      this.loadReportData();
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

  loadReportData() {
    const filters = this.filtersForm.value;
    
    // Simular filtrado de datos
    let filteredData = this.filterDataByPeriod(this.baseData.emergencies, filters.period, filters.startDate, filters.endDate);
    
    if (filters.emergencyType !== 'all') {
      filteredData = filteredData.filter(emergency => emergency.type === filters.emergencyType);
    }

    // Actualizar estadísticas basadas en datos filtrados
    this.updateStatistics(filteredData, filters);
  }

  private filterDataByPeriod(data: any[], period: string, startDate?: string, endDate?: string): any[] {
    const now = new Date();
    let filterDate: Date;

    switch (period) {
      case '7days':
        filterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        filterDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '3months':
        filterDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        filterDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        if (startDate && endDate) {
          return data.filter(item => {
            const itemDate = new Date(item.date);
            return itemDate >= new Date(startDate) && itemDate <= new Date(endDate);
          });
        }
        return data;
      default:
        return data;
    }

    return data.filter(item => new Date(item.date) >= filterDate);
  }

  private updateStatistics(filteredData: any[], filters: any) {
    // Actualizar reportData
    const totalEmergencies = filteredData.length;
    const resolvedEmergencies = filteredData.filter(e => e.resolved).length;
    const avgResponseTime = filteredData.reduce((sum, e) => sum + e.responseTime, 0) / totalEmergencies || 0;
    const successRate = totalEmergencies > 0 ? (resolvedEmergencies / totalEmergencies) * 100 : 0;

    // Encontrar tipo más común
    const typeCounts = filteredData.reduce((acc, e) => {
      acc[e.type] = (acc[e.type] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
    
    const mostCommonType = Object.keys(typeCounts).reduce((a, b) => 
      typeCounts[a] > typeCounts[b] ? a : b, 'incendio'
    );

    this.reportData = {
      period: this.getPeriodLabel(filters.period),
      totalEmergencies,
      responseTime: Math.round(avgResponseTime * 10) / 10,
      successRate: Math.round(successRate),
      mostCommonType: this.getEmergencyTypeLabel(mostCommonType)
    };

    // Actualizar estadísticas por tipo
    this.updateEmergencyTypesStats(filteredData);
    
    // Actualizar estadísticas mensuales (simplificado para la demo)
    this.updateMonthlyStats(filteredData);
  }

  private updateEmergencyTypesStats(filteredData: any[]) {
    const typeGroups = filteredData.reduce((acc, e) => {
      if (!acc[e.type]) {
        acc[e.type] = [];
      }
      acc[e.type].push(e);
      return acc;
    }, {} as { [key: string]: any[] });

    this.emergencyTypesStats = Object.keys(typeGroups).map(type => {
      const typeData = typeGroups[type];
      const count = typeData.length;
      const percentage = Math.round((count / filteredData.length) * 100);
      const avgResponseTime = typeData.reduce((sum: number, e: any) => sum + e.responseTime, 0) / count;

      return {
        type,
        count,
        percentage,
        avgResponseTime: Math.round(avgResponseTime * 10) / 10
      };
    }).sort((a, b) => b.count - a.count);
  }

  private updateMonthlyStats(filteredData: any[]) {
    // Para simplicidad, mantenemos los datos mock pero en un entorno real
    // aquí se agruparían los datos por mes
    const monthGroups = filteredData.reduce((acc, e) => {
      const month = new Date(e.date).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
      if (!acc[month]) {
        acc[month] = [];
      }
      acc[month].push(e);
      return acc;
    }, {} as { [key: string]: any[] });

    this.monthlyStats = Object.keys(monthGroups).map(month => {
      const monthData = monthGroups[month];
      const emergencies = monthData.length;
      const resolved = monthData.filter((e: any) => e.resolved).length;
      const avgResponseTime = monthData.reduce((sum: number, e: any) => sum + e.responseTime, 0) / emergencies;

      return {
        month,
        emergencies,
        resolved,
        avgResponseTime: Math.round(avgResponseTime * 10) / 10
      };
    });
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
    this.snackBar.open('Generando reporte PDF...', '', { duration: 2000 });

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

      this.snackBar.open('Reporte PDF generado exitosamente', 'Cerrar', { 
        duration: 3000,
        panelClass: ['success-snackbar']
      });
    } catch (error) {
      console.error('Error generando PDF:', error);
      this.snackBar.open('Error al generar el reporte PDF', 'Cerrar', { 
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.isGeneratingPdf = false;
    }
  }

  printReport() {
    window.print();
  }
} 