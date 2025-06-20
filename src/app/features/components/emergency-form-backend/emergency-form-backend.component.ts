import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
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
    MatSnackBarModule,
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
  
  // Personal ocupado globalmente como Unidades de Respuesta
  private globalOccupiedUnits: Set<number> = new Set();
  
  // Vehículos ocupados globalmente en todas las emergencias
  private globalOccupiedVehicles: Set<number> = new Set();

  constructor(
    private fb: FormBuilder,
    private emergencyService: EmergencyService,
    private emergencyReportLegacyService: EmergencyReportLegacyService,
    private emergencyDataService: EmergencyDataService,
    private authService: AuthService,
    private vehiclesService: VehiclesService,
    private snackBar: MatSnackBar,
    private router: Router
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
        console.log('Vehículos disponibles cargados:', this.availableVehicles);
      },
      error: (error) => {
        console.error('Error al cargar vehículos:', error);
        this.snackBar.open('Error al cargar vehículos disponibles', 'Cerrar', { duration: 3000 });
      }
    });
  }

  loadAvailablePersonnel(): void {
    this.emergencyDataService.getPersonalDisponible().subscribe({
      next: (personnel) => {
        this.personalDisponible = personnel;
        console.log('Personal disponible cargado:', this.personalDisponible);
      },
      error: (error) => {
        console.error('Error al cargar personal:', error);
        this.snackBar.open('Error al cargar personal disponible', 'Cerrar', { duration: 3000 });
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

    // Listener para guardar automáticamente cuando cambien los valores
    this.emergencyForm.valueChanges.subscribe(() => {
      // Usar timeout para evitar llamadas excesivas
      if (this.autoSaveTimeout) {
        clearTimeout(this.autoSaveTimeout);
      }
      this.autoSaveTimeout = setTimeout(() => {
        // Solo guardar si el formulario tiene datos significativos
        const formValue = this.emergencyForm.value;
        if (formValue.quienInforma || formValue.ubicacion || formValue.tipoEmergencia) {
          this.saveCurrentFormState();
        }
      }, 3000); // Guardar después de 3 segundos de inactividad
    });
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
        console.log('Tipos de emergencia cargados desde backend:', this.emergencyTypes);
        console.log('Tipos mapeados para compatibilidad:', this.tiposEmergencia);
      },
      error: (error) => {
        console.error('Error loading emergency types:', error);
        this.snackBar.open('Error al cargar tipos de emergencia del backend', 'Cerrar', { duration: 3000 });
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
      this.snackBar.open('Solo se permiten archivos JPG, JPEG y PNG', 'Cerrar', { duration: 3000 });
      return false;
    }
    
    if (file.size > maxSize) {
      this.snackBar.open('El archivo no puede ser mayor a 5MB', 'Cerrar', { duration: 3000 });
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

  formatSelectedPersonnelNames(guardiaIds: number[] | number | string): string {
    if (!guardiaIds) return '';
    
    const ids = Array.isArray(guardiaIds) ? guardiaIds : [guardiaIds];
    return ids.map(id => {
      const person = this.personalDisponible.find(p => p.personalId === Number(id));
      return person ? `${person.rango} ${person.nombre}` : `ID: ${id}`;
    }).join(', ');
  }

  // Métodos para gestión global de personal ocupado

  /**
   * Actualiza el estado global de personal ocupado como Unidades de Respuesta
   */
  private updateGlobalOccupiedUnits(): void {
    this.globalOccupiedUnits.clear();
    
    // Recorrer todos los formularios y recopilar las unidades ocupadas
    this.formularios.forEach((form, index) => {
      if (form.formData && form.formData.unidades) {
        const unidades = Array.isArray(form.formData.unidades) ? form.formData.unidades : [];
        unidades.forEach((id: number) => this.globalOccupiedUnits.add(id));
      }
    });
    
    // También incluir las unidades del formulario actual si no está guardado aún
    const currentUnidades = this.emergencyForm.get('unidades')?.value || [];
    currentUnidades.forEach((id: number) => this.globalOccupiedUnits.add(id));
  }

  /**
   * Verifica si una persona está ocupada como Unidad de Respuesta en otro formulario
   */
  isPersonOccupiedInOtherForm(personalId: number): boolean {
    // Actualizar el estado global
    this.updateGlobalOccupiedUnits();
    
    // Verificar si está ocupado en otro formulario (no en el actual)
    const currentFormUnidades = this.emergencyForm.get('unidades')?.value || [];
    
    // Si está en el set global pero NO en el formulario actual, está ocupado en otro formulario
    return this.globalOccupiedUnits.has(personalId) && !currentFormUnidades.includes(personalId);
  }

  /**
   * Obtiene el número del formulario donde está ocupada una persona
   */
  getFormNumberWherePersonIsOccupied(personalId: number): number | null {
    for (let i = 0; i < this.formularios.length; i++) {
      const form = this.formularios[i];
      if (form.formData && form.formData.unidades) {
        const unidades = Array.isArray(form.formData.unidades) ? form.formData.unidades : [];
        if (unidades.includes(personalId) && i !== this.selectedIndex) {
          return i + 1; // +1 porque los formularios se muestran desde 1
        }
      }
    }
    return null;
  }

  // Métodos para gestión global de vehículos ocupados

  /**
   * Actualiza el estado global de vehículos ocupados
   */
  private updateGlobalOccupiedVehicles(): void {
    this.globalOccupiedVehicles.clear();
    
    // Recorrer todos los formularios y recopilar los vehículos ocupados
    this.formularios.forEach((form, index) => {
      if (form.formData && form.formData.vehiculo) {
        const vehiculos = Array.isArray(form.formData.vehiculo) ? form.formData.vehiculo : [form.formData.vehiculo];
        vehiculos.forEach((id: number) => this.globalOccupiedVehicles.add(id));
      }
    });
    
    // También incluir los vehículos del formulario actual si no está guardado aún
    const currentVehiculos = this.emergencyForm.get('vehiculo')?.value || [];
    const vehiculosArray = Array.isArray(currentVehiculos) ? currentVehiculos : [currentVehiculos];
    vehiculosArray.forEach((id: number) => this.globalOccupiedVehicles.add(id));
  }

  /**
   * Verifica si un vehículo está ocupado en otro formulario
   */
  isVehicleOccupiedInOtherForm(vehicleId: number): boolean {
    // Actualizar el estado global
    this.updateGlobalOccupiedVehicles();
    
    // Verificar si está ocupado en otro formulario (no en el actual)
    const currentFormVehiculos = this.emergencyForm.get('vehiculo')?.value || [];
    const vehiculosArray = Array.isArray(currentFormVehiculos) ? currentFormVehiculos : [currentFormVehiculos];
    
    // Si está en el set global pero NO en el formulario actual, está ocupado en otro formulario
    return this.globalOccupiedVehicles.has(vehicleId) && !vehiculosArray.includes(vehicleId);
  }

  /**
   * Obtiene el número del formulario donde está ocupado un vehículo
   */
  getFormNumberWhereVehicleIsOccupied(vehicleId: number): number | null {
    for (let i = 0; i < this.formularios.length; i++) {
      const form = this.formularios[i];
      if (form.formData && form.formData.vehiculo) {
        const vehiculos = Array.isArray(form.formData.vehiculo) ? form.formData.vehiculo : [form.formData.vehiculo];
        if (vehiculos.includes(vehicleId) && i !== this.selectedIndex) {
          return i + 1; // +1 porque los formularios se muestran desde 1
        }
      }
    }
    return null;
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

  private isUpdatingVehicles = false; // Bandera para evitar recursión

  onVehicleSelectionChange(selectedIds: number[]): void {
    if (this.isUpdatingVehicles) return; // Evitar recursión
    
    // Verificar si algún vehículo está ocupado en otro formulario
    const occupiedVehicles = selectedIds.filter(id => this.isVehicleOccupiedInOtherForm(id));
    
    if (occupiedVehicles.length > 0) {
      this.isUpdatingVehicles = true; // Establecer bandera
      
      // Remover vehículos ocupados de la selección
      const availableVehicles = selectedIds.filter(id => !this.isVehicleOccupiedInOtherForm(id));
      
      // Actualizar el formulario con solo los vehículos disponibles
      this.emergencyForm.get('vehiculo')?.setValue(availableVehicles, { emitEvent: false });
      
      // Mostrar mensaje de error para cada vehículo ocupado
      occupiedVehicles.forEach(vehicleId => {
        const vehicle = this.availableVehicles.find(v => v.vehicleId === vehicleId);
        const formNumber = this.getFormNumberWhereVehicleIsOccupied(vehicleId);
        this.snackBar.open(
          `El vehículo "${vehicle?.name || 'ID: ' + vehicleId}" ya está asignado a la Emergencia #${formNumber}`, 
          'Cerrar', 
          { duration: 4000 }
        );
      });
      
      this.isUpdatingVehicles = false; // Limpiar bandera
    }
    
    // Actualizar estado global después del cambio
    this.updateGlobalOccupiedVehicles();
  }

  onUnidadChange(event: any, personalId: number): void {
    const unidades = this.emergencyForm.get('unidades')?.value || [];
    const guardia = this.emergencyForm.get('guardia')?.value || [];
    
    if (event.checked) {
      // Verificar que no esté ya en guardia del mismo formulario
      if (guardia.includes(personalId)) {
        this.snackBar.open('Esta persona ya está seleccionada como Personal de Guardia en este formulario', 'Cerrar', { duration: 3000 });
        return;
      }
      
      // Verificar que no esté ocupado en otro formulario como Unidad de Respuesta
      if (this.isPersonOccupiedInOtherForm(personalId)) {
        const formNumber = this.getFormNumberWherePersonIsOccupied(personalId);
        this.snackBar.open(
          `Esta persona ya está asignada como Unidad de Respuesta en la Emergencia #${formNumber}`, 
          'Cerrar', 
          { duration: 4000 }
        );
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
    
    // Actualizar estado global después del cambio
    this.updateGlobalOccupiedUnits();
    this.updateGlobalOccupiedVehicles();
  }

  onGuardiaChange(event: any, personalId: number): void {
    const guardia = this.emergencyForm.get('guardia')?.value || [];
    const unidades = this.emergencyForm.get('unidades')?.value || [];
    
    if (event.checked) {
      // Verificar que no esté ya en unidades del mismo formulario
      if (unidades.includes(personalId)) {
        this.snackBar.open('Esta persona ya está seleccionada como Unidad de Respuesta en este formulario', 'Cerrar', { duration: 3000 });
        return;
      }
      
      // Verificar que no esté ocupado en otro formulario como Unidad de Respuesta
      if (this.isPersonOccupiedInOtherForm(personalId)) {
        const formNumber = this.getFormNumberWherePersonIsOccupied(personalId);
        this.snackBar.open(
          `Esta persona ya está asignada como Unidad de Respuesta en la Emergencia #${formNumber}. No puede ser Personal de Guardia mientras esté en campo.`, 
          'Cerrar', 
          { duration: 5000 }
        );
        return;
      }
      
      // El personal de guardia SÍ puede estar en múltiples formularios
      // ya que coordina desde la estación
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
      this.snackBar.open('Por favor complete todos los campos requeridos', 'Cerrar', { duration: 5000 });
      return;
    }
    
    console.log('onSubmit llamado manualmente');

    // Verificar autenticación antes de enviar
    if (!this.authService.isAuthenticated() || !this.authService.verifyAndRefreshSession()) {
      console.log('❌ Usuario NO autenticado o sesión expirada - redirigiendo al login');
      this.authService.logout();
      this.snackBar.open('Su sesión ha expirado. Por favor inicie sesión nuevamente.', 'Cerrar', { 
        duration: 5000,
        panelClass: ['warning-snackbar']
      });
      this.router.navigate(['/emergencias']);
      return;
    }

    // Mostrar información del token para debug
    const tokenInfo = this.authService.getTokenInfo();
    if (tokenInfo) {
      console.log('✅ Información del token:', tokenInfo);
      console.log('✅ Usuario actual:', this.authService.getCurrentUser());
      
      // Si el token está por expirar (menos de 2 minutos), mostrar advertencia
      if (tokenInfo.timeLeft < 2 * 60 * 1000) {
        this.snackBar.open('Su sesión expirará pronto. Por favor guarde su trabajo.', 'OK', { 
          duration: 10000,
          panelClass: ['warning-snackbar']
        });
      }
    }

    this.isSubmitting = true;
    this.submitSuccess = false;
    this.submitError = null;

    // Mapear datos del formulario legacy al formato del backend
    const formValues = this.emergencyForm.value;
    const turno = formValues.sinConvenio ? 'false' : (formValues.numeroTurno?.toString() || '1');
    
    // Validar datos antes de crear el objeto
    console.log('Valores del formulario:', formValues);
    console.log('Usuario ID obtenido:', this.getCurrentUserId());
    console.log('Turno procesado:', turno);

    // Validar campos críticos
    if (!formValues.tipoEmergencia) {
      this.snackBar.open('Debe seleccionar un tipo de emergencia', 'Cerrar', { duration: 3000 });
      return;
    }
    if (!formValues.quienInforma) {
      this.snackBar.open('Debe especificar quién informa', 'Cerrar', { duration: 3000 });
      return;
    }
    if (!formValues.ubicacion) {
      this.snackBar.open('Debe especificar la ubicación', 'Cerrar', { duration: 3000 });
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

    // Debug de datos antes de enviar
    console.log('Datos que se enviarán al backend:', emergencyData);
    console.log('Archivos que se enviarán:', emergencyFiles);

    // Verificar que no hay valores undefined críticos
    if (!emergencyData.informant || !emergencyData.ubication || !emergencyData.emergencyTypeId) {
      console.error('Faltan datos críticos:', {
        informant: emergencyData.informant,
        ubication: emergencyData.ubication,
        emergencyTypeId: emergencyData.emergencyTypeId
      });
      this.snackBar.open('Error: Faltan datos críticos para enviar', 'Cerrar', { duration: 5000 });
      this.isSubmitting = false;
      return;
    }

    // Enviar al backend
    this.emergencyService.createEmergency(emergencyData, emergencyFiles).subscribe({
      next: (response: any) => {
        console.log('Respuesta del backend:', response);
        this.submitSuccess = true;
        this.submitError = null;
        this.snackBar.open('✅ Emergencia guardada con éxito', 'Cerrar', { 
          duration: 4000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['success-snackbar-large']
        });

        // Cerrar la pestaña actual después de guardar exitosamente
        this.closeCurrentTabAfterSave();
      },
      error: (error: any) => {
        console.error('❌ Error completo al guardar emergencia:', error);
        console.error('❌ URL que falló:', error.url);
        console.error('❌ Status HTTP:', error.status);
        console.error('❌ Error object:', error.error);
        console.error('❌ Error message:', error.message);
        
        this.submitError = error.error?.message || 'Error desconocido al registrar la emergencia';
        
        if (error.status === 401) {
          console.log('🔒 Error 401: Token no válido o expirado - cerrando sesión automáticamente');
          this.authService.logout();
          this.snackBar.open('Su sesión ha expirado. Será redirigido al login.', 'Cerrar', { 
            duration: 3000,
            panelClass: ['warning-snackbar']
          });
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 1000);
        } else if (error.status === 403) {
          this.snackBar.open('No tiene permisos para realizar esta acción.', 'Cerrar', { duration: 5000 });
        } else if (error.status === 404) {
          this.snackBar.open('Error: Endpoint no encontrado. Verifique la configuración del servidor.', 'Cerrar', { duration: 5000 });
        } else if (error.status === 0) {
          this.snackBar.open('Error de conexión: No se puede conectar al servidor.', 'Cerrar', { duration: 5000 });
        } else {
          this.snackBar.open(`Error ${error.status}: ${this.submitError}`, 'Cerrar', { duration: 5000 });
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

    // Cambiar a la nueva pestaña
    setTimeout(() => {
      this.selectedIndex = this.formularios.length - 1;
      // Actualizar estado global de personal ocupado y vehículos
      this.updateGlobalOccupiedUnits();
      this.updateGlobalOccupiedVehicles();
    });
  }

  // Guardar el estado actual del formulario
  saveCurrentFormState(): void {
    const currentFormulario = this.formularios[this.selectedIndex];
    if (currentFormulario && this.emergencyForm) {
      // Usar el ID único del formulario en lugar del índice
      currentFormulario.formData = JSON.parse(JSON.stringify(this.emergencyForm.value));
      currentFormulario.selectedFiles = [...this.selectedFiles];
      currentFormulario.esTurnoSinConvenio = this.esTurnoSinConvenio;
    }
  }

  // Restaurar el estado del formulario
  restoreFormState(index: number): void {
    const formulario = this.formularios[index];
    
    if (formulario && formulario.formData) {
      // Primero recrear el formulario limpio
      this.createForm();
      
      // Restaurar los FormArrays antes de hacer patchValue
      this.restoreFormArrays(formulario.formData);
      
      // Restaurar los datos del formulario
      this.emergencyForm.patchValue(formulario.formData);
      
      // Restaurar archivos seleccionados
      this.selectedFiles = formulario.selectedFiles || [];
      
      // Restaurar estado del turno
      this.esTurnoSinConvenio = formulario.esTurnoSinConvenio || false;
    } else {
      // Si no hay datos guardados, limpiar el formulario
      this.resetForm();
      this.createForm();
    }
  }

  // Restaurar FormArrays específicos
  restoreFormArrays(formData: any): void {
    // Limpiar FormArrays actuales
    while (this.eventosAdicionalesSalida.length !== 0) {
      this.eventosAdicionalesSalida.removeAt(0);
    }
    while (this.eventosAdicionalesLlegadaEscena.length !== 0) {
      this.eventosAdicionalesLlegadaEscena.removeAt(0);
    }
    while (this.eventosAdicionalesLlegadaHospital.length !== 0) {
      this.eventosAdicionalesLlegadaHospital.removeAt(0);
    }

    // Restaurar eventos adicionales de salida
    if (formData.eventosAdicionalesSalida && Array.isArray(formData.eventosAdicionalesSalida) && formData.eventosAdicionalesSalida.length > 0) {
      formData.eventosAdicionalesSalida.forEach((evento: any) => {
        this.eventosAdicionalesSalida.push(this.fb.group({
          hora: [evento.hora || '', Validators.required],
          descripcion: [evento.descripcion || '']
        }));
      });
    }

    // Restaurar eventos adicionales de llegada a escena
    if (formData.eventosAdicionalesLlegadaEscena && Array.isArray(formData.eventosAdicionalesLlegadaEscena) && formData.eventosAdicionalesLlegadaEscena.length > 0) {
      formData.eventosAdicionalesLlegadaEscena.forEach((evento: any) => {
        this.eventosAdicionalesLlegadaEscena.push(this.fb.group({
          hora: [evento.hora || '', Validators.required],
          descripcion: [evento.descripcion || '']
        }));
      });
    }

    // Restaurar eventos adicionales de llegada al hospital
    if (formData.eventosAdicionalesLlegadaHospital && Array.isArray(formData.eventosAdicionalesLlegadaHospital) && formData.eventosAdicionalesLlegadaHospital.length > 0) {
      formData.eventosAdicionalesLlegadaHospital.forEach((evento: any) => {
        this.eventosAdicionalesLlegadaHospital.push(this.fb.group({
          hora: [evento.hora || '', Validators.required],
          descripcion: [evento.descripcion || '']
        }));
      });
    }
  }

  removeFormulario(index: number, event: Event): void {
    event.stopPropagation();
    if (this.formularios.length > 1) {
      // Mostrar confirmación antes de eliminar
      if (confirm(`¿Estás seguro de que quieres cerrar "${this.formularios[index].tipo}"? Los datos no guardados se perderán.`)) {
        
        // Guardar el estado actual antes de eliminar
        this.saveCurrentFormState();
        
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
        
        // Restaurar los datos de la nueva pestaña activa
        this.restoreFormState(this.selectedIndex);
        

      }
    } else {
      // No se puede eliminar el último formulario
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
    
    // Restaurar el estado del formulario de la nueva pestaña
    this.restoreFormState(newIndex);
    
    // Actualizar estado global de personal ocupado y vehículos
    this.updateGlobalOccupiedUnits();
    this.updateGlobalOccupiedVehicles();
  }

  // Nuevo método para manejar el cambio de pestañas desde el template
  onTabChange(newIndex: number): void {
    if (this.selectedIndex !== newIndex) {
      // Guardar estado actual
      this.saveCurrentFormState();
      
      // Cambiar índice
      const oldIndex = this.selectedIndex;
      this.selectedIndex = newIndex;
      
      // Restaurar estado del nuevo formulario
      this.restoreFormState(newIndex);
      
      // Actualizar estado global de personal ocupado y vehículos
      this.updateGlobalOccupiedUnits();
      this.updateGlobalOccupiedVehicles();
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
  }

  removeEventoAdicionalSalida(index: number): void {
    this.eventosAdicionalesSalida.removeAt(index);
  }

  addEventoAdicionalLlegadaEscena(): void {
    this.eventosAdicionalesLlegadaEscena.push(this.fb.group({
      hora: ['', Validators.required],
      descripcion: ['']
    }));
  }

  removeEventoAdicionalLlegadaEscena(index: number): void {
    this.eventosAdicionalesLlegadaEscena.removeAt(index);
  }

  addEventoAdicionalLlegadaHospital(): void {
    this.eventosAdicionalesLlegadaHospital.push(this.fb.group({
      hora: ['', Validators.required],
      descripcion: ['']
    }));
  }

  removeEventoAdicionalLlegadaHospital(index: number): void {
    this.eventosAdicionalesLlegadaHospital.removeAt(index);
  }

  ngOnDestroy(): void {
    // Guardar el estado actual antes de destruir
    this.saveCurrentFormState();
    
    // Limpiar timeout de auto-guardado
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
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
      console.warn('formatDateForBackend: fecha vacía, usando fecha actual');
      return new Date().toISOString().split('T')[0];
    }
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) {
        console.warn('formatDateForBackend: fecha inválida, usando fecha actual');
        return new Date().toISOString().split('T')[0];
      }
      return d.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return new Date().toISOString().split('T')[0];
    }
  }

  private formatDateTimeForBackend(date: any, time: string): string {
    if (!date || !time) {
      console.warn('formatDateTimeForBackend: fecha o hora vacía');
      return new Date().toISOString();
    }
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) {
        console.warn('formatDateTimeForBackend: fecha inválida');
        return new Date().toISOString();
      }
      const [hours, minutes] = time.split(':');
      dateObj.setHours(parseInt(hours) || 0, parseInt(minutes) || 0, 0, 0);
      return dateObj.toISOString();
    } catch (error) {
      console.error('Error formateando fecha-hora:', error);
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
}