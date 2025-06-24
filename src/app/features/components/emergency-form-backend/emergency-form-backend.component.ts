import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { NotificationService } from '../../../shared/services/notification.service';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatStepperModule } from '@angular/material/stepper';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { Router } from '@angular/router';

import { EmergencyService } from '../../../core/services/emergency-report.service';
import { EmergencyReportLegacyService } from '../../../core/services/emergency-report-legacy.service';
import { EmergencyDataService } from '../../../core/services/emergency-data.service';
import { PersonalDisponible } from '../../../core/interfaces/personal.interface';
import { Emergency, EmergencyType, EmergencyFile, TipoEmergencia } from '../../../core/interfaces/emergency.interface';
import { AuthService } from '../../../core/services/auth.service';
import { VehiclesService, Vehicle } from '../../../core/services/vehicles.service';
import { FormPersistenceService, FormPersistenceConfig } from '../../../core/services/form-persistence.service';

interface Formulario {
  tipo: string;
  id: number;
  formData?: any;
  selectedFiles?: File[];
  esTurnoSinConvenio?: boolean;
}

@Component({
  selector: 'app-emergency-form-backend',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,

    MatCheckboxModule,
    MatIconModule,
    MatTabsModule,
    MatStepperModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatDividerModule
  ],
  templateUrl: './emergency-form-backend.component.html',
  styleUrls: ['./emergency-form-backend.component.css']
})
export class EmergencyFormBackendComponent implements OnInit, OnDestroy {
  @Input() set parentForm(form: FormGroup) {
    if (form) {
      this._emergencyForm = form;
    }
  }
  get parentForm(): FormGroup {
    return this._emergencyForm;
  }
  private _emergencyForm!: FormGroup;

  @Output() tipoChange = new EventEmitter<string>();

  emergencyForm!: FormGroup;
  emergencyTypes: EmergencyType[] = [];
  tiposEmergencia: TipoEmergencia[] = [];
  personalDisponible: PersonalDisponible[] = [];
  availableVehicles: Vehicle[] = [];
  selectedFiles: File[] = [];
  filePreviewUrls: Map<File, string> = new Map();
  isSubmitting = false;
  isUploading = false;
  showDebugInfo = false;
  submitSuccess = false;
  submitError: string | null = null;
  esTurnoSinConvenio = false;

  // Formularios de emergencia (pestañas)
  formularios: Formulario[] = [{ 
    tipo: 'Emergencia Principal', 
    id: 1,
    formData: null,
    selectedFiles: [],
    esTurnoSinConvenio: false
  }];
  selectedIndex = 0;

  // Variables para sistema de pestañas con estado independiente
  private autoSaveTimeout: any;
  private formSubscription: any; // Para limpiar subscripciones anteriores
  
  // Configuración de persistencia mejorada
  private persistenceConfig: FormPersistenceConfig = {
    key: 'emergency_form_draft',
    autoSave: true,
    autoSaveDelay: 3000,
    storageType: 'localStorage', // Cambiado a localStorage para persistir después de recargar
    excludeFields: [] // Las emergencias no tienen datos sensibles críticos
  };
  
  // Nueva configuración para persistir la estructura de formularios múltiples
  private tabsStructureConfig: FormPersistenceConfig = {
    key: 'emergency_forms_structure',
    autoSave: false, // Se guardará manualmente
    storageType: 'localStorage',
    excludeFields: []
  };
  
  // Personal ocupado globalmente como Unidades de Respuesta
  // Las validaciones de ocupación han sido removidas

  constructor(
    private fb: FormBuilder,
    private emergencyService: EmergencyService,
    private emergencyReportLegacyService: EmergencyReportLegacyService,
    private emergencyDataService: EmergencyDataService,
    private authService: AuthService,
    private vehiclesService: VehiclesService,
    private formPersistenceService: FormPersistenceService,
    private notificationService: NotificationService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.createForm();
    this.loadEmergencyTypes();
    this.loadFormData();
  }

  ngOnInit(): void {
    this.loadEmergencyTypes();
    this.loadFormData();
    this.loadAvailableVehicles();
    this.loadAvailablePersonnel();
    
    // REMOVIDO: La persistencia se configura ahora en createForm()
    // this.setupFormPersistence();
    
    // Esperar a que todo esté cargado antes de restaurar datos
    setTimeout(() => {
      // NUEVO: Primero restaurar la estructura de formularios múltiples
      const hasMultipleForms = this.restoreFormulariesStructure();
      
      // Solo restaurar datos individuales si no se restauró una estructura múltiple
      if (!hasMultipleForms) {
        this.restoreFormDataFromPersistence();
      }
    }, 500);
    
    // Agregar listener para cambios en la selección de vehículos después de que se cree el formulario
    setTimeout(() => {
      if (this.emergencyForm.get('vehiculo')) {
        this.emergencyForm.get('vehiculo')?.valueChanges.subscribe(selectedIds => {
          if (selectedIds && selectedIds.length > 0) {
            // Evitar recursión infinita cuando se actualiza programáticamente
            setTimeout(() => this.onVehicleSelectionChange(selectedIds), 0);
          }
        });
      }
    }, 100);
  }

  loadAvailableVehicles(): void {
    this.vehiclesService.getVehicles().subscribe({
      next: (vehicles) => {
        this.availableVehicles = vehicles.filter(v => v.status === 'disponible');
      },
      error: (error) => {
        this.notificationService.error('Error de Carga', 'No se pudieron cargar los vehículos disponibles.');
      }
    });
  }

  loadAvailablePersonnel(): void {
    this.emergencyDataService.getPersonalDisponible().subscribe({
      next: (personnel) => {
        this.personalDisponible = personnel;
      },
      error: (error) => {
        this.notificationService.error('Error de Carga', 'No se pudo cargar el personal disponible.');
      }
    });
  }

  createForm(): void {
    this.emergencyForm = this.fb.group({
      fechaReporte: [new Date(), Validators.required],
      quienInforma: ['', Validators.required],
      tipoEmergencia: ['', Validators.required],
      ubicacion: ['', Validators.required],
      vehiculo: ['', Validators.required],
      numeroTurno: [''],
      sinConvenio: [false],
      
      // Cronología
      horaReporte: ['', Validators.required],
      horaReporteDescripcion: [''],
      horaSalida: ['', Validators.required],
      horaSalidaDescripcion: [''],
      horaLlegadaEscena: [''],
      horaLlegadaEscenaDescripcion: [''],
      horaLlegadaHospital: [''],
      horaLlegadaHospitalDescripcion: [''],
      horaRegresoEstacion: ['', Validators.required],
      horaRegresoEstacionDescripcion: [''],
      
      // Personal
      unidades: ['', Validators.required],
      guardia: ['', Validators.required],
      
      // Eventos adicionales (FormArrays)
      eventosAdicionalesSalida: this.fb.array([]),
      eventosAdicionalesLlegadaEscena: this.fb.array([]),
      eventosAdicionalesLlegadaHospital: this.fb.array([])
    });

    // MEJORADO: Configurar persistencia automática para cada nuevo formulario
    this.setupFormPersistence();
  }

  loadEmergencyTypes(): void {
    this.emergencyService.getEmergencyTypes().subscribe({
      next: (types) => {
        this.emergencyTypes = types;
        // Mapear los datos del backend al formato legacy para compatibilidad
        this.tiposEmergencia = types.map(type => ({
          id: type.emergencyTypeId.toString(),
          nombre: type.emergencyType,
          categoria: this.categorizeEmergencyType(type.emergencyType)
        }));
      },
      error: (error) => {
        this.notificationService.error('Error de Carga', 'No se pudieron cargar los tipos de emergencia.');
      }
    });
  }

  // Método auxiliar para categorizar tipos de emergencia
  private categorizeEmergencyType(emergencyType: string): 'incendio' | 'rescate' | 'accidente' | 'medica' | 'otra' {
    const tipo = emergencyType.toLowerCase();
    
    if (tipo.includes('incendio')) return 'incendio';
    if (tipo.includes('rescate') || tipo.includes('busqueda')) return 'rescate';
    if (tipo.includes('accidente') || tipo.includes('transito')) return 'accidente';
    if (tipo.includes('prehospitalaria') || tipo.includes('traslado') || tipo.includes('medica')) return 'medica';
    
    return 'otra';
  }

  loadFormData(): void {
    // Cargar personal disponible
    this.emergencyReportLegacyService.getPersonalDisponible().subscribe((personal: PersonalDisponible[]) => {
      this.personalDisponible = personal;
    });
  }

  onTipoEmergenciaChange(event: any): void {
    const tipoId = event.value;
    const tipoObj = this.tiposEmergencia.find(t => t.id === tipoId);
    const tipoNombre = tipoObj ? tipoObj.nombre : 'Nueva Emergencia';
    
    // Actualizar el nombre de la pestaña actual
    if (this.formularios[this.selectedIndex]) {
      this.formularios[this.selectedIndex].tipo = tipoNombre;
      
      // NUEVO: Guardar la estructura actualizada con el nuevo nombre de la pestaña
      this.saveFormulariesStructure();
    }
    
    // Emitir el cambio si es necesario
    this.tipoChange.emit(tipoNombre);
  }

  onSinConvenioChange(event: any): void {
    this.esTurnoSinConvenio = event.checked;
    if (this.esTurnoSinConvenio) {
      this.emergencyForm.get('numeroTurno')?.setValue(null);
      this.emergencyForm.get('numeroTurno')?.clearValidators();
    } else {
      // Si se desmarca "sin convenio", establecer 1 por defecto
      if (!this.emergencyForm.get('numeroTurno')?.value) {
        this.emergencyForm.get('numeroTurno')?.setValue(1);
      }
      this.emergencyForm.get('numeroTurno')?.setValidators([Validators.required]);
    }
    this.emergencyForm.get('numeroTurno')?.updateValueAndValidity();
  }

  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.isUploading = true;
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (this.validateFile(file)) {
          this.selectedFiles.push(file);
          // Crear y almacenar la URL de preview una sola vez
          const previewUrl = URL.createObjectURL(file);
          this.filePreviewUrls.set(file, previewUrl);
        }
      }
      
      this.isUploading = false;
    }
  }

  validateFile(file: File): boolean {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    
    if (!allowedTypes.includes(file.type)) {
      this.notificationService.warning('Archivo No Válido', 'Solo se permiten archivos JPG, JPEG y PNG.');
      return false;
    }
    
    if (file.size > maxSize) {
      this.notificationService.warning('Archivo Muy Grande', 'El archivo no puede ser mayor a 5MB.');
      return false;
    }
    
    return true;
  }

  removeFile(index: number): void {
    const file = this.selectedFiles[index];
    // Limpiar la URL blob para liberar memoria
    const previewUrl = this.filePreviewUrls.get(file);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      this.filePreviewUrls.delete(file);
    }
    this.selectedFiles.splice(index, 1);
  }

  getFilePreview(file: File): string {
    return this.filePreviewUrls.get(file) || '';
  }

  toggleDebugInfo(): void {
    this.showDebugInfo = !this.showDebugInfo;
  }

  getFormErrors(): any[] {
    // Solo retornar información básica de validación sin detalles técnicos
    const errors: any[] = [];
    if (this.emergencyForm.invalid) {
      errors.push({ message: 'Formulario incompleto o con errores' });
    }
    return errors;
  }

  // Métodos para el debug detallado
  getTipoEmergenciaNombre(): string {
    const tipoId = this.emergencyForm.get('tipoEmergencia')?.value;
    // Buscar primero en emergencyTypes (datos del backend)
    const tipoBackend = this.emergencyTypes.find(t => t.emergencyTypeId == tipoId);
    if (tipoBackend) {
      return tipoBackend.emergencyType;
    }
    // Fallback a tiposEmergencia (formato legacy)
    const tipo = this.tiposEmergencia.find(t => t.id == tipoId);
    return tipo ? tipo.nombre : 'No seleccionado';
  }

  getFormattedTurno(): string {
    const sinConvenio = this.emergencyForm.get('sinConvenio')?.value;
    const numeroTurno = this.emergencyForm.get('numeroTurno')?.value;
    
    if (sinConvenio) {
      return 'Turno sin convenio';
    } else {
      return `Turno #${numeroTurno || '1'}`;
    }
  }

  getUnidadesSeleccionadas(): string {
    const unidades = this.emergencyForm.get('unidades')?.value;
    if (Array.isArray(unidades) && unidades.length > 0) {
      return unidades.map((id: number) => {
        const person = this.personalDisponible.find(p => p.personalId === id);
        return person ? `${person.rango} ${person.nombre}` : `ID: ${id}`;
      }).join(', ');
    }
    return 'Ninguna seleccionada';
  }

  getGuardiaSeleccionada(): string {
    const guardia = this.emergencyForm.get('guardia')?.value || [];
    if (guardia.length === 0) return 'Ninguna seleccionada';
    
    return guardia.map((id: number) => {
      const person = this.personalDisponible.find(p => p.personalId === id);
      return person ? `${person.rango} ${person.nombre}` : `ID: ${id}`;
    }).join(', ');
  }

  getVehiculosSeleccionados(): string {
    const vehiculos = this.emergencyForm.get('vehiculo')?.value || [];
    if (!Array.isArray(vehiculos) || vehiculos.length === 0) {
      return 'Ninguno seleccionado';
    }
    
    return vehiculos.map((id: number) => {
      const vehicle = this.availableVehicles.find(v => v.vehicleId === id);
      return vehicle ? vehicle.name : `ID: ${id}`;
    }).join(', ');
  }

  formatSelectedPersonnelNames(guardiaIds: number[] | number | string): string {
    if (!guardiaIds) return '';
    
    const ids = Array.isArray(guardiaIds) ? guardiaIds : [guardiaIds];
    return ids.map(id => {
      const person = this.personalDisponible.find(p => p.personalId === Number(id));
      return person ? `${person.rango} ${person.nombre}` : `ID: ${id}`;
    }).join(', ');
  }

  // ===== NUEVOS MÉTODOS PARA CONVERSIÓN ID <-> NOMBRES =====
  
  /**
   * Convierte IDs de personal a nombres completos con rango
   */
  private convertPersonnelIdsToNames(ids: number[]): string[] {
    if (!ids || !Array.isArray(ids)) return [];
    
    return ids.map(id => {
      const person = this.personalDisponible.find(p => p.personalId === id);
      return person ? `${person.rango} ${person.nombre}` : `ID: ${id}`;
    });
  }
  
  /**
   * Convierte nombres de personal con rango a IDs
   */
  private convertPersonnelNamesToIds(names: string[]): number[] {
    if (!names || !Array.isArray(names)) return [];
    
    return names.map(name => {
      // Buscar por nombre completo (rango + nombre)
      const person = this.personalDisponible.find(p => 
        `${p.rango} ${p.nombre}` === name
      );
      
      if (person) {
        return person.personalId;
      }
      
      // Fallback: buscar solo por nombre si no encuentra con rango
      const personByName = this.personalDisponible.find(p => 
        p.nombre === name || name.includes(p.nombre)
      );
      
      return personByName ? personByName.personalId : 0;
    }).filter(id => id > 0); // Filtrar IDs inválidos
  }
  
  /**
   * Convierte IDs de vehículos a nombres (solo el nombre, sin placa)
   */
  private convertVehicleIdsToNames(ids: number[]): string[] {
    if (!ids || !Array.isArray(ids)) return [];
    
    return ids.map(id => {
      const vehicle = this.availableVehicles.find(v => v.vehicleId === id);
      return vehicle ? vehicle.name : `ID: ${id}`;
    });
  }
  
  /**
   * Convierte nombres de vehículos a IDs
   */
  private convertVehicleNamesToIds(names: string[]): number[] {
    if (!names || !Array.isArray(names)) return [];
    
    return names.map(name => {
      // Buscar por nombre exacto (solo nombre, sin placa)
      const vehicle = this.availableVehicles.find(v => 
        v.name === name
      );
      
      if (vehicle) {
        return vehicle.vehicleId;
      }
      
      // Fallback: buscar por coincidencia parcial del nombre
      const vehicleByName = this.availableVehicles.find(v => 
        v.name.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(v.name.toLowerCase())
      );
      
      return vehicleByName ? vehicleByName.vehicleId : 0;
    }).filter(id => id > 0); // Filtrar IDs inválidos
  }
  
  /**
   * Restaura IDs desde nombres guardados cuando sea necesario
   * Convierte los nombres guardados de vuelta a IDs para que el formulario funcione
   */
  private restoreIdsFromNames(data: any): void {
    if (!data) return;
    
    try {
      // Verificar si los datos contienen nombres (arrays de strings)
      
             // Restaurar vehículos: convertir nombres a IDs
       if (data.vehiculo && Array.isArray(data.vehiculo) && data.vehiculo.length > 0) {
         // Si el primer elemento es string, son nombres que necesitan conversión
         if (typeof data.vehiculo[0] === 'string') {
           const vehiculoNombres = [...data.vehiculo]; // Guardar nombres originales para el log
           const vehiculoIds = this.convertVehicleNamesToIds(data.vehiculo);
           data.vehiculo = vehiculoIds;
           console.log('🔄 Restaurados vehículos desde nombres:', vehiculoNombres, '-> IDs:', vehiculoIds);
         }
       }
      
             // Restaurar unidades: convertir nombres a IDs
       if (data.unidades && Array.isArray(data.unidades) && data.unidades.length > 0) {
         // Si el primer elemento es string, son nombres que necesitan conversión
         if (typeof data.unidades[0] === 'string') {
           const unidadesNombres = [...data.unidades]; // Guardar nombres originales para el log
           const unidadesIds = this.convertPersonnelNamesToIds(data.unidades);
           data.unidades = unidadesIds;
           console.log('🔄 Restauradas unidades desde nombres:', unidadesNombres, '-> IDs:', unidadesIds);
         }
       }
       
       // Restaurar guardia: convertir nombres a IDs
       if (data.guardia && Array.isArray(data.guardia) && data.guardia.length > 0) {
         // Si el primer elemento es string, son nombres que necesitan conversión
         if (typeof data.guardia[0] === 'string') {
           const guardiaNombres = [...data.guardia]; // Guardar nombres originales para el log
           const guardiaIds = this.convertPersonnelNamesToIds(data.guardia);
           data.guardia = guardiaIds;
           console.log('🔄 Restaurada guardia desde nombres:', guardiaNombres, '-> IDs:', guardiaIds);
         }
       }
      
    } catch (error) {
      console.error('Error al restaurar IDs desde nombres:', error);
    }
  }


  isUnidadSelected(personalId: number): boolean {
    const unidades = this.emergencyForm.get('unidades')?.value || [];
    return unidades.includes(personalId);
  }

  isGuardiaSelected(personalId: number): boolean {
    const guardia = this.emergencyForm.get('guardia')?.value || [];
    return guardia.includes(personalId);
  }

  // Métodos para verificar estado de vehículos
  isVehicleSelected(vehicleId: number): boolean {
    const vehiculos = this.emergencyForm.get('vehiculo')?.value || [];
    const vehiculosArray = Array.isArray(vehiculos) ? vehiculos : [vehiculos];
    return vehiculosArray.includes(vehicleId);
  }

  // Bandera removida - ya no se necesita para validaciones de ocupación

  onVehicleSelectionChange(selectedIds: number[]): void {
    // Ya no hay validaciones de ocupación - los vehículos pueden ser seleccionados en múltiples emergencias
  }

  onUnidadChange(event: any, personalId: number): void {
    const unidades = this.emergencyForm.get('unidades')?.value || [];
    const guardia = this.emergencyForm.get('guardia')?.value || [];
    
    if (event.checked) {
      // Solo verificar que no esté ya en guardia del mismo formulario
      if (guardia.includes(personalId)) {
        this.notificationService.warning('Personal Duplicado', 'Esta persona ya está seleccionada como Personal de Guardia en este formulario.');
        return;
      }
      
      unidades.push(personalId);
    } else {
      const index = unidades.indexOf(personalId);
      if (index > -1) {
        unidades.splice(index, 1);
      }
    }
    this.emergencyForm.get('unidades')?.setValue(unidades);
    this.emergencyForm.get('unidades')?.markAsTouched();
  }

  onGuardiaChange(event: any, personalId: number): void {
    const guardia = this.emergencyForm.get('guardia')?.value || [];
    const unidades = this.emergencyForm.get('unidades')?.value || [];
    
    if (event.checked) {
      // Solo verificar que no esté ya en unidades del mismo formulario
      if (unidades.includes(personalId)) {
        this.notificationService.warning('Personal Duplicado', 'Esta persona ya está seleccionada como Unidad de Respuesta en este formulario.');
        return;
      }
      
      guardia.push(personalId);
    } else {
      const index = guardia.indexOf(personalId);
      if (index > -1) {
        guardia.splice(index, 1);
      }
    }
    this.emergencyForm.get('guardia')?.setValue(guardia);
    this.emergencyForm.get('guardia')?.markAsTouched();
  }

  onSubmit(event?: Event): void {
    if (event) {
      event.preventDefault();
    }

    // Guardar el estado actual antes de enviar
    this.saveCurrentFormState();

    if (!this.emergencyForm.valid) {
      this.notificationService.warning('Formulario Incompleto', 'Por favor completa todos los campos requeridos antes de continuar.');
      return;
    }
    
    console.log('onSubmit llamado manualmente');

    // Verificar autenticación antes de enviar
    if (!this.authService.isAuthenticated() || !this.authService.verifyAndRefreshSession()) {
      this.authService.logout();
      this.notificationService.warning(
        'Sesión Expirada',
        'Tu sesión ha expirado. Por favor inicia sesión nuevamente.',
        { duration: 3000 }
      );
      this.router.navigate(['/emergencias']);
      return;
    }

    // Mostrar información del token para debug
    const tokenInfo = this.authService.getTokenInfo();
    if (tokenInfo) {      
      // Si el token está por expirar (menos de 2 minutos), mostrar advertencia
      if (tokenInfo.timeLeft < 5 * 60 * 1000) {
        this.notificationService.warning(
          'Sesión por Expirar',
          'Tu sesión expirará pronto. Por favor guarda tu trabajo.',
          { duration: 10000 }
        );
      }
    }

    this.isSubmitting = true;
    this.submitSuccess = false;
    this.submitError = null;

    // Mapear datos del formulario legacy al formato del backend
    const formValues = this.emergencyForm.value;
    const turno = formValues.sinConvenio ? 'false' : (formValues.numeroTurno?.toString() || '1');
    
    // Validar datos antes de crear el objeto


    // Validar campos críticos
    if (!formValues.tipoEmergencia) {
      this.notificationService.warning('Campo Requerido', 'Debes seleccionar un tipo de emergencia.');
      return;
    }
    if (!formValues.quienInforma) {
      this.notificationService.warning('Campo Requerido', 'Debes especificar quién informa la emergencia.');
      return;
    }
    if (!formValues.ubicacion) {
      this.notificationService.warning('Campo Requerido', 'Debes especificar la ubicación de la emergencia.');
      return;
    }

    const emergencyData: Emergency = {
      userId: this.getCurrentUserId(),
      emergencyTypeId: Number(formValues.tipoEmergencia) || 1,
      emergencyDate: this.formatDateForBackend(formValues.fechaReporte || new Date()),
      informant: formValues.quienInforma || '',
      vehicleIds: formValues.vehiculo ? [Number(formValues.vehiculo)] : [],
      ubication: formValues.ubicacion || '',
      turn: turno || '1',
      reportTime: this.formatDateTimeForBackend(formValues.fechaReporte || new Date(), formValues.horaReporte || '00:00'),
      reportTimeDescription: formValues.horaReporteDescripcion || '',
      departureTime: this.formatDateTimeForBackend(formValues.fechaReporte || new Date(), formValues.horaSalida || '00:00'),
      departureTimeDescription: formValues.horaSalidaDescripcion || '',
      arrivalSceneTime: formValues.horaLlegadaEscena ? 
        this.formatDateTimeForBackend(formValues.fechaReporte || new Date(), formValues.horaLlegadaEscena) : undefined,
      arrivalSceneTimeDescription: formValues.horaLlegadaEscenaDescripcion || '',
      arrivalHospitalTime: formValues.horaLlegadaHospital ? 
        this.formatDateTimeForBackend(formValues.fechaReporte || new Date(), formValues.horaLlegadaHospital) : undefined,
      arrivalHospitalTimeDescription: formValues.horaLlegadaHospitalDescripcion || '',
      returnEstationTime: this.formatDateTimeForBackend(formValues.fechaReporte || new Date(), formValues.horaRegresoEstacion || '00:00'),
      returnEstationTimeDescription: formValues.horaRegresoEstacionDescripcion || '',
      unitsResponse: this.formatSelectedPersonnelNames(formValues.unidades),
      personnelIds: Array.isArray(formValues.guardia) ? formValues.guardia : (formValues.guardia ? [formValues.guardia] : []),
      guardPersonnel: this.formatSelectedPersonnelNames(formValues.guardia),
      // Agregar eventos adicionales
      eventosAdicionalesSalida: formValues.eventosAdicionalesSalida || [],
      eventosAdicionalesLlegadaEscena: formValues.eventosAdicionalesLlegadaEscena || [],
      eventosAdicionalesLlegadaHospital: formValues.eventosAdicionalesLlegadaHospital || []
    };

    // Preparar archivos
    const emergencyFiles: EmergencyFile[] = this.selectedFiles.map(file => ({
      file: file,
      description: ''
    }));

    // Verificar que no hay valores undefined críticos
    if (!emergencyData.informant || !emergencyData.ubication || !emergencyData.emergencyTypeId) {
      this.notificationService.error('Datos Incompletos', 'Faltan datos requeridos para enviar la emergencia.');
      this.isSubmitting = false;
      return;
    }

    // Enviar al backend
    this.emergencyService.createEmergency(emergencyData, emergencyFiles).subscribe({
      next: (response: any) => {
        this.submitSuccess = true;
        this.submitError = null;
        
        // Limpiar datos de persistencia después del envío exitoso
        this.clearCurrentTabPersistence();
        
        this.notificationService.success(
          '¡Emergencia Registrada!',
          'La emergencia se ha guardado exitosamente en el sistema.',
          { duration: 5000 }
        );

        // Cerrar la pestaña actual después de guardar exitosamente
        this.closeCurrentTabAfterSave();
      },
      error: (error: any) => {        
        this.submitError = error.error?.message || 'Error desconocido al registrar la emergencia';
        
        if (error.status === 401) {
          this.authService.logout();
          this.notificationService.warning(
            'Sesión Expirada',
            'Tu sesión ha expirado. Serás redirigido al login en unos segundos.',
            { duration: 3000 }
          );
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 1000);
        } else if (error.status === 403) {
          this.notificationService.error('Acceso Denegado', 'No tienes permisos para realizar esta acción.');
        } else if (error.status === 0) {
          this.notificationService.error('Error de Conexión', 'No se puede conectar al servidor. Verifica tu conexión a internet.');
        } else {
          this.notificationService.error('Error del Sistema', `Error ${error.status}: ${this.submitError}`);
        }
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }

  resetForm(): void {
    this.emergencyForm.reset();
    
    // Limpiar FormArrays de eventos adicionales
    while (this.eventosAdicionalesSalida.length !== 0) {
      this.eventosAdicionalesSalida.removeAt(0);
    }
    while (this.eventosAdicionalesLlegadaEscena.length !== 0) {
      this.eventosAdicionalesLlegadaEscena.removeAt(0);
    }
    while (this.eventosAdicionalesLlegadaHospital.length !== 0) {
      this.eventosAdicionalesLlegadaHospital.removeAt(0);
    }
    
    // Limpiar URLs blob para liberar memoria
    this.filePreviewUrls.forEach(url => URL.revokeObjectURL(url));
    this.filePreviewUrls.clear();
    
    // Resetear todas las variables de estado
    this.selectedFiles = [];
    this.submitSuccess = false;
    this.submitError = null;
    this.esTurnoSinConvenio = false;
    this.isSubmitting = false;
    this.isUploading = false;
    this.showDebugInfo = false;
    
    // Limpiar arrays de personal si existen
    // No reiniciar los datos cargados desde el servidor
    // this.personalDisponible = []; // NO hacer esto
    // this.availableVehicles = []; // NO hacer esto
    // this.emergencyTypes = []; // NO hacer esto
  }

  // Métodos para compatibilidad con el diseño original
  addNewEmergencyForm(): void {
    // Guardar el estado del formulario actual antes de cambiar
    this.saveCurrentFormState();

    // Crear nuevo formulario
    this.createForm();
    
    // Agregar nuevo formulario a la lista
    this.formularios.push({
      tipo: 'Nueva Emergencia',
      id: Date.now(),
      formData: null,
      selectedFiles: [],
      esTurnoSinConvenio: false
    });

    // NUEVO: Guardar la estructura de formularios múltiples
    this.saveFormulariesStructure();

    // Cambiar a la nueva pestaña
    setTimeout(() => {
      this.selectedIndex = this.formularios.length - 1;
      // Las validaciones de ocupación han sido removidas
    });
  }

  // Guardar el estado actual del formulario
  saveCurrentFormState(): void {
    const currentFormulario = this.formularios[this.selectedIndex];
    if (currentFormulario && this.emergencyForm) {
      const formValue = this.emergencyForm.value;
      
      // Preparar datos con tipos correctos para persistencia
      // NUEVO: Convertir IDs a nombres para mejor legibilidad en persistencia
      const vehiculoIds = Array.isArray(formValue.vehiculo) ? formValue.vehiculo : (formValue.vehiculo ? [formValue.vehiculo] : []);
      const unidadesIds = Array.isArray(formValue.unidades) ? formValue.unidades : (formValue.unidades ? [formValue.unidades] : []);
      const guardiaIds = Array.isArray(formValue.guardia) ? formValue.guardia : (formValue.guardia ? [formValue.guardia] : []);
      
      const formValueWithExtras = {
        ...formValue,
        // NUEVO: Guardar solo los nombres para legibilidad (no IDs)
        vehiculo: this.convertVehicleIdsToNames(vehiculoIds),
        unidades: this.convertPersonnelIdsToNames(unidadesIds),
        guardia: this.convertPersonnelIdsToNames(guardiaIds),
        
        // NUEVO: Asegurar que los FormArrays de eventos se guarden correctamente como arrays
        eventosAdicionalesSalida: Array.isArray(formValue.eventosAdicionalesSalida) ? formValue.eventosAdicionalesSalida : [],
        eventosAdicionalesLlegadaEscena: Array.isArray(formValue.eventosAdicionalesLlegadaEscena) ? formValue.eventosAdicionalesLlegadaEscena : [],
        eventosAdicionalesLlegadaHospital: Array.isArray(formValue.eventosAdicionalesLlegadaHospital) ? formValue.eventosAdicionalesLlegadaHospital : [],
        
        // Metadatos de archivos
        selectedFiles: this.selectedFiles.map(f => ({ 
          name: f.name, 
          size: f.size, 
          type: f.type, 
          lastModified: f.lastModified 
        })),
        
        // Estados adicionales
        esTurnoSinConvenio: this.esTurnoSinConvenio,
        tabIndex: this.selectedIndex,
        totalTabs: this.formularios.length,
        savedAt: new Date().toISOString()
      };
      
      // Guardar en memoria local (para cambio de pestañas) con copia profunda
      currentFormulario.formData = JSON.parse(JSON.stringify(formValueWithExtras));
      currentFormulario.selectedFiles = [...this.selectedFiles];
      currentFormulario.esTurnoSinConvenio = this.esTurnoSinConvenio;
      
      // Guardar en persistencia usando el servicio centralizado
      const tabConfig: FormPersistenceConfig = {
        ...this.persistenceConfig,
        key: `${this.persistenceConfig.key}_tab_${this.selectedIndex}`
      };
      
      // CORRECCIÓN: Guardar los datos extendidos directamente usando localStorage
      // En lugar de crear un FormGroup temporal que puede causar errores de validación
      try {
        const storage = tabConfig.storageType === 'sessionStorage' ? sessionStorage : localStorage;
        const dataWithMetadata = {
          data: formValueWithExtras,
          timestamp: new Date().toISOString(),
          version: '1.0'
        };
        storage.setItem(tabConfig.key, JSON.stringify(dataWithMetadata));
        console.log(`✅ Datos extendidos guardados en ${tabConfig.storageType || 'localStorage'} con clave: ${tabConfig.key}`);
      } catch (error) {
        console.error('Error al guardar datos extendidos:', error);
        // Fallback: usar solo el formulario básico
        this.formPersistenceService.saveFormData(this.emergencyForm, tabConfig);
      }
      
    }
  }

  // Restaurar el estado del formulario
  restoreFormState(index: number): void {
    const formulario = this.formularios[index];
    
    if (formulario && formulario.formData) {
      // Primero recrear el formulario limpio (esto ya configura la persistencia)
      this.createForm();
      
      // Normalizar datos antes de restaurar
      const normalizedData = this.normalizeFormData(formulario.formData);
      
      // NUEVO: Restaurar IDs desde nombres si es necesario
      this.restoreIdsFromNames(normalizedData);
      
      // Restaurar los FormArrays antes de hacer patchValue
      this.restoreFormArrays(normalizedData);
      
      // Restaurar los datos del formulario con datos normalizados
      this.emergencyForm.patchValue(normalizedData, { emitEvent: false }); // Cambio a false para evitar auto-guardado inmediato
      
      // Restaurar archivos seleccionados
      this.selectedFiles = formulario.selectedFiles || [];
      
      // Restaurar estado del turno
      this.esTurnoSinConvenio = formulario.esTurnoSinConvenio || false;
      
      // Forzar actualización visual
      this.forceFormUpdate();
      
    } else {
      // Si no hay datos guardados, limpiar el formulario
      this.resetForm();
      this.createForm(); // Esto también configura la persistencia automáticamente
      
    }
  }

  // Restaurar FormArrays específicos
  restoreFormArrays(formData: any): void {
    if (!formData) {
      return;
    }

    try {
      // Limpiar FormArrays actuales de forma segura
      this.clearFormArrays();

      // Restaurar eventos adicionales de salida
      this.restoreFormArray(
        'eventosAdicionalesSalida',
        formData.eventosAdicionalesSalida,
        this.eventosAdicionalesSalida
      );

      // Restaurar eventos adicionales de llegada a escena
      this.restoreFormArray(
        'eventosAdicionalesLlegadaEscena',
        formData.eventosAdicionalesLlegadaEscena,
        this.eventosAdicionalesLlegadaEscena
      );

      // Restaurar eventos adicionales de llegada al hospital
      this.restoreFormArray(
        'eventosAdicionalesLlegadaHospital',
        formData.eventosAdicionalesLlegadaHospital,
        this.eventosAdicionalesLlegadaHospital
      );

    } catch (error) {
      // En caso de error, asegurar que los FormArrays estén limpios
      this.clearFormArrays();
    }
  }

  /**
   * Limpia todos los FormArrays de forma segura
   */
  private clearFormArrays(): void {
    try {
      // Limpiar FormArrays actuales de forma segura
      while (this.eventosAdicionalesSalida && this.eventosAdicionalesSalida.length > 0) {
        this.eventosAdicionalesSalida.removeAt(0);
      }
      while (this.eventosAdicionalesLlegadaEscena && this.eventosAdicionalesLlegadaEscena.length > 0) {
        this.eventosAdicionalesLlegadaEscena.removeAt(0);
      }
      while (this.eventosAdicionalesLlegadaHospital && this.eventosAdicionalesLlegadaHospital.length > 0) {
        this.eventosAdicionalesLlegadaHospital.removeAt(0);
      }
    } catch (error) {
    }
  }

  /**
   * Restaura un FormArray específico de forma segura
   */
  private restoreFormArray(fieldName: string, data: any, formArray: FormArray): void {
    try {
      if (data && Array.isArray(data) && data.length > 0) {
        
        data.forEach((evento: any, index: number) => {
          try {
            // Validar que el evento tenga la estructura correcta
            if (evento && typeof evento === 'object') {
              formArray.push(this.fb.group({
                hora: [evento.hora || '', Validators.required],
                descripcion: [evento.descripcion || '']
              }));
            }
          } catch (elementError) {
          }
        });
      } else {
      }
    } catch (error) {
    }
  }

  removeFormulario(index: number, event: Event): void {
    event.stopPropagation();
    if (this.formularios.length > 1) {
      // Mostrar confirmación antes de eliminar
      if (confirm(`¿Estás seguro de que quieres cerrar "${this.formularios[index].tipo}"? Los datos no guardados se perderán.`)) {
        
        // Guardar el estado actual antes de eliminar
        this.saveCurrentFormState();
        
        // Limpiar datos persistidos de la pestaña que se va a eliminar
        const tabConfig: FormPersistenceConfig = {
          ...this.persistenceConfig,
          key: `${this.persistenceConfig.key}_tab_${index}`
        };
        // Limpiar tanto con el servicio como directamente por seguridad
        this.formPersistenceService.clearFormData(tabConfig);
        try {
          const storage = tabConfig.storageType === 'sessionStorage' ? sessionStorage : localStorage;
          storage.removeItem(tabConfig.key);
        } catch (error) {
          console.error('Error al limpiar datos extendidos:', error);
        }
        
        // Eliminar el formulario específico
        this.formularios.splice(index, 1);
        
        // Determinar el nuevo índice seleccionado
        let newSelectedIndex: number;
        
        if (index === this.selectedIndex) {
          // Si eliminamos la pestaña activa
          if (index >= this.formularios.length) {
            // Si eliminamos la última pestaña, ir a la nueva última
            newSelectedIndex = this.formularios.length - 1;
          } else {
            // Si no era la última, mantener el mismo índice (que ahora apunta a la siguiente pestaña)
            newSelectedIndex = index;
          }
        } else if (index < this.selectedIndex) {
          // Si eliminamos una pestaña anterior a la actual, decrementar el índice
          newSelectedIndex = this.selectedIndex - 1;
        } else {
          // Si eliminamos una pestaña posterior a la actual, mantener el índice
          newSelectedIndex = this.selectedIndex;
        }
        
        // Actualizar el índice seleccionado
        this.selectedIndex = newSelectedIndex;
        
        // NUEVO: Guardar la nueva estructura de formularios
        this.saveFormulariesStructure();
        
        // Restaurar los datos de la nueva pestaña activa
        this.restoreFormState(this.selectedIndex);
      }
    } else {
      // No se puede eliminar el último formulario
      this.notificationService.warning('Acción No Permitida', 'No puedes eliminar el último formulario de emergencia.');
    }
  }

  switchToFormulario(newIndex: number): void {
    // Si es el mismo índice, no hacer nada
    if (this.selectedIndex === newIndex) {
      return;
    }
    
    // Guardar el estado del formulario actual antes de cambiar
    this.saveCurrentFormState();
    
    // Guardar el índice anterior para referencia
    const previousIndex = this.selectedIndex;
    
    // Cambiar al nuevo índice
    this.selectedIndex = newIndex;
    
    // NUEVO: Guardar la estructura actualizada con el nuevo índice seleccionado
    this.saveFormulariesStructure();
    
    // Restaurar el estado del formulario de la nueva pestaña
    this.restoreFormState(newIndex);
    
    // Las validaciones de ocupación han sido removidas
  }

  // Nuevo método para manejar el cambio de pestañas desde el template
  onTabChange(newIndex: number): void {
    if (this.selectedIndex !== newIndex) {
      // Guardar estado actual
      this.saveCurrentFormState();
      
      // Cambiar índice
      const oldIndex = this.selectedIndex;
      this.selectedIndex = newIndex;
      
      // NUEVO: Guardar la estructura actualizada con el nuevo índice seleccionado
      this.saveFormulariesStructure();
      
      // Restaurar estado del nuevo formulario
      this.restoreFormState(newIndex);
      
      // Las validaciones de ocupación han sido removidas
    }
  }

  // Getters para FormArrays de eventos adicionales
  get eventosAdicionalesSalida() {
    return this.emergencyForm.get('eventosAdicionalesSalida') as FormArray;
  }

  get eventosAdicionalesLlegadaEscena() {
    return this.emergencyForm.get('eventosAdicionalesLlegadaEscena') as FormArray;
  }

  get eventosAdicionalesLlegadaHospital() {
    return this.emergencyForm.get('eventosAdicionalesLlegadaHospital') as FormArray;
  }

  // Métodos para agregar eventos adicionales
  addEventoAdicionalSalida(): void {
    this.eventosAdicionalesSalida.push(this.fb.group({
      hora: ['', Validators.required],
      descripcion: ['']
    }));
    
    // NUEVO: Guardar inmediatamente cuando se agrega una novedad
    this.saveEventAfterDelay();
  }

  removeEventoAdicionalSalida(index: number): void {
    this.eventosAdicionalesSalida.removeAt(index);
    
    // NUEVO: Guardar inmediatamente cuando se elimina una novedad
    this.saveEventAfterDelay();
  }

  addEventoAdicionalLlegadaEscena(): void {
    this.eventosAdicionalesLlegadaEscena.push(this.fb.group({
      hora: ['', Validators.required],
      descripcion: ['']
    }));
    
    // NUEVO: Guardar inmediatamente cuando se agrega una novedad
    this.saveEventAfterDelay();
  }

  removeEventoAdicionalLlegadaEscena(index: number): void {
    this.eventosAdicionalesLlegadaEscena.removeAt(index);
    
    // NUEVO: Guardar inmediatamente cuando se elimina una novedad
    this.saveEventAfterDelay();
  }

  addEventoAdicionalLlegadaHospital(): void {
    this.eventosAdicionalesLlegadaHospital.push(this.fb.group({
      hora: ['', Validators.required],
      descripcion: ['']
    }));
    
    // NUEVO: Guardar inmediatamente cuando se agrega una novedad
    this.saveEventAfterDelay();
  }

  removeEventoAdicionalLlegadaHospital(index: number): void {
    this.eventosAdicionalesLlegadaHospital.removeAt(index);
    
    // NUEVO: Guardar inmediatamente cuando se elimina una novedad
    this.saveEventAfterDelay();
  }

  ngOnDestroy(): void {
    // Guardar el estado actual antes de destruir
    this.saveCurrentFormState();
    
    // Limpiar timeout de auto-guardado
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }

    // NUEVO: Limpiar subscripción del formulario
    if (this.formSubscription) {
      this.formSubscription.unsubscribe();
    }
    
    // Limpiar URLs blob para liberar memoria al destruir el componente
    this.filePreviewUrls.forEach(url => URL.revokeObjectURL(url));
    this.filePreviewUrls.clear();
  }

  // Validador personalizado para arrays que no deben estar vacíos
  arrayNotEmptyValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value || !Array.isArray(value) || value.length === 0) {
      return { arrayEmpty: true };
    }
    return null;
  }

  private getCurrentUserId(): number {
    const user = this.authService.getCurrentUser();
    console.log('Usuario para obtener ID:', user);
    return user?.id || user?.userId || 1; // Intentar ambas propiedades
  }

  private formatDateForBackend(date: any): string {
    if (!date) {
      return new Date().toISOString().split('T')[0];
    }
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) {
        return new Date().toISOString().split('T')[0];
      }
      return d.toISOString().split('T')[0];
    } catch (error) {
      return new Date().toISOString().split('T')[0];
    }
  }

  private formatDateTimeForBackend(date: any, time: string): string {
    if (!date || !time) {
      return new Date().toISOString();
    }
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) {
        return new Date().toISOString();
      }
      const [hours, minutes] = time.split(':');
      dateObj.setHours(parseInt(hours) || 0, parseInt(minutes) || 0, 0, 0);
      return dateObj.toISOString();
    } catch (error) {
      return new Date().toISOString();
    }
  }

  // Métodos para generar el reporte final
  async generateReport(): Promise<void> {
  }

  // Función para manejar Ctrl+Click en campos de hora
  onTimeClick(event: MouseEvent, fieldName: string, eventControl?: AbstractControl): void {
    // Verificar si se presionó Ctrl (o Cmd en Mac)
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      event.stopPropagation();
      
      // Obtener la hora actual en formato HH:mm (24 horas)
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5); // Formato HH:mm
      
      // Establecer la hora en el campo correspondiente
      if (eventControl && fieldName === 'hora') {
        // Para campos dentro de FormArrays (eventos adicionales)
        if (eventControl instanceof FormGroup) {
          eventControl.get('hora')?.setValue(currentTime);
        }
      } else {
        // Para campos directos del formulario
        this.emergencyForm.get(fieldName)?.setValue(currentTime);
      }
    }
  }

  private closeCurrentTabAfterSave(): void {
    const redirectPath = '/emergencias'; // Cambia esta ruta según necesites

    // Si hay más de una pestaña, cerrar la actual y continuar con las demás
    if (this.formularios.length > 1) {
      setTimeout(() => {
        // Eliminar la pestaña actual
        const currentIndex = this.selectedIndex;
        this.formularios.splice(currentIndex, 1);
        
        // Determinar el nuevo índice seleccionado
        let newSelectedIndex: number;
        if (currentIndex >= this.formularios.length) {
          newSelectedIndex = this.formularios.length - 1;
        } else {
          newSelectedIndex = currentIndex;
        }
        
        // Actualizar el índice y restaurar datos
        this.selectedIndex = newSelectedIndex;
        this.restoreFormState(this.selectedIndex);
      }, 1500);
    } else {
      // Si es la única pestaña, redirigir
      setTimeout(() => {
        try {
          this.router.navigate([redirectPath]);
        } catch (error) {
          console.error('Error al redirigir:', error);
          window.location.href = redirectPath;
        }
      }, 1500);
    }
  }

  // ===== MÉTODOS ADICIONALES DE PERSISTENCIA =====

  /**
   * Guarda manualmente la pestaña actual
   */
  saveDraftManually(): void {
    this.saveCurrentFormState();
    this.notificationService.success('Borrador Guardado', 'El formulario se ha guardado correctamente.');
  }

  /**
   * NUEVO: Guarda el formulario después de un breve delay cuando se agregan/eliminan eventos
   */
  private saveEventAfterDelay(): void {
    // Limpiar timeout anterior si existe
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }
    
    // Guardar después de un breve delay para permitir que el FormArray se actualice
    this.autoSaveTimeout = setTimeout(() => {
      this.saveCurrentFormState();
    }, 500); // Delay más corto para eventos/novedades
  }

  /**
   * Método de debug para verificar el estado del formulario
   */
  debugFormState(): void {    
    // Verificar campos específicos
    const importantFields = ['quienInforma', 'ubicacion', 'horaReporte', 'horaSalida'];
    importantFields.forEach(field => {
      const control = this.emergencyForm.get(field);
      if (control) {
        console.log(`  ${field}:`, {
          value: control.value,
          valid: control.valid,
          dirty: control.dirty,
          touched: control.touched,
          errors: control.errors
        });
      }
    });
    
    // Verificar datos de persistencia
    const tabConfig = {
      ...this.persistenceConfig,
      key: `${this.persistenceConfig.key}_tab_${this.selectedIndex}`
    };
    const savedData = this.formPersistenceService.loadFormData(tabConfig);
  }

  /**
   * Limpia todos los datos de persistencia de emergencias
   */
  clearAllEmergencyData(): void {
    // Limpiar todas las pestañas
    for (let i = 0; i < this.formularios.length; i++) {
      const tabConfig: FormPersistenceConfig = {
        ...this.persistenceConfig,
        key: `${this.persistenceConfig.key}_tab_${i}`
      };
      this.formPersistenceService.clearFormData(tabConfig);
    }
    
    // Limpiar datos principales
    this.formPersistenceService.clearFormData(this.persistenceConfig);
    
    // NUEVO: Limpiar la estructura de formularios múltiples
    this.formPersistenceService.clearFormData(this.tabsStructureConfig);
    
    // Reiniciar a la estructura por defecto
    this.formularios = [{ 
      tipo: 'Emergencia Principal', 
      id: 1,
      formData: null,
      selectedFiles: [],
      esTurnoSinConvenio: false
    }];
    this.selectedIndex = 0;
    
    // Recrear el formulario
    this.createForm();
    
    this.notificationService.success('Borradores Eliminados', 'Todos los borradores han sido eliminados correctamente.');
  }

  /**
   * Configura la persistencia automática usando el servicio centralizado
   */
  private setupFormPersistence(): void {
    // Limpiar subscripción anterior si existe
    if (this.formSubscription) {
      this.formSubscription.unsubscribe();
      console.log('🧹 Subscripción anterior limpiada');
    }

    // Limpiar timeout anterior si existe
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }

    // Configurar auto-guardado personalizado que solo guarde cuando hay datos significativos
    this.formSubscription = this.emergencyForm.valueChanges.subscribe(values => {
      // Solo guardar si hay datos significativos
      if (this.hasSignificantData(values)) {
        // Usar timeout para evitar llamadas excesivas
        if (this.autoSaveTimeout) {
          clearTimeout(this.autoSaveTimeout);
        }
        
        this.autoSaveTimeout = setTimeout(() => {
          this.saveCurrentFormState();
          console.log(`💾 Auto-guardado ejecutado para pestaña ${this.selectedIndex} con datos significativos`);
        }, this.persistenceConfig.autoSaveDelay || 3000);
      }
    });
    
  }

  /**
   * Verifica si el formulario tiene datos significativos para guardar
   */
  private hasSignificantData(formValue: any): boolean {
    // Campos que indican que hay datos reales
    const significantFields = [
      'quienInforma', 
      'ubicacion', 
      'tipoEmergencia', 
      'horaReporte', 
      'horaSalida',
      'horaRegresoEstacion'
    ];

    return significantFields.some(field => {
      const value = formValue[field];
      return value && value.toString().trim() !== '';
    });
  }

  /**
   * Normaliza los datos del formulario para evitar errores de tipo al restaurar
   */
  private normalizeFormData(savedData: any): any {
    if (!savedData) return {};

    const normalized = { ...savedData };

    // Campos que deben ser arrays para selección múltiple
    const multiSelectFields = ['vehiculo', 'unidades', 'guardia'];
    
    // Campos que deben ser strings
    const stringFields = [
      'quienInforma', 'ubicacion', 'tipoEmergencia', 'numeroTurno',
      'horaReporte', 'horaReporteDescripcion',
      'horaSalida', 'horaSalidaDescripcion',
      'horaLlegadaEscena', 'horaLlegadaEscenaDescripcion',
      'horaLlegadaHospital', 'horaLlegadaHospitalDescripcion',
      'horaRegresoEstacion', 'horaRegresoEstacionDescripcion'
    ];

    // Campos que deben ser booleanos
    const booleanFields = ['sinConvenio', 'esTurnoSinConvenio'];

    // Normalizar campos de selección múltiple
    multiSelectFields.forEach(field => {
      if (normalized[field] !== undefined) {
        if (Array.isArray(normalized[field])) {
          // Ya es array, mantener
          normalized[field] = normalized[field];
        } else if (normalized[field] === null || normalized[field] === '') {
          // Valor vacío, convertir a array vacío
          normalized[field] = [];
        } else if (typeof normalized[field] === 'string') {
          // String, intentar parsear como JSON o convertir a array
          try {
            const parsed = JSON.parse(normalized[field]);
            normalized[field] = Array.isArray(parsed) ? parsed : [normalized[field]];
          } catch {
            // Si no se puede parsear, crear array con el valor
            normalized[field] = [normalized[field]];
          }
        } else {
          // Otro tipo, convertir a array
          normalized[field] = [normalized[field]];
        }
      }
    });

    // Normalizar campos de string
    stringFields.forEach(field => {
      if (normalized[field] !== undefined) {
        if (normalized[field] === null) {
          normalized[field] = '';
        } else {
          normalized[field] = normalized[field].toString();
        }
      }
    });

    // Normalizar campos booleanos
    booleanFields.forEach(field => {
      if (normalized[field] !== undefined) {
        if (typeof normalized[field] === 'string') {
          normalized[field] = normalized[field] === 'true';
        } else {
          normalized[field] = Boolean(normalized[field]);
        }
      }
    });

    // Manejar fechas
    if (normalized.fechaReporte) {
      try {
        normalized.fechaReporte = new Date(normalized.fechaReporte);
      } catch {
        normalized.fechaReporte = new Date();
      }
    }

    // Normalizar FormArrays (eventos adicionales/novedades)
    const formArrayFields = [
      'eventosAdicionalesSalida',
      'eventosAdicionalesLlegadaEscena', 
      'eventosAdicionalesLlegadaHospital'
    ];

    formArrayFields.forEach(field => {
      if (normalized[field] !== undefined) {
        if (Array.isArray(normalized[field])) {
          // Ya es array, validar que cada elemento tenga la estructura correcta
          normalized[field] = normalized[field].map((item: any) => {
            if (typeof item === 'object' && item !== null) {
              return {
                hora: item.hora || '',
                descripcion: item.descripcion || ''
              };
            } else {
              // Si no es un objeto válido, crear estructura por defecto
              return {
                hora: '',
                descripcion: ''
              };
            }
          });
        } else if (normalized[field] === null || normalized[field] === '') {
          // Valor vacío, convertir a array vacío
          normalized[field] = [];
        } else if (typeof normalized[field] === 'object' && normalized[field] !== null) {
          // NUEVO: Si es un objeto (probablemente un solo elemento mal serializado), convertir a array
          const singleItem = normalized[field];
          if (singleItem.hora !== undefined || singleItem.descripcion !== undefined) {
            console.warn(`Campo FormArray ${field} era un objeto, convirtiéndolo a array con un elemento:`, singleItem);
            normalized[field] = [{
              hora: singleItem.hora || '',
              descripcion: singleItem.descripcion || ''
            }];
          } else {
            console.warn(`Campo FormArray ${field} es un objeto sin estructura válida, inicializando como array vacío:`, singleItem);
            normalized[field] = [];
          }
        } else {
          // Otro tipo, convertir a array vacío para evitar errores
          console.warn(`Campo FormArray ${field} no es un array válido, inicializando como array vacío:`, normalized[field]);
          normalized[field] = [];
        }
      } else {
        // Si no existe, inicializar como array vacío
        normalized[field] = [];
      }
    });

    console.log('📋 Datos normalizados para restauración:', {
      original: savedData,
      normalized: normalized
    });

    return normalized;
  }

  /**
   * Restaura datos guardados desde el servicio de persistencia
   */
  private restoreFormDataFromPersistence(): void {
    try {
      // Intentar cargar datos de la pestaña actual
      const tabConfig: FormPersistenceConfig = {
        ...this.persistenceConfig,
        key: `${this.persistenceConfig.key}_tab_${this.selectedIndex}`
      };
      
      // Intentar cargar datos usando el servicio primero
      let savedData = this.formPersistenceService.loadFormData(tabConfig);
      
      // Si no se encuentran datos con el servicio, intentar cargar directamente
      if (!savedData) {
        try {
          const storage = tabConfig.storageType === 'sessionStorage' ? sessionStorage : localStorage;
          const directData = storage.getItem(tabConfig.key);
          if (directData) {
            const parsedData = JSON.parse(directData);
            savedData = parsedData.data;
            console.log('📥 Datos extendidos cargados directamente desde storage');
          }
        } catch (error) {
          console.error('Error al cargar datos extendidos directamente:', error);
        }
      }
      
      if (savedData) {
        console.log('📥 Datos encontrados para restaurar:', savedData);
        
        // ✅ VERIFICAR SI LOS DATOS SON SIGNIFICATIVOS
        if (!this.hasSignificantData(savedData)) {
          console.log('⚠️ Los datos guardados están vacíos, limpiando almacenamiento');
          this.formPersistenceService.clearFormData(tabConfig);
          return;
        }
        
        // Esperar a que el formulario esté completamente inicializado
        setTimeout(() => {
          // Restaurar FormArrays antes de hacer patchValue
          this.restoreFormArrays(savedData);
          
          // Normalizar datos antes de restaurar para evitar errores de tipo
          const normalizedData = this.normalizeFormData(savedData);
          
          // NUEVO: Restaurar IDs desde nombres si es necesario
          this.restoreIdsFromNames(normalizedData);
          
          // Restaurar datos del formulario con emitEvent: true para activar change detection
          this.emergencyForm.patchValue(normalizedData, { emitEvent: true });
          
          // Forzar detección de cambios
          this.emergencyForm.markAsDirty();
          this.emergencyForm.updateValueAndValidity();
          
          // Restaurar estado adicional
          if (savedData.esTurnoSinConvenio !== undefined) {
            this.esTurnoSinConvenio = savedData.esTurnoSinConvenio;
            // Actualizar el checkbox manualmente si es necesario
            const sinConvenioControl = this.emergencyForm.get('sinConvenio');
            if (sinConvenioControl) {
              sinConvenioControl.setValue(savedData.esTurnoSinConvenio, { emitEvent: true });
            }
          }
          
          // Restaurar metadatos de archivos si existen
          if (savedData.selectedFiles && Array.isArray(savedData.selectedFiles)) {
            console.log('📁 Archivos previamente seleccionados:', savedData.selectedFiles);
            this.notificationService.info(
              'Archivos Detectados',
              `Se encontraron ${savedData.selectedFiles.length} archivos previamente seleccionados. Deberás volver a seleccionarlos.`,
              { duration: 5000 }
            );
          }
          
          // Forzar actualización visual múltiple para asegurar visualización
          this.forceFormUpdate();
          
          // Segunda actualización después de un momento
          setTimeout(() => {
            this.forceFormUpdate();
          }, 100);
          
          console.log('✅ Datos de emergencia restaurados y mostrados');
          console.log('📋 Estado final del formulario:', this.emergencyForm.value);
          this.notificationService.success('Borrador Restaurado', 'El borrador de emergencia ha sido restaurado correctamente.');
        }, 300); // Aumentar el tiempo de espera para asegurar inicialización completa
      } else {
        console.log('ℹ️ No hay datos guardados para restaurar en esta pestaña');
      }
    } catch (error) {
      console.error('Error al restaurar datos de persistencia:', error);
    }
  }

  /**
   * Limpia los datos de persistencia de la pestaña actual
   */
  private clearCurrentTabPersistence(): void {
    const tabConfig: FormPersistenceConfig = {
      ...this.persistenceConfig,
      key: `${this.persistenceConfig.key}_tab_${this.selectedIndex}`
    };
    
    // Limpiar usando el servicio
    this.formPersistenceService.clearFormData(tabConfig);
    
    // También limpiar directamente por seguridad
    try {
      const storage = tabConfig.storageType === 'sessionStorage' ? sessionStorage : localStorage;
      storage.removeItem(tabConfig.key);
    } catch (error) {
      console.error('Error al limpiar datos extendidos directamente:', error);
    }
    
    console.log(`🗑️ Datos de persistencia limpiados para pestaña ${this.selectedIndex}`);
  }

  /**
   * Fuerza la actualización visual de todos los controles del formulario
   */
  private forceFormUpdate(): void {
    // Forzar actualización de todos los controles
    Object.keys(this.emergencyForm.controls).forEach(key => {
      const control = this.emergencyForm.get(key);
      if (control) {
        control.markAsTouched();
        control.updateValueAndValidity();
      }
    });

    // Forzar actualización de FormArrays
    const formArrays = ['eventosAdicionalesSalida', 'eventosAdicionalesLlegadaEscena', 'eventosAdicionalesLlegadaHospital'];
    formArrays.forEach(arrayName => {
      const formArray = this.emergencyForm.get(arrayName) as FormArray;
      if (formArray) {
        formArray.controls.forEach(control => {
          control.markAsTouched();
          control.updateValueAndValidity();
        });
      }
    });

    // Forzar detección de cambios de Angular
    this.cdr.detectChanges();
    
    // Marcar para verificación en el próximo ciclo
    this.cdr.markForCheck();

    console.log('🔄 Actualización visual del formulario forzada con ChangeDetectorRef');
  }

  /**
   * NUEVO: Guarda la estructura de formularios múltiples en localStorage
   */
  private saveFormulariesStructure(): void {
    try {
      const structureData = {
        formularios: this.formularios.map(form => ({
          tipo: form.tipo,
          id: form.id,
          esTurnoSinConvenio: form.esTurnoSinConvenio || false
        })),
        selectedIndex: this.selectedIndex,
        timestamp: new Date().toISOString()
      };

      // Crear un FormGroup temporal para usar el servicio de persistencia
      const tempForm = this.fb.group({ structureData: [structureData] });
      
      this.formPersistenceService.saveFormData(tempForm, this.tabsStructureConfig);
      
      console.log('📂 Estructura de formularios múltiples guardada:', structureData);
    } catch (error) {
      console.error('❌ Error al guardar estructura de formularios:', error);
    }
  }

  /**
   * NUEVO: Restaura la estructura de formularios múltiples desde localStorage
   * @returns true si restauró múltiples formularios, false si no había datos guardados
   */
  private restoreFormulariesStructure(): boolean {
    try {
      const savedStructure = this.formPersistenceService.loadFormData(this.tabsStructureConfig);
      
      if (savedStructure && savedStructure.structureData) {
        const structureData = savedStructure.structureData;
        
        if (structureData.formularios && Array.isArray(structureData.formularios) && structureData.formularios.length > 0) {
          // Restaurar la estructura de formularios
          this.formularios = structureData.formularios.map((savedForm: any) => ({
            tipo: savedForm.tipo || 'Nueva Emergencia',
            id: savedForm.id || Date.now(),
            formData: null, // Se restaurará individualmente
            selectedFiles: [],
            esTurnoSinConvenio: savedForm.esTurnoSinConvenio || false
          }));

          // Restaurar el índice seleccionado
          this.selectedIndex = structureData.selectedIndex || 0;
          
          // Validar que el índice sea válido
          if (this.selectedIndex >= this.formularios.length) {
            this.selectedIndex = this.formularios.length - 1;
          }

          // NUEVO: Restaurar el contenido de todos los formularios
          this.restoreAllFormulariesContent();

          console.log('📂 Estructura de formularios múltiples restaurada:', {
            formularios: this.formularios.length,
            selectedIndex: this.selectedIndex
          });

          this.notificationService.success(
            'Formularios Restaurados',
            `Se restauraron ${this.formularios.length} formulario(s) de emergencia correctamente.`,
            { duration: 4000 }
          );
          
          return true; // Se restauraron múltiples formularios
        } else {
          console.log('ℹ️ No hay estructura de formularios múltiples para restaurar');
          return false; // No había estructura guardada
        }
      } else {
        console.log('ℹ️ No se encontró estructura guardada de formularios múltiples');
        return false; // No había datos guardados
      }
    } catch (error) {
      console.error('❌ Error al restaurar estructura de formularios:', error);
      // En caso de error, mantener la estructura por defecto
      this.formularios = [{ 
        tipo: 'Emergencia Principal', 
        id: 1,
        formData: null,
        selectedFiles: [],
        esTurnoSinConvenio: false
      }];
      this.selectedIndex = 0;
      return false; // Error, no se restauró
    }
  }

  /**
   * NUEVO: Restaura el contenido guardado de todos los formularios
   */
  private restoreAllFormulariesContent(): void {
    console.log('🔄 Iniciando restauración de contenido para todos los formularios...');
    
    // Restaurar contenido de cada formulario en memoria
    for (let i = 0; i < this.formularios.length; i++) {
      const tabConfig: FormPersistenceConfig = {
        ...this.persistenceConfig,
        key: `${this.persistenceConfig.key}_tab_${i}`
      };
      
      try {
        const savedFormData = this.formPersistenceService.loadFormData(tabConfig);
        
        if (savedFormData && this.hasSignificantData(savedFormData)) {
          // Guardar el contenido en el objeto formulario
          this.formularios[i].formData = savedFormData;
          
          // Restaurar estado adicional
          if (savedFormData.esTurnoSinConvenio !== undefined) {
            this.formularios[i].esTurnoSinConvenio = savedFormData.esTurnoSinConvenio;
          }
          
          console.log(`📋 Contenido restaurado para formulario ${i}:`, this.formularios[i].tipo);
        } else {
          console.log(`ℹ️ No hay contenido significativo para restaurar en formulario ${i}`);
        }
      } catch (error) {
        console.error(`❌ Error al restaurar contenido del formulario ${i}:`, error);
      }
    }
    
    // Después de restaurar todos los contenidos, cargar el formulario activo
    setTimeout(() => {
      this.restoreFormState(this.selectedIndex);
      console.log('✅ Restauración completa de todos los formularios finalizada');
    }, 100);
  }
}