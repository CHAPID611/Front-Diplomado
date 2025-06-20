import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { VehiclesService, Vehicle } from '../../../../core/services/vehicles.service';
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

  statusOptions = [
    { value: 'disponible', label: 'Disponible' },
    { value: 'en_emergencia', label: 'En Emergencia' },
    { value: 'en_mantenimiento', label: 'En Mantenimiento' }
  ];

  constructor(
    private fb: FormBuilder,
    private vehiclesService: VehiclesService,
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
    this.dialogRef.close();
  }
} 