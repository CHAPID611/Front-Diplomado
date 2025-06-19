import { Component, OnInit, OnDestroy } from '@angular/core';
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

import { EmergencyService } from '../../../core/services/emergency-report.service';
import { EmergencyReportLegacyService } from '../../../core/services/emergency-report-legacy.service';
import { PersonalDisponible, VehiculoDisponible } from '../../../core/services/emergency-data.service';
import { Emergency, EmergencyType, EmergencyFile, TipoEmergencia } from '../../../core/interfaces/emergency.interface';
import { AuthService } from '../../../core/services/auth.service';

interface Formulario {
  tipo: string;
  id: number;
  formData?: any; // Para guardar los datos del formulario
  selectedFiles?: File[]; // Para guardar archivos de cada formulario
  esTurnoSinConvenio?: boolean; // Para guardar el estado del turno
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
  emergencyForm!: FormGroup;
  emergencyTypes: EmergencyType[] = [];
  tiposEmergencia: TipoEmergencia[] = [];
  personalDisponible: PersonalDisponible[] = [];
  vehiculosDisponibles: VehiculoDisponible[] = [];
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

  constructor(
    private fb: FormBuilder,
    private emergencyService: EmergencyService,
    private emergencyReportLegacyService: EmergencyReportLegacyService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.createForm();
  }

  ngOnInit(): void {
    this.loadEmergencyTypes();
    this.loadFormData();
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

    // Cargar vehículos disponibles
    this.emergencyReportLegacyService.getVehiculosDisponibles().subscribe((vehiculos: VehiculoDisponible[]) => {
      this.vehiculosDisponibles = vehiculos;
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
    
    console.log('Tipo de emergencia seleccionado:', tipoNombre);
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
      return unidades.join(', ');
    }
    return 'Ninguna seleccionada';
  }

  getGuardiaSeleccionada(): string {
    const guardia = this.emergencyForm.get('guardia')?.value || [];
    return guardia.length > 0 ? guardia.join(', ') : 'Ninguna seleccionada';
  }

  isUnidadSelected(nombre: string): boolean {
    const unidades = this.emergencyForm.get('unidades')?.value || [];
    return unidades.includes(nombre);
  }

  isGuardiaSelected(nombre: string): boolean {
    const guardia = this.emergencyForm.get('guardia')?.value || [];
    return guardia.includes(nombre);
  }

  onUnidadChange(event: any, nombre: string): void {
    const unidades = this.emergencyForm.get('unidades')?.value || [];
    if (event.checked) {
      unidades.push(nombre);
    } else {
      const index = unidades.indexOf(nombre);
      if (index > -1) {
        unidades.splice(index, 1);
      }
    }
    this.emergencyForm.get('unidades')?.setValue(unidades);
    this.emergencyForm.get('unidades')?.markAsTouched();
  }

  onGuardiaChange(event: any, nombre: string): void {
    const guardia = this.emergencyForm.get('guardia')?.value || [];
    if (event.checked) {
      guardia.push(nombre);
    } else {
      const index = guardia.indexOf(nombre);
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
    if (!this.authService.isAuthenticated()) {
      this.snackBar.open('No está autenticado. Por favor inicie sesión nuevamente.', 'Cerrar', { duration: 5000 });
      return;
    }

    const token = localStorage.getItem('auth_token');
    console.log('Token disponible:', token ? 'Sí' : 'No');
    console.log('Usuario actual:', this.authService.getCurrentUser());

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
      emergencyTypeId: Number(formValues.tipoEmergencia) || 1, // Asegurar que sea número válido
      emergencyDate: this.formatDateForBackend(formValues.fechaReporte || new Date()),
      informant: formValues.quienInforma || '',
      vehicle: formValues.vehiculo || '',
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
      unitsResponse: Array.isArray(formValues.unidades) ? formValues.unidades.join(', ') : (formValues.unidades || ''),
      guardPersonnel: Array.isArray(formValues.guardia) ? formValues.guardia.join(', ') : (formValues.guardia || ''),
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
        
        // Mostrar alerta de éxito con mejor estilo
        setTimeout(() => {
          alert('🚨 ¡EMERGENCIA GUARDADA CON ÉXITO! 🚨\n\n✅ La emergencia ha sido registrada correctamente en el sistema.\n\n📋 ID de registro: ' + (response?.id || 'Generado'));
        }, 100);
        
        this.snackBar.open('Emergencia registrada exitosamente en el backend', 'Cerrar', { 
          duration: 5000,
          panelClass: ['success-snackbar']
        });
        this.resetForm();
      },
      error: (error: any) => {
        console.error('Error completo:', error);
        console.error('URL que falló:', error.url);
        console.error('Status:', error.status);
        console.error('Error object:', error.error);
        
        this.submitError = error.message || 'Error desconocido';
        
        if (error.status === 401) {
          this.snackBar.open('Error de autenticación. Por favor inicie sesión nuevamente.', 'Cerrar', { duration: 5000 });
        } else if (error.status === 404) {
          this.snackBar.open('Error: Endpoint no encontrado. Verifique la configuración del servidor.', 'Cerrar', { duration: 5000 });
        } else {
          this.snackBar.open(`Error: ${this.submitError}`, 'Cerrar', { duration: 5000 });
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
    // this.vehiculosDisponibles = []; // NO hacer esto
    // this.emergencyTypes = []; // NO hacer esto
  }

  // Métodos para compatibilidad con el diseño original
  addNewEmergencyForm(): void {
    const newId = this.formularios.length + 1;
    
    // Primero guardar el estado del formulario actual
    this.saveCurrentFormState();
    
    // Agregar el nuevo formulario
    this.formularios.push({ 
      tipo: `Nueva Emergencia ${newId}`, 
      id: newId,
      formData: null, // Nuevo formulario sin datos
      selectedFiles: [],
      esTurnoSinConvenio: false
    });
    
    // Cambiar automáticamente a la nueva pestaña
    this.selectedIndex = this.formularios.length - 1;
    
    // Limpiar completamente el formulario SOLO para el nuevo
    this.resetForm();
    
    // Recrear el formulario para asegurar que esté completamente limpio
    this.createForm();
    
    // Mostrar notificación
    this.snackBar.open(`Nuevo formulario de emergencia creado`, 'Cerrar', {
      duration: 2000,
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }

  // Guardar el estado actual del formulario
  saveCurrentFormState(): void {
    if (this.formularios[this.selectedIndex] && this.emergencyForm) {
      this.formularios[this.selectedIndex].formData = JSON.parse(JSON.stringify(this.emergencyForm.value)); // Deep copy
      this.formularios[this.selectedIndex].selectedFiles = [...this.selectedFiles];
      this.formularios[this.selectedIndex].esTurnoSinConvenio = this.esTurnoSinConvenio;
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
        this.formularios.splice(index, 1);
        
        // Ajustar el índice seleccionado
        if (this.selectedIndex >= this.formularios.length) {
          this.selectedIndex = this.formularios.length - 1;
        } else if (this.selectedIndex > index) {
          this.selectedIndex--;
        }
        
        // Limpiar y recrear el formulario para la pestaña actual
        this.resetForm();
        this.createForm();
        
        this.snackBar.open('Formulario eliminado', 'Cerrar', {
          duration: 2000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });
      }
    } else {
      this.snackBar.open('No puedes eliminar el último formulario', 'Cerrar', {
        duration: 2000,
        horizontalPosition: 'right',
        verticalPosition: 'top'
      });
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
      
      // Mostrar notificación
      this.snackBar.open(`Hora actual establecida: ${currentTime}`, 'Cerrar', {
        duration: 2000,
        horizontalPosition: 'right',
        verticalPosition: 'top'
      });
    }
  }
}
