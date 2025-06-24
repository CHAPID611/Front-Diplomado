import { Component, OnInit, Inject, LOCALE_ID, ViewChild } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule, MatDatepicker } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE, DateAdapter, MAT_DATE_FORMATS, NativeDateAdapter } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import localeEs from '@angular/common/locales/es';

import { Personal, Cualidad, Rango } from '../../../../core/interfaces/personal.interface';
import { PersonalService } from '../../../../core/services/personal.service';
import { FormPersistenceService, FormPersistenceConfig } from '../../../../core/services/form-persistence.service';

registerLocaleData(localeEs, 'es');

export class CustomDateAdapter extends NativeDateAdapter {
  override format(date: Date, displayFormat: Object): string {
    if (displayFormat === 'input') {
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      return `${this.pad(day)}/${this.pad(month)}/${year}`;
    }
    return date.toDateString();
  }

  private pad(n: number): string {
    return n < 10 ? '0' + n : n.toString();
  }
}

export const MY_FORMATS = {
  parse: {
    dateInput: { day: 'numeric', month: 'numeric', year: 'numeric' },
  },
  display: {
    dateInput: 'input',
    monthYearLabel: { year: 'numeric', month: 'long' },
    dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
    monthYearA11yLabel: { year: 'numeric', month: 'long' },
  },
};

interface DialogData {
  personal?: Personal;
  rangos: Rango[];
  cualidades: Cualidad[];
}

@Component({
  selector: 'app-personal-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatIconModule,
    MatDividerModule,
    MatStepperModule,
    MatTooltipModule,
    MatChipsModule,
    MatListModule
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'es' },
    { provide: MAT_DATE_LOCALE, useValue: 'es' },
    { provide: DateAdapter, useClass: CustomDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './personal-form.component.html',
  styleUrls: ['./personal-form.component.css']
})
export class PersonalFormComponent implements OnInit {
  @ViewChild('birthPicker') birthPicker!: MatDatepicker<Date>;
  @ViewChild('ingressPicker') ingressPicker!: MatDatepicker<Date>;
  
  personalForm: FormGroup;
  tiposSangre: any[] = [];
  estados: Array<{value: string, label: string}> = [];
  cualidadesSeleccionadas: string[] = [];
  isEditMode = false;

  // Configuración de persistencia
  private persistenceConfig: FormPersistenceConfig = {
    key: 'personal_form_draft',
    autoSave: true,
    autoSaveDelay: 3000, // 3 segundos para formularios largos
    storageType: 'sessionStorage', // Datos sensibles, usar sessionStorage
    excludeFields: ['cedula'] // Excluir cédula por privacidad
  };

  constructor(
    private fb: FormBuilder,
    private personalService: PersonalService,
    private formPersistenceService: FormPersistenceService,
    private dialogRef: MatDialogRef<PersonalFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.isEditMode = !!data.personal;
    this.personalForm = this.createForm();
    this.loadConstantData();
  }

  ngOnInit() {
    if (this.data.personal) {
      this.loadPersonalDataAfterConstants();
    } else {
      // Solo restaurar datos si NO estamos editando
      this.restoreFormData();
    }
    
    // Configurar auto-guardado solo para formularios nuevos
    if (!this.isEditMode) {
      this.setupFormPersistence();
    }
  }

  loadConstantData() {
    this.personalService.getTiposSangre().subscribe({
      next: (tipos) => {
        this.tiposSangre = tipos;
        if (this.isEditMode) {
          this.syncPersonalDataWithConstants();
        }
      },
      error: () => {
        this.tiposSangre = this.personalService.getTiposSangreStatic().map((tipo, index) => ({ 
          bloodTypeId: index + 1, 
          bloodType: tipo 
        }));
        if (this.isEditMode) {
          this.syncPersonalDataWithConstants();
        }
      }
    });

    this.personalService.getEstados().subscribe({
      next: (estados) => {
        this.estados = estados.map(e => ({ 
          value: e.state.toLowerCase() === 'en licencia' ? 'licencia' : e.state.toLowerCase(), 
          label: e.state 
        }));
        if (this.isEditMode) {
          this.syncPersonalDataWithConstants();
        }
      },
      error: () => {
        this.estados = this.personalService.getEstadosStatic();
        if (this.isEditMode) {
          this.syncPersonalDataWithConstants();
        }
      }
    });
  }

  createForm(): FormGroup {
    return this.fb.group({
      // Datos personales
      cedula: ['', [Validators.required, Validators.minLength(6)]],
      nombres: ['', [Validators.required, Validators.minLength(2)]],
      apellidos: ['', [Validators.required, Validators.minLength(2)]],
      fechaNacimiento: ['', [
        Validators.required, 
        this.validateMayoriaEdad.bind(this)
      ]],
      telefono: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      email: ['', [Validators.required, Validators.email]],
      direccion: ['', Validators.required],
      tipoSangre: ['', Validators.required],
      
      // Datos laborales
      rango: ['', Validators.required],
      fechaIngreso: ['', [
        Validators.required,
        this.validateFechaNoFutura.bind(this)
      ]],
      estado: ['activo', Validators.required],
      experienciaAnios: [0, [Validators.min(0)]],
      observaciones: [''],
      
      // Contacto de emergencia
      contactoNombre: ['', Validators.required],
      contactoParentesco: ['', Validators.required],
      contactoTelefono: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]]
    });
  }

  loadPersonalDataAfterConstants() {
    setTimeout(() => {
      this.loadPersonalData();
    }, 100);
  }

  syncPersonalDataWithConstants() {
    if (this.data.personal && (this.tiposSangre.length > 0 || (this.data.rangos && this.data.rangos.length > 0))) {
      this.loadPersonalData();
    }
  }

  loadPersonalData() {
    const personal = this.data.personal!;
    
    // Sincronizar competencias seleccionadas con las disponibles
    this.cualidadesSeleccionadas = [];
    if (personal.cualidades && Array.isArray(personal.cualidades)) {
      personal.cualidades.forEach(cualidadPersonal => {
        // Buscar la competencia en las disponibles
        const competenciaEncontrada = this.data.cualidades.find(comp => {
          const compId = this.getCualidadId(comp);
          const compName = this.getCualidadNombre(comp);
          
          // Comparar tanto por ID como por nombre, convirtiendo a string para comparación segura
          return String(compId) === String(cualidadPersonal) || 
                 String(compName) === String(cualidadPersonal);
        });
        
        if (competenciaEncontrada) {
          const idToAdd = this.getCualidadId(competenciaEncontrada);
          if (!this.cualidadesSeleccionadas.includes(idToAdd)) {
            this.cualidadesSeleccionadas.push(idToAdd);
          }
        }
      });
    }
    
    // Procesar fechas para asegurar compatibilidad
    const fechaNacimiento = personal.fechaNacimiento instanceof Date ? 
      personal.fechaNacimiento : new Date(personal.fechaNacimiento);
    const fechaIngreso = personal.fechaIngreso instanceof Date ? 
      personal.fechaIngreso : new Date(personal.fechaIngreso);
    
    // Encontrar el valor correcto para tipo de sangre
    let tipoSangreValue = '';
    if (this.tiposSangre.length > 0) {
      const tipoEncontrado = this.tiposSangre.find(tipo => {
        const matches = (tipo.bloodTypeId && tipo.bloodTypeId == personal.tipoSangre) ||
                       (tipo.bloodType && tipo.bloodType === personal.tipoSangre) ||
                       tipo === personal.tipoSangre;
        
        if (matches) {
        }
        return matches;
      });
      
      if (tipoEncontrado) {
        tipoSangreValue = tipoEncontrado.bloodTypeId || tipoEncontrado;
      } else {
        tipoSangreValue = personal.tipoSangre;
      }
    } else {
      tipoSangreValue = personal.tipoSangre;
    }

    // Encontrar el valor correcto para rango
    let rangoValue = '';
    if (this.data.rangos && this.data.rangos.length > 0) {
      const rangoEncontrado = this.data.rangos.find(rango => {
        const rangoId = this.getRangoId(rango);
        
        // Comparaciones más robustas - tanto string como number
        const coincideId = String(rangoId) === String(personal.rango) || 
                          Number(rangoId) === Number(personal.rango);
        
        return coincideId;
      });
      
      if (rangoEncontrado) {
        rangoValue = this.getRangoId(rangoEncontrado);
      } else {
        // Intentar usar el valor original si no se encuentra coincidencia
        rangoValue = String(personal.rango);
        
        // Verificar si el valor original coincide con algún ID disponible
        const coincidenciaDirecta = this.data.rangos.find(r => 
          String(this.getRangoId(r)) === String(personal.rango)
        );
        if (coincidenciaDirecta) {
        }
      }
    } else {
      rangoValue = String(personal.rango);
    }
    
    this.personalForm.patchValue({
      cedula: personal.cedula || '',
      nombres: personal.nombres || '',
      apellidos: personal.apellidos || '',
      fechaNacimiento: fechaNacimiento,
      telefono: personal.telefono || '',
      email: personal.email || '',
      direccion: personal.direccion || '',
      tipoSangre: tipoSangreValue,
      rango: rangoValue,
      fechaIngreso: fechaIngreso,
      estado: personal.estado || 'activo',
      experienciaAnios: personal.experienciaAnios || 0,
      observaciones: personal.observaciones || '',
      contactoNombre: personal.contactoEmergencia?.nombre || '',
      contactoParentesco: personal.contactoEmergencia?.parentesco || '',
      contactoTelefono: personal.contactoEmergencia?.telefono || ''
    });
    
    // Método específico para debuggear el rango
    this.debugRango(personal);
  }

  onCualidadChange(cualidadId: string, checked: boolean) {
    if (checked) {
      if (!this.cualidadesSeleccionadas.includes(cualidadId)) {
        this.cualidadesSeleccionadas.push(cualidadId);
      }
    } else {
      const index = this.cualidadesSeleccionadas.indexOf(cualidadId);
      if (index > -1) {
        this.cualidadesSeleccionadas.splice(index, 1);
      }
    }
  }

  isCualidadSelected(cualidadId: string): boolean {
    const selected = this.cualidadesSeleccionadas.includes(cualidadId);
    return selected;
  }

  getCualidadesByCategoria(categoria: string): Cualidad[] {
    if (!this.data.cualidades) {
      return [];
    }
    
    const filtradas = this.data.cualidades.filter(c => {
      const categoriaReal = c.categoria || (c as any).category;
      const coincide = categoriaReal === categoria;
      return coincide;
    });
    
    return filtradas;
  }

  // Métodos auxiliares para manejar las diferencias entre frontend y backend
  getCualidadId(cualidad: any): string {
    if (typeof cualidad === 'string' || typeof cualidad === 'number') {
      return String(cualidad);
    }
    
    if (cualidad && typeof cualidad === 'object') {
      const id = cualidad.competenciaId || cualidad.id || cualidad.value || '';
      return String(id);
    }
    
    return '';
  }

  getCualidadNombre(cualidad: any): string {
    if (typeof cualidad === 'string' || typeof cualidad === 'number') {
      if (this.data.cualidades) {
        const cualidadEncontrada = this.data.cualidades.find(c => 
          String(this.getCualidadId(c)) === String(cualidad)
        );
        if (cualidadEncontrada) {
          const nombre = cualidadEncontrada.competenciaName || cualidadEncontrada.nombre || cualidadEncontrada.name;
          return nombre || String(cualidad);
        }
      }
      return String(cualidad);
    }
    
    if (cualidad && typeof cualidad === 'object') {
      const nombre = cualidad.competenciaName || cualidad.nombre || cualidad.name || 'Sin Nombre';
      return nombre;
    }
    
    return 'Sin Nombre';
  }

  // Método trackBy para optimizar el rendering
  trackByRango = (index: number, rango: any): any => {
    return this.getRangoId(rango);
  }

  // Método específico para debuggear el rango
  debugRango(personal: Personal) {
    if (this.data.rangos && this.data.rangos.length > 0) {
      this.data.rangos.forEach((rango, index) => {
        const id = this.getRangoId(rango);
        const nombre = this.getRangoNombre(rango);
        console.log(`  ${index + 1}. Rango: ${JSON.stringify(rango)}`);
        console.log(`      → ID extraído: "${id}" (tipo: ${typeof id})`);
        console.log(`      → Nombre extraído: "${nombre}" (tipo: ${typeof nombre})`);
        console.log(`      → ¿Coincide ID? ${String(id) === String(personal.rango)}`);
        console.log(`      → ¿Coincide nombre? ${String(nombre).toLowerCase() === String(personal.rango).toLowerCase()}`);
      });
    }
    
    console.log('Estado actual del formulario rango:', this.personalForm.get('rango')?.value);
  }

  // Método para determinar si el botón de envío debe estar deshabilitado
  isSubmitDisabled(): boolean {
    if (this.isEditMode) {
      // En modo edición, validación más flexible
      return !this.isFormValidForEdit();
    } else {
      // En modo creación, validación estricta
      return this.personalForm.invalid || this.cualidadesSeleccionadas.length === 0;
    }
  }

  onSubmit() {
    // Validaciones más flexibles para modo edición
    const isFormValid = this.isEditMode ? 
      this.isFormValidForEdit() : 
      this.personalForm.valid && this.cualidadesSeleccionadas.length > 0;
    
    if (isFormValid) {
      const formValue = this.personalForm.value;
      
      const personalData: Personal = {
        // En modo edición, preservar el ID original
        ...(this.isEditMode && this.data.personal?.id && { id: this.data.personal.id }),
        cedula: formValue.cedula,
        nombres: formValue.nombres,
        apellidos: formValue.apellidos,
        fechaNacimiento: formValue.fechaNacimiento,
        telefono: formValue.telefono,
        email: formValue.email,
        direccion: formValue.direccion,
        tipoSangre: formValue.tipoSangre,
        rango: formValue.rango,
        fechaIngreso: formValue.fechaIngreso,
        estado: formValue.estado,
        cualidades: this.cualidadesSeleccionadas,
        experienciaAnios: formValue.experienciaAnios,
        observaciones: formValue.observaciones,
        contactoEmergencia: {
          nombre: formValue.contactoNombre,
          parentesco: formValue.contactoParentesco,
          telefono: formValue.contactoTelefono
        }
      };

      // Limpiar borrador después de envío exitoso
      if (!this.isEditMode) {
        this.clearDraft();
      }
      
      this.dialogRef.close(personalData);
    } else {
      this.showValidationErrors();
      this.markFormGroupTouched(this.personalForm);
    }
  }

  // Validación más flexible para modo edición
  private isFormValidForEdit(): boolean {
    // Campos críticos que siempre deben estar llenos
    const criticalFields = ['cedula', 'nombres', 'apellidos', 'telefono', 'email', 'direccion'];
    
    const hasCriticalFields = criticalFields.every(field => {
      const value = this.personalForm.get(field)?.value;
      return value && value.toString().trim().length > 0;
    });
    
    // En modo edición, ser más flexible con las validaciones
    return hasCriticalFields && (this.cualidadesSeleccionadas.length > 0 || this.isEditMode);
  }

  // Mostrar errores de validación específicos
  private showValidationErrors(): void {
    Object.keys(this.personalForm.controls).forEach(key => {
      const control = this.personalForm.get(key);
      if (control && control.invalid) {
      }
    });
    
    if (this.cualidadesSeleccionadas.length === 0) {
    }
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  onCancel() {
    // Mostrar confirmación si hay datos guardados en modo creación
    if (!this.isEditMode) {
      const hasData = this.formPersistenceService.getFormDataInfo(this.persistenceConfig).exists;
      
      if (hasData && this.hasSignificantData(this.personalForm.value)) {
        const confirmClear = confirm('¿Deseas guardar el borrador antes de cerrar?');
        if (confirmClear) {
          this.saveDraftManually();
        } else {
          const confirmDelete = confirm('¿Deseas eliminar el borrador guardado?');
          if (confirmDelete) {
            this.clearDraft();
          }
        }
      }
    }
    
    this.dialogRef.close();
  }

  getErrorMessage(fieldName: string): string {
    const control = this.personalForm.get(fieldName);
    if (!control) return '';

    if (control.hasError('required')) {
      return 'Este campo es requerido';
    }

    switch (fieldName) {
      case 'cedula':
        if (control.hasError('minlength')) {
          return 'La cédula debe tener al menos 6 caracteres';
        }
        break;
      case 'nombres':
      case 'apellidos':
        if (control.hasError('minlength')) {
          return 'Debe tener al menos 2 caracteres';
        }
        break;
      case 'telefono':
        if (control.hasError('pattern')) {
          return 'Debe ser un número de 10 dígitos';
        }
        break;
      case 'email':
        if (control.hasError('email')) {
          return 'Debe ser un correo electrónico válido';
        }
        break;
      case 'fechaNacimiento':
        if (control.hasError('menorDeEdad')) {
          return 'Debe ser mayor de 18 años';
        }
        break;
      case 'fechaIngreso':
        if (control.hasError('fechaFutura')) {
          return 'No puede ser una fecha futura';
        }
        break;
    }
    return '';
  }

  getRangoId(rango: any): string {
    // Si es primitivo, retornar como string
    if (typeof rango === 'string' || typeof rango === 'number') {
      return String(rango);
    }
    
    // Si es objeto, intentar extraer el ID
    if (rango && typeof rango === 'object') {
      // Intentar obtener el ID primero
      if (typeof rango.rangeId !== 'undefined') {
        const id = String(rango.rangeId);
        return id;
      }
      
      // Intentar con id normal
      if (typeof rango.id !== 'undefined') {
        const id = String(rango.id);
        return id;
      }
      
      // Intentar con value
      if (typeof rango.value !== 'undefined') {
        const id = String(rango.value);
        return id;
      }
      
      // Si no hay ID pero hay nombre, buscar en los rangos disponibles
      const nombreRango = rango.rangeName || rango.range || rango.nombre || rango.name;
      if (nombreRango && this.data.rangos) {
        const rangoEncontrado = this.data.rangos.find(r => {
          const nombreDisponible = r.rangeName || r.range || r.nombre || r.name;
          return String(nombreDisponible).toLowerCase() === String(nombreRango).toLowerCase();
        });
        
        if (rangoEncontrado) {
          const id = this.getRangoId(rangoEncontrado); // Recursivo para obtener el ID
          return id;
        }
      }
    }
    
    // Si no se encuentra nada, usar valor por defecto
    return '1'; // ID por defecto para Bombero
  }

  getRangoNombre(rango: any): string {
    // Si es primitivo, intentar encontrar el nombre en los rangos disponibles
    if (typeof rango === 'string' || typeof rango === 'number') {
      if (this.data.rangos) {
        const rangoEncontrado = this.data.rangos.find(r => {
          // Comparar por ID
          const idCoincide = String(this.getRangoId(r)) === String(rango);
          // Comparar por nombre
          const nombreRango = r.rangeName || r.range || r.nombre || r.name || '';
          const nombreCoincide = nombreRango && String(nombreRango).toLowerCase() === String(rango).toLowerCase();
          
          return idCoincide || nombreCoincide;
        });
        
        if (rangoEncontrado) {
          const nombre = rangoEncontrado.rangeName || rangoEncontrado.range || 
                        rangoEncontrado.nombre || rangoEncontrado.name || String(rango);
          return nombre;
        }
      }
      return String(rango);
    }
    
    // Si es objeto, intentar extraer el nombre
    if (rango && typeof rango === 'object') {
      // Intentar todas las posibles propiedades de nombre
      const nombre = rango.rangeName || rango.range || rango.nombre || rango.name || 
                    rango.label || rango.text || 'Sin Rango';
      
      // Si encontramos un nombre, verificar si es válido
      if (nombre !== 'Sin Rango' && this.data.rangos) {
        const rangoEncontrado = this.data.rangos.find(r => {
          const nombreDisponible = (r.rangeName || r.range || r.nombre || r.name || '').toString();
          return nombreDisponible.toLowerCase() === String(nombre).toLowerCase();
        });
        
        if (rangoEncontrado) {
          const nombreValidado = rangoEncontrado.rangeName || rangoEncontrado.range || 
                               rangoEncontrado.nombre || rangoEncontrado.name || nombre;
          return nombreValidado;
        }
      }
      
      return nombre;
    }
    
    // Valor por defecto
    return 'Bombero';
  }

  // Función para validar mayoría de edad
  private validateMayoriaEdad(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }
    const fechaNacimiento = new Date(control.value);
    const hoy = new Date();
    const edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
    const mesActual = hoy.getMonth();
    const mesNacimiento = fechaNacimiento.getMonth();
    const diaActual = hoy.getDate();
    const diaNacimiento = fechaNacimiento.getDate();

    // Ajustar la edad si aún no ha cumplido años este año
    if (mesActual < mesNacimiento || (mesActual === mesNacimiento && diaActual < diaNacimiento)) {
      if (edad - 1 < 18) {
        return { menorDeEdad: true };
      }
    } else if (edad < 18) {
      return { menorDeEdad: true };
    }
    return null;
  }

  // Función para validar que la fecha no sea futura
  private validateFechaNoFutura(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }
    const fecha = new Date(control.value);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Normalizar la hora a medianoche
    fecha.setHours(0, 0, 0, 0); // Normalizar la hora a medianoche
    
    if (fecha > hoy) {
      return { fechaFutura: true };
    }
    return null;
  }

  // Función para obtener la fecha máxima permitida para nacimiento (18 años atrás)
  getMaxFechaNacimiento(): Date {
    const hoy = new Date();
    return new Date(hoy.getFullYear() - 18, hoy.getMonth(), hoy.getDate());
  }

  // Función para obtener la fecha máxima para ingreso (hoy)
  getMaxFechaIngreso(): Date {
    return new Date();
  }

  openDatePicker(picker: MatDatepicker<Date>): void {
    if (picker) {
      picker.open();
    }
  }

  // ===== MÉTODOS PARA CONVERSIÓN DE TIPO DE SANGRE =====
  
  /**
   * Convierte ID de tipo de sangre a nombre
   */
  private convertBloodTypeIdToName(id: number | string): string {
    if (!id) return '';
    
    const bloodType = this.tiposSangre.find(tipo => 
      (tipo.bloodTypeId && tipo.bloodTypeId == id) || 
      (tipo.bloodType && tipo.bloodType === id)
    );
    
    return bloodType ? bloodType.bloodType : String(id);
  }
  
  /**
   * Convierte nombre de tipo de sangre a ID
   */
  private convertBloodTypeNameToId(name: string): number | string {
    if (!name) return '';
    
    // Buscar por nombre exacto
    const bloodType = this.tiposSangre.find(tipo => 
      tipo.bloodType === name
    );
    
    if (bloodType && bloodType.bloodTypeId) {
      return bloodType.bloodTypeId;
    }
    
    // Si no se encuentra, retornar el nombre original
    return name;
  }
  
  /**
   * Restaura ID desde nombre guardado cuando sea necesario
   */
  private restoreBloodTypeIdFromName(data: any): void {
    if (!data || !data.tipoSangre) return;
    
    try {
      // Si el tipo de sangre es un string (nombre), convertir a ID
      if (typeof data.tipoSangre === 'string') {
        // Verificar si es un nombre de tipo de sangre y no un ID string
        const isBloodTypeName = this.tiposSangre.some(tipo => 
          tipo.bloodType === data.tipoSangre
        );
        
                 if (isBloodTypeName) {
           const tipoSangreNombre = data.tipoSangre; // Guardar nombre original para el log
           const bloodTypeId = this.convertBloodTypeNameToId(data.tipoSangre);
           data.tipoSangre = bloodTypeId;
           console.log('🔄 Restaurado tipo de sangre desde nombre:', tipoSangreNombre, '-> ID:', bloodTypeId);
         }
      }
    } catch (error) {
      console.error('Error al restaurar tipo de sangre desde nombre:', error);
    }
  }

  // ===== MÉTODOS DE PERSISTENCIA =====

  private restoreFormData(): void {
    try {
      const savedData = this.formPersistenceService.loadFormData(this.persistenceConfig);
      
      if (savedData) {
        // NUEVO: Restaurar ID desde nombre si es necesario
        this.restoreBloodTypeIdFromName(savedData);
        
        // Esperar a que el formulario y constantes estén cargados
        setTimeout(() => {
          this.personalForm.patchValue(savedData, { emitEvent: false });
          
          // Restaurar cualidades seleccionadas si existen
          if (savedData.cualidades) {
            this.cualidadesSeleccionadas = savedData.cualidades;
          }
          
          console.log('✅ Borrador de personal restaurado:', savedData);
        }, 500); // Más tiempo para cargar constantes
      }
    } catch (error) {
      console.error('Error al restaurar borrador de personal:', error);
    }
  }

  private setupFormPersistence(): void {
    // Configurar auto-guardado para el formulario
    this.formPersistenceService.setupAutoSave(this.personalForm, this.persistenceConfig);
    
    // También guardar cuando cambien las cualidades
    this.personalForm.valueChanges.subscribe(() => {
      // Verificar si tiene datos significativos antes de guardar
      if (this.hasSignificantData(this.personalForm.value)) {
        this.saveFormWithCualidades();
      }
    });
  }

  private saveFormWithCualidades(): void {
    const formValue = this.personalForm.value;
    
    // NUEVO: Convertir ID de tipo de sangre a nombre para mejor legibilidad
    const tipoSangreNombre = this.convertBloodTypeIdToName(formValue.tipoSangre);
    
    const formValueWithCualidades = {
      ...formValue,
      cualidades: this.cualidadesSeleccionadas,
      // NUEVO: Guardar tipo de sangre por nombre en lugar de ID
      tipoSangre: tipoSangreNombre || formValue.tipoSangre
    };
    
    // Crear formulario temporal para guardar con cualidades
    const tempForm = this.fb.group(formValueWithCualidades);
    this.formPersistenceService.saveFormData(tempForm, this.persistenceConfig);
  }

  private hasSignificantData(formValue: any): boolean {
    return this.formPersistenceService.hasSignificantChanges(formValue, [
      'nombres', 'apellidos', 'telefono', 'email', 'direccion'
    ]);
  }

  saveDraftManually(): void {
    this.saveFormWithCualidades();
    console.log('📝 Borrador guardado manualmente');
  }

  clearDraft(): void {
    this.formPersistenceService.clearFormData(this.persistenceConfig);
    console.log('🗑️ Borrador eliminado');
  }

  getDraftInfo(): { exists: boolean; timestamp?: string; size?: number } {
    return this.formPersistenceService.getFormDataInfo(this.persistenceConfig);
  }
} 