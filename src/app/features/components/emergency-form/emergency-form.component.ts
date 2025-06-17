import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatDividerModule } from '@angular/material/divider';
import { MatStepperModule } from '@angular/material/stepper';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';

import { EmergencyReportService } from '../../../core/services/emergency-report.service';
import { EmergencyReport, TipoEmergencia, PersonalDisponible, VehiculoDisponible, EvidenciaFotograficaData } from '../../../core/interfaces/emergency-report.interface';

interface EvidenciaFotografica {
  id: string;
  file: File;
  preview: string;
  descripcion: string;
  fecha: Date;
}

interface FormularioEmergencia {
  id: string;
  tipo: string;
  form: FormGroup;
  evidenciasFotograficas: EvidenciaFotografica[];
}

@Component({
  selector: 'app-emergency-form',
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
    MatIconModule,
    MatCheckboxModule,
    MatRadioModule,
    MatDividerModule,
    MatStepperModule,
    MatSnackBarModule,
    MatDialogModule,
    MatProgressBarModule,
    MatTabsModule,
    MatTooltipModule
  ],
  templateUrl: './emergency-form.component.html',
  styleUrls: ['./emergency-form.component.css']
})
export class EmergencyFormComponent implements OnInit {
  @Input() parentForm!: FormGroup;
  @Output() tipoChange = new EventEmitter<string>();
  @Output() addNewForm = new EventEmitter<void>();

  // Propiedades para manejar múltiples formularios
  formularios: FormularioEmergencia[] = [];
  selectedIndex = 0;
  
  // Propiedades del formulario activo
  emergencyForm!: FormGroup;
  tiposEmergencia: TipoEmergencia[] = [];
  personalDisponible: PersonalDisponible[] = [];
  vehiculosDisponibles: VehiculoDisponible[] = [];
  esTurnoSinConvenio = false;
  previewDescription = '';
  showDebugInfo = false;

  // Propiedades para evidencias fotográficas del formulario activo
  evidenciasFotograficas: EvidenciaFotografica[] = [];
  isUploading = false;
  maxFileSize = 5 * 1024 * 1024; // 5MB
  allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  minPhotos = 2;

  constructor(
    private fb: FormBuilder,
    private emergencyReportService: EmergencyReportService,
    private snackBar: MatSnackBar
  ) {
    this.createForm();
  }

  ngOnInit(): void {
    if (!this.parentForm) {
      this.createForm();
      this.parentForm = this.emergencyForm;
    }
    // Crear el primer formulario
    this.addNewEmergencyForm();
    this.loadFormData();
    this.updateShowNumeroTurno();
  }

  addNewEmergencyForm(): void {
    const id = Date.now().toString();
    this.createForm();
    const nuevoFormulario: FormularioEmergencia = {
      id,
      tipo: 'Nueva Emergencia',
      form: this.emergencyForm,
      evidenciasFotograficas: []
    };
    
    this.formularios.push(nuevoFormulario);
    this.selectedIndex = this.formularios.length - 1;
    this.switchToFormulario(this.selectedIndex);
    
    this.snackBar.open('Nuevo formulario de emergencia creado', 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  switchToFormulario(index: number): void {
    // Guardar estado del formulario actual
    if (this.formularios[this.selectedIndex]) {
      this.formularios[this.selectedIndex].evidenciasFotograficas = [...this.evidenciasFotograficas];
    }
    
    // Cambiar al nuevo formulario
    this.selectedIndex = index;
    const formularioActivo = this.formularios[index];
    this.emergencyForm = formularioActivo.form;
    this.parentForm = formularioActivo.form;
    this.evidenciasFotograficas = [...formularioActivo.evidenciasFotograficas];
    this.updateShowNumeroTurno();
  }

  onTipoEmergenciaChange(event: any): void {
    const tipoId = event.value;
    const tipoObj = this.tiposEmergencia.find(t => t.id === tipoId);
    const tipoNombre = tipoObj ? tipoObj.nombre : 'Nueva Emergencia';
    
    // Actualizar el nombre de la pestaña actual
    if (this.formularios[this.selectedIndex]) {
      this.formularios[this.selectedIndex].tipo = tipoNombre;
    }
    
    this.tipoChange.emit(tipoNombre);
  }

  removeFormulario(index: number, event: Event): void {
    event.stopPropagation();
    
    if (this.formularios.length <= 1) {
      this.snackBar.open('Debe mantener al menos un formulario abierto', 'Cerrar', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }
    
    this.formularios.splice(index, 1);
    
    // Ajustar selectedIndex si es necesario
    if (this.selectedIndex >= this.formularios.length) {
      this.selectedIndex = this.formularios.length - 1;
    } else if (this.selectedIndex > index) {
      this.selectedIndex--;
    }
    
    this.switchToFormulario(this.selectedIndex);
    
    this.snackBar.open('Formulario eliminado', 'Cerrar', {
      duration: 3000,
      panelClass: ['info-snackbar']
    });
  }

  get currentFormulario(): FormularioEmergencia {
    return this.formularios[this.selectedIndex];
  }

  // Validador personalizado para arrays que requieren al menos un elemento
  private arrayMinLengthValidator(minLength: number) {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value || !Array.isArray(value) || value.length < minLength) {
        return { required: true };
      }
      return null;
    };
  }

  createForm(): void {
    this.emergencyForm = this.fb.group({
      informacionGeneral: this.fb.group({
        fechaReporte: [new Date(), Validators.required],
        quienInforma: ['', Validators.required],
        tipoEmergencia: ['', Validators.required],
        ubicacion: ['', Validators.required],
        vehiculo: ['', Validators.required],
        sinConvenio: [false],
        numeroTurno: [1]
      }),
      cronologia: this.fb.group({
        horaReporte: ['', Validators.required],
        horaReporteDescripcion: [''],
        horaSalida: ['', Validators.required],
        horaSalidaDescripcion: [''],
        eventosAdicionalesSalida: this.fb.array([]),
        horaLlegadaEscena: ['', Validators.required],
        horaLlegadaEscenaDescripcion: [''],
        eventosAdicionalesLlegadaEscena: this.fb.array([]),
        horaLlegadaHospital: [''],
        horaLlegadaHospitalDescripcion: [''],
        eventosAdicionalesLlegadaHospital: this.fb.array([]),
        horaRegresoEstacion: ['', Validators.required],
        horaRegresoEstacionDescripcion: ['']
      }),
      personal: this.fb.group({
        unidades: [[], this.arrayMinLengthValidator(1)],
        guardia: [[], this.arrayMinLengthValidator(1)]
      }),
      evidencias: this.fb.group({
        fotografias: [[], this.arrayMinLengthValidator(this.minPhotos)]
      })
    });
    
    // Suscribirse a cambios del formulario para debug
    this.emergencyForm.valueChanges.subscribe(value => {
      console.log('Formulario cambió:', value);
    });
  }

  get informacionGeneralGroup() {
    return this.parentForm.get('informacionGeneral') as FormGroup;
  }

  get cronologiaGroup() {
    return this.parentForm.get('cronologia') as FormGroup;
  }

  get personalGroup() {
    return this.parentForm.get('personal') as FormGroup;
  }

  get evidenciasGroup() {
    return this.parentForm.get('evidencias') as FormGroup;
  }

  get eventosAdicionalesSalida() {
    return this.cronologiaGroup.get('eventosAdicionalesSalida') as FormArray;
  }
  get eventosAdicionalesLlegadaEscena() {
    return this.cronologiaGroup.get('eventosAdicionalesLlegadaEscena') as FormArray;
  }
  get eventosAdicionalesLlegadaHospital() {
    return this.cronologiaGroup.get('eventosAdicionalesLlegadaHospital') as FormArray;
  }

  loadFormData(): void {
    this.emergencyReportService.getTiposEmergencia().subscribe(tipos => {
      this.tiposEmergencia = tipos;
    });

    this.emergencyReportService.getPersonalDisponible().subscribe(personal => {
      this.personalDisponible = personal;
    });

    this.emergencyReportService.getVehiculosDisponibles().subscribe(vehiculos => {
      this.vehiculosDisponibles = vehiculos;
    });
  }

  updateShowNumeroTurno(): void {
    const sinConvenio = this.informacionGeneralGroup.get('sinConvenio')?.value;
    this.esTurnoSinConvenio = sinConvenio === true;
  }

  onSinConvenioChange(event: any): void {
    this.esTurnoSinConvenio = event.checked;
    if (this.esTurnoSinConvenio) {
      this.informacionGeneralGroup.get('numeroTurno')?.setValue(null);
    } else {
      // Si se desmarca "sin convenio", establecer 1 por defecto
      if (!this.informacionGeneralGroup.get('numeroTurno')?.value) {
        this.informacionGeneralGroup.get('numeroTurno')?.setValue(1);
      }
    }
  }

  isUnidadSelected(nombre: string): boolean {
    const unidades = this.personalGroup.get('unidades')?.value || [];
    return unidades.includes(nombre);
  }

  isGuardiaSelected(nombre: string): boolean {
    const guardia = this.personalGroup.get('guardia')?.value || [];
    return guardia.includes(nombre);
  }

  onUnidadChange(event: any, nombre: string): void {
    const unidades = this.personalGroup.get('unidades')?.value || [];
    if (event.checked) {
      unidades.push(nombre);
    } else {
      const index = unidades.indexOf(nombre);
      if (index > -1) {
        unidades.splice(index, 1);
      }
    }
    this.personalGroup.get('unidades')?.setValue(unidades);
    this.personalGroup.get('unidades')?.markAsTouched();
  }

  onGuardiaChange(event: any, nombre: string): void {
    const guardia = this.personalGroup.get('guardia')?.value || [];
    if (event.checked) {
      guardia.push(nombre);
    } else {
      const index = guardia.indexOf(nombre);
      if (index > -1) {
        guardia.splice(index, 1);
      }
    }
    this.personalGroup.get('guardia')?.setValue(guardia);
    this.personalGroup.get('guardia')?.markAsTouched();
  }

  generatePreview(): void {
    // Marcar todos los campos como touched para mostrar errores
    this.markFormGroupTouched(this.parentForm);
    
    if (this.parentForm.valid) {
      const formData = this.getFormData();
      this.previewDescription = this.emergencyReportService.generarDescripcionDetallada(formData);
    } else {
      // Mostrar errores específicos por sección
      const errores = this.getFormErrors();
      console.log('Errores del formulario:', errores);
      
      this.snackBar.open(`Faltan campos por completar. Revisa: ${errores.join(', ')}`, 'Cerrar', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else {
        control?.markAsTouched();
      }
    });
  }

  private getFormErrors(): string[] {
    const errores: string[] = [];
    
    // Verificar información general
    const infoGeneral = this.informacionGeneralGroup;
    if (infoGeneral.invalid) {
      const fechaReporte = infoGeneral.get('fechaReporte');
      const quienInforma = infoGeneral.get('quienInforma');
      const tipoEmergencia = infoGeneral.get('tipoEmergencia');
      const ubicacion = infoGeneral.get('ubicacion');
      const vehiculo = infoGeneral.get('vehiculo');
      
      if (fechaReporte?.invalid) errores.push('Fecha del reporte');
      if (quienInforma?.invalid || !quienInforma?.value?.trim()) errores.push('Quien informa');
      if (tipoEmergencia?.invalid || !tipoEmergencia?.value) errores.push('Tipo de emergencia');
      if (ubicacion?.invalid || !ubicacion?.value?.trim()) errores.push('Ubicación');
      if (vehiculo?.invalid || !vehiculo?.value) errores.push('Vehículo');
    }
    
    // Verificar cronología
    const cronologia = this.cronologiaGroup;
    if (cronologia.invalid) {
      const horaReporte = cronologia.get('horaReporte');
      const horaSalida = cronologia.get('horaSalida');
      const horaLlegadaEscena = cronologia.get('horaLlegadaEscena');
      const horaRegresoEstacion = cronologia.get('horaRegresoEstacion');
      
      if (horaReporte?.invalid || !horaReporte?.value) errores.push('Hora de reporte');
      if (horaSalida?.invalid || !horaSalida?.value) errores.push('Hora de salida');
      if (horaLlegadaEscena?.invalid || !horaLlegadaEscena?.value) errores.push('Hora de llegada a escena');
      if (horaRegresoEstacion?.invalid || !horaRegresoEstacion?.value) errores.push('Hora de regreso');
    }
    
    // Verificar personal
    const personal = this.personalGroup;
    if (personal.invalid) {
      const unidades = personal.get('unidades');
      const guardia = personal.get('guardia');
      
      if (unidades?.invalid || !unidades?.value || unidades.value.length === 0) {
        errores.push('Unidades de respuesta (debe seleccionar al menos una)');
      }
      if (guardia?.invalid || !guardia?.value || guardia.value.length === 0) {
        errores.push('Personal de guardia (debe seleccionar al menos una persona)');
      }
    }
    
    // Verificar evidencias fotográficas
    const evidencias = this.evidenciasGroup;
    if (evidencias.invalid) {
      const fotografias = evidencias.get('fotografias');
      if (fotografias?.invalid || this.evidenciasFotograficas.length < this.minPhotos) {
        errores.push(`Evidencias fotográficas (debe subir al menos ${this.minPhotos} fotografías)`);
      }
    }
    
    console.log('Errores encontrados:', errores);
    console.log('Estado del formulario:', {
      valid: this.parentForm.valid,
      infoGeneralValid: this.informacionGeneralGroup.valid,
      cronologiaValid: this.cronologiaGroup.valid,
      personalValid: this.personalGroup.valid,
      evidenciasValid: this.evidenciasGroup.valid,
      unidadesValue: this.personalGroup.get('unidades')?.value,
      guardiaValue: this.personalGroup.get('guardia')?.value,
      evidenciasCount: this.evidenciasFotograficas.length,
      evidenciasDetails: this.evidenciasFotograficas.map(e => ({
        fileName: e.file.name,
        size: (e.file.size / 1024 / 1024).toFixed(2) + ' MB',
        hasDescription: !!e.descripcion
      }))
    });
    
    return errores;
  }

  getFormData(): EmergencyReport {
    const form = this.parentForm.value;
    const turno = form.informacionGeneral.sinConvenio ? 'sin_convenio' : form.informacionGeneral.numeroTurno;

    return {
      fechaReporte: form.informacionGeneral.fechaReporte,
      quienInforma: form.informacionGeneral.quienInforma,
      tipoEmergencia: form.informacionGeneral.tipoEmergencia,
      ubicacion: form.informacionGeneral.ubicacion,
      vehiculo: form.informacionGeneral.vehiculo,
      turno: turno,
      horaReporte: form.cronologia.horaReporte,
      horaReporteDescripcion: form.cronologia.horaReporteDescripcion || '',
      horaSalida: form.cronologia.horaSalida,
      horaSalidaDescripcion: form.cronologia.horaSalidaDescripcion || '',
      eventosAdicionalesSalida: form.cronologia.eventosAdicionalesSalida.map((evento: any) => ({
        hora: evento.hora,
        descripcion: evento.descripcion || ''
      })),
      horaLlegadaEscena: form.cronologia.horaLlegadaEscena,
      horaLlegadaEscenaDescripcion: form.cronologia.horaLlegadaEscenaDescripcion || '',
      eventosAdicionalesLlegadaEscena: form.cronologia.eventosAdicionalesLlegadaEscena.map((evento: any) => ({
        hora: evento.hora,
        descripcion: evento.descripcion || ''
      })),
      horaLlegadaHospital: form.cronologia.horaLlegadaHospital || '',
      horaLlegadaHospitalDescripcion: form.cronologia.horaLlegadaHospitalDescripcion || '',
      eventosAdicionalesLlegadaHospital: form.cronologia.eventosAdicionalesLlegadaHospital.map((evento: any) => ({
        hora: evento.hora,
        descripcion: evento.descripcion || ''
      })),
      horaRegresoEstacion: form.cronologia.horaRegresoEstacion,
      horaRegresoEstacionDescripcion: form.cronologia.horaRegresoEstacionDescripcion || '',
      unidades: form.personal.unidades || [],
      guardia: form.personal.guardia || [],
      evidenciasFotograficas: this.evidenciasFotograficas.map(e => ({
        id: e.id,
        fileName: e.file.name,
        fileSize: e.file.size,
        descripcion: e.descripcion,
        fecha: e.fecha
      })),
    };
  }

  onSubmit(): void {
    this.markFormGroupTouched(this.parentForm);
    
    console.log('Intentando enviar formulario...');
    console.log('Formulario válido:', this.parentForm.valid);
    console.log('Valores del formulario:', this.parentForm.value);
    
    if (this.parentForm.valid) {
      const reporteData = this.getFormData();
      console.log('Datos del reporte a guardar:', reporteData);
      
      this.emergencyReportService.guardarReporte(reporteData).subscribe({
        next: (reporte) => {
          this.snackBar.open('Reporte guardado exitosamente', 'Cerrar', {
            duration: 5000,
            panelClass: ['success-snackbar']
          });
          
          // Solo resetear después del éxito, con confirmación del usuario
          setTimeout(() => {
            if (confirm('¿Deseas crear un nuevo reporte? (Se limpiarán todos los campos)')) {
              this.resetForm();
            }
          }, 1000);
          
          console.log('Reporte guardado:', reporte);
        },
        error: (error) => {
          this.snackBar.open('Error al guardar el reporte', 'Cerrar', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
          console.error('Error:', error);
        }
      });
    } else {
      const errores = this.getFormErrors();
      console.log('Formulario inválido. Errores:', errores);
      
      this.snackBar.open(`Faltan campos por completar: ${errores.join(', ')}`, 'Cerrar', {
        duration: 8000,
        panelClass: ['error-snackbar']
      });
    }
  }

  resetForm(): void {
    this.createForm();
    this.previewDescription = '';
    this.showDebugInfo = false;
    this.evidenciasFotograficas = [];
    this.isUploading = false;
  }

  toggleDebugInfo(): void {
    this.showDebugInfo = !this.showDebugInfo;
  }

  // Métodos para manejar evidencias fotográficas
  onFileSelected(event: any): void {
    const files = Array.from(event.target.files) as File[];
    
    for (const file of files) {
      if (this.validateFile(file)) {
        this.addPhotography(file);
      }
    }
    
    // Limpiar el input
    event.target.value = '';
  }

  private validateFile(file: File): boolean {
    // Validar tipo de archivo
    if (!this.allowedTypes.includes(file.type)) {
      this.snackBar.open(
        `El archivo "${file.name}" no es un tipo de imagen válido. Solo se permiten JPG, JPEG y PNG.`,
        'Cerrar',
        { duration: 4000, panelClass: ['error-snackbar'] }
      );
      return false;
    }

    // Validar tamaño
    if (file.size > this.maxFileSize) {
      this.snackBar.open(
        `El archivo "${file.name}" es demasiado grande. El tamaño máximo es 5MB.`,
        'Cerrar',
        { duration: 4000, panelClass: ['error-snackbar'] }
      );
      return false;
    }

    return true;
  }

  private addPhotography(file: File): void {
    this.isUploading = true;
    
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const evidencia: EvidenciaFotografica = {
        id: this.generateUniqueId(),
        file: file,
        preview: e.target.result,
        descripcion: '',
        fecha: new Date()
      };

      this.evidenciasFotograficas.push(evidencia);
      this.updateEvidenciasForm();
      this.isUploading = false;

      this.snackBar.open(
        `Fotografía "${file.name}" agregada exitosamente.`,
        'Cerrar',
        { duration: 3000, panelClass: ['success-snackbar'] }
      );
    };

    reader.onerror = () => {
      this.isUploading = false;
      this.snackBar.open(
        `Error al cargar la fotografía "${file.name}".`,
        'Cerrar',
        { duration: 4000, panelClass: ['error-snackbar'] }
      );
    };

    reader.readAsDataURL(file);
  }

  removePhotography(id: string): void {
    const index = this.evidenciasFotograficas.findIndex(e => e.id === id);
    if (index > -1) {
      const evidencia = this.evidenciasFotograficas[index];
      this.evidenciasFotograficas.splice(index, 1);
      this.updateEvidenciasForm();

      this.snackBar.open(
        `Fotografía "${evidencia.file.name}" eliminada.`,
        'Cerrar',
        { duration: 3000, panelClass: ['info-snackbar'] }
      );
    }
  }

  updatePhotoDescription(id: string, descripcion: string): void {
    const evidencia = this.evidenciasFotograficas.find(e => e.id === id);
    if (evidencia) {
      evidencia.descripcion = descripcion;
      this.updateEvidenciasForm();
    }
  }

  private updateEvidenciasForm(): void {
    const fotografiasData = this.evidenciasFotograficas.map(e => ({
      id: e.id,
      fileName: e.file.name,
      fileSize: e.file.size,
      descripcion: e.descripcion,
      fecha: e.fecha
    }));

    this.evidenciasGroup.get('fotografias')?.setValue(fotografiasData);
    this.evidenciasGroup.get('fotografias')?.markAsTouched();
  }

  private generateUniqueId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  get isEvidenciasValid(): boolean {
    return this.evidenciasFotograficas.length >= this.minPhotos;
  }

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
} 