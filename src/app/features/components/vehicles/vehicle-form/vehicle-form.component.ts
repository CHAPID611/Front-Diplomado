import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { VehiclesService, Vehicle } from '../../../../core/services/vehicles.service';
import { FormPersistenceService, FormPersistenceConfig } from '../../../../core/services/form-persistence.service';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-vehicle-form',
  templateUrl: './vehicle-form.component.html',
  styleUrls: ['./vehicle-form.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSnackBarModule
  ]
})
export class VehicleFormComponent {
  vehicleForm: FormGroup;
  isEdit: boolean = false;
  title: string = 'Registrar Vehículo';

  // Configuración de persistencia
  private persistenceConfig: FormPersistenceConfig = {
    key: 'vehicle_form_draft',
    autoSave: true,
    autoSaveDelay: 2000,
    storageType: 'sessionStorage',
    excludeFields: [] // Los vehículos no tienen campos sensibles
  };

  statusOptions = [
    { value: 'disponible', label: 'Disponible' },
    { value: 'en_emergencia', label: 'En Emergencia' },
    { value: 'en_mantenimiento', label: 'En Mantenimiento' }
  ];

  constructor(
    private fb: FormBuilder,
    private vehiclesService: VehiclesService,
    private formPersistenceService: FormPersistenceService,
    private dialogRef: MatDialogRef<VehicleFormComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: Vehicle | null
  ) {
    this.vehicleForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      plate: ['', [Validators.required, Validators.maxLength(20)]],
      status: ['disponible', Validators.required]
    });

    if (data) {
      this.isEdit = true;
      this.title = 'Editar Vehículo';
      this.vehicleForm.patchValue(data);
    } else {
      // Solo restaurar datos si NO estamos editando
      this.restoreFormData();
      this.setupFormPersistence();
    }
  }

  onSubmit(): void {
    if (this.vehicleForm.valid) {
      const vehicleData = this.vehicleForm.value;
      
      const operation = this.isEdit
        ? this.vehiclesService.updateVehicle(this.data!.vehicleId, vehicleData)
        : this.vehiclesService.createVehicle(vehicleData);

      operation.subscribe({
        next: () => {
          // Limpiar borrador después de envío exitoso
          if (!this.isEdit) {
            this.clearDraft();
          }
          
          this.snackBar.open(
            `Vehículo ${this.isEdit ? 'actualizado' : 'creado'} con éxito`,
            'Cerrar',
            { duration: 3000 }
          );
          this.dialogRef.close(true);
        },
        error: (error) => {
          console.error('Error:', error);
          this.snackBar.open(
            `Error al ${this.isEdit ? 'actualizar' : 'crear'} el vehículo`,
            'Cerrar',
            { duration: 3000 }
          );
        }
      });
    }
  }

  onCancel(): void {
    // Mostrar confirmación si hay datos guardados en modo creación
    if (!this.isEdit) {
      const hasData = this.formPersistenceService.getFormDataInfo(this.persistenceConfig).exists;
      
      if (hasData && this.hasSignificantData(this.vehicleForm.value)) {
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

  // ===== MÉTODOS DE PERSISTENCIA =====

  private restoreFormData(): void {
    try {
      const savedData = this.formPersistenceService.loadFormData(this.persistenceConfig);
      
      if (savedData) {
        setTimeout(() => {
          this.vehicleForm.patchValue(savedData, { emitEvent: false });
          console.log('✅ Borrador de vehículo restaurado:', savedData);
        }, 100);
      }
    } catch (error) {
      console.error('Error al restaurar borrador de vehículo:', error);
    }
  }

  private setupFormPersistence(): void {
    this.formPersistenceService.setupAutoSave(this.vehicleForm, this.persistenceConfig);
  }

  private hasSignificantData(formValue: any): boolean {
    return this.formPersistenceService.hasSignificantChanges(formValue, [
      'name', 'plate'
    ]);
  }

  saveDraftManually(): void {
    this.formPersistenceService.saveFormData(this.vehicleForm, this.persistenceConfig);
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