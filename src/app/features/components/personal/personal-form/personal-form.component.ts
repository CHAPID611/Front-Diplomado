import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Personal, Cualidad, Cargo, Rango } from '../../../../core/interfaces/personal.interface';
import { PersonalService } from '../../../../core/services/personal.service';

interface DialogData {
  personal?: Personal;
  cargos: Cargo[];
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
    MatTooltipModule
  ],
  templateUrl: './personal-form.component.html',
  styleUrls: ['./personal-form.component.css']
})
export class PersonalFormComponent implements OnInit {
  personalForm: FormGroup;
  tiposSangre: string[] = [];
  estados: Array<{value: string, label: string}> = [];
  cualidadesSeleccionadas: string[] = [];
  isEditMode = false;

  constructor(
    private fb: FormBuilder,
    private personalService: PersonalService,
    private dialogRef: MatDialogRef<PersonalFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.isEditMode = !!data.personal;
    this.personalForm = this.createForm();
    this.tiposSangre = this.personalService.getTiposSangre();
    this.estados = this.personalService.getEstados();
  }

  ngOnInit() {
    if (this.data.personal) {
      this.loadPersonalData();
    }
  }

  createForm(): FormGroup {
    return this.fb.group({
      // Datos personales
      cedula: ['', [Validators.required, Validators.minLength(6)]],
      nombres: ['', [Validators.required, Validators.minLength(2)]],
      apellidos: ['', [Validators.required, Validators.minLength(2)]],
      fechaNacimiento: ['', Validators.required],
      telefono: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      email: ['', [Validators.required, Validators.email]],
      direccion: ['', Validators.required],
      tipoSangre: ['', Validators.required],
      
      // Datos laborales
      cargo: ['', Validators.required],
      rango: ['', Validators.required],
      fechaIngreso: ['', Validators.required],
      estado: ['activo', Validators.required],
      experienciaAnios: [0, [Validators.required, Validators.min(0)]],
      observaciones: [''],
      
      // Contacto de emergencia
      contactoNombre: ['', Validators.required],
      contactoParentesco: ['', Validators.required],
      contactoTelefono: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]]
    });
  }

  loadPersonalData() {
    const personal = this.data.personal!;
    this.cualidadesSeleccionadas = [...personal.cualidades];
    
    this.personalForm.patchValue({
      cedula: personal.cedula,
      nombres: personal.nombres,
      apellidos: personal.apellidos,
      fechaNacimiento: personal.fechaNacimiento,
      telefono: personal.telefono,
      email: personal.email,
      direccion: personal.direccion,
      tipoSangre: personal.tipoSangre,
      cargo: personal.cargo,
      rango: personal.rango,
      fechaIngreso: personal.fechaIngreso,
      estado: personal.estado,
      experienciaAnios: personal.experienciaAnios,
      observaciones: personal.observaciones || '',
      contactoNombre: personal.contactoEmergencia.nombre,
      contactoParentesco: personal.contactoEmergencia.parentesco,
      contactoTelefono: personal.contactoEmergencia.telefono
    });
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
    return this.cualidadesSeleccionadas.includes(cualidadId);
  }

  getCualidadesByCategoria(categoria: string): Cualidad[] {
    return this.data.cualidades.filter(c => c.categoria === categoria);
  }

  onSubmit() {
    if (this.personalForm.valid && this.cualidadesSeleccionadas.length > 0) {
      const formValue = this.personalForm.value;
      
      const personalData: Personal = {
        cedula: formValue.cedula,
        nombres: formValue.nombres,
        apellidos: formValue.apellidos,
        fechaNacimiento: formValue.fechaNacimiento,
        telefono: formValue.telefono,
        email: formValue.email,
        direccion: formValue.direccion,
        tipoSangre: formValue.tipoSangre,
        cargo: formValue.cargo,
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

      this.dialogRef.close(personalData);
    } else {
      this.markFormGroupTouched(this.personalForm);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  onCancel() {
    this.dialogRef.close();
  }

  getErrorMessage(fieldName: string): string {
    const control = this.personalForm.get(fieldName);
    if (control?.hasError('required')) {
      return 'Este campo es requerido';
    }
    if (control?.hasError('email')) {
      return 'Ingrese un email válido';
    }
    if (control?.hasError('pattern')) {
      return 'Formato inválido';
    }
    if (control?.hasError('minlength')) {
      return `Mínimo ${control.errors?.['minlength']?.requiredLength} caracteres`;
    }
    if (control?.hasError('min')) {
      return 'El valor debe ser mayor a 0';
    }
    return '';
  }
} 