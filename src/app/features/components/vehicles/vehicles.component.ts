import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { VehiclesService, Vehicle, VehicleStats } from '../../../core/services/vehicles.service';
import { VehicleFormComponent } from './vehicle-form/vehicle-form.component';
import { FormPersistenceService, FormPersistenceConfig } from '../../../core/services/form-persistence.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-vehicles',
  templateUrl: './vehicles.component.html',
  styleUrls: ['./vehicles.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatTabsModule,
    MatMenuModule,
    MatTooltipModule,
    MatDividerModule
  ]
})
export class VehiclesComponent implements OnInit {
  vehicles: Vehicle[] = [];
  filteredVehicles: Vehicle[] = [];
  stats: VehicleStats = {
    total: 0,
    available: 0,
    inEmergency: 0,
    inMaintenance: 0
  };
  displayedColumns: string[] = ['foto', 'nombre', 'placa', 'estado', 'acciones'];
  isLoading = true;
  filterForm: FormGroup;

  // Configuración de persistencia para filtros
  private persistenceConfig: FormPersistenceConfig = {
    key: 'vehicles_filters',
    autoSave: true,
    autoSaveDelay: 1000,
    storageType: 'localStorage',
    excludeFields: []
  };

  statusOptions = [
    { value: 'disponible', label: 'Disponible' },
    { value: 'en_emergencia', label: 'En Emergencia' },
    { value: 'en_mantenimiento', label: 'En Mantenimiento' }
  ];

  constructor(
    private vehiclesService: VehiclesService,
    private formPersistenceService: FormPersistenceService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      estado: ['']
    });
  }

  ngOnInit(): void {
    this.loadVehicles();
    this.setupFilters();
    this.restoreFilters();
    this.setupFilterPersistence();
  }

  setupFilters(): void {
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  applyFilters(): void {
    const searchTerm = this.filterForm.get('search')?.value.toLowerCase();
    const estadoFilter = this.filterForm.get('estado')?.value;

    this.filteredVehicles = this.vehicles.filter(vehicle => {
      const matchesSearch = !searchTerm || 
        vehicle.name.toLowerCase().includes(searchTerm) ||
        vehicle.plate.toLowerCase().includes(searchTerm);

      const matchesEstado = !estadoFilter || vehicle.status === estadoFilter;

      return matchesSearch && matchesEstado;
    });
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.filteredVehicles = [...this.vehicles];
  }

  loadVehicles(): void {
    this.isLoading = true;
    this.vehiclesService.getVehicles().subscribe({
      next: (vehicles) => {
        this.vehicles = vehicles;
        this.filteredVehicles = [...vehicles];
        this.loadStats();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error cargando vehículos:', error);
        this.snackBar.open('Error al cargar los vehículos', 'Cerrar', {
          duration: 3000
        });
        this.isLoading = false;
      }
    });
  }

  loadStats(): void {
    this.vehiclesService.getVehicleStats().subscribe({
      next: (stats) => {
        this.stats = stats;
      },
      error: (error) => {
        console.error('Error cargando estadísticas:', error);
      }
    });
  }

  openVehicleForm(vehicle?: Vehicle): void {
    const dialogRef = this.dialog.open(VehicleFormComponent, {
      width: '500px',
      data: vehicle
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadVehicles();
      }
    });
  }

  deleteVehicle(vehicle: Vehicle): void {
    if (confirm(`¿Está seguro de eliminar el vehículo ${vehicle.name}?`)) {
      this.vehiclesService.deleteVehicle(vehicle.vehicleId).subscribe({
        next: () => {
          this.snackBar.open('Vehículo eliminado con éxito', 'Cerrar', {
            duration: 3000
          });
          this.loadVehicles();
        },
        error: (error) => {
          console.error('Error eliminando vehículo:', error);
          this.snackBar.open('Error al eliminar el vehículo', 'Cerrar', {
            duration: 3000
          });
        }
      });
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'disponible':
        return 'green';
      case 'en_emergencia':
        return 'red';
      case 'en_mantenimiento':
        return 'orange';
      default:
        return 'gray';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'disponible':
        return 'Disponible';
      case 'en_emergencia':
        return 'En Emergencia';
      case 'en_mantenimiento':
        return 'En Mantenimiento';
      default:
        return status;
    }
  }

  // ===== MÉTODOS DE PERSISTENCIA DE FILTROS =====

  private restoreFilters(): void {
    try {
      const savedData = this.formPersistenceService.loadFormData(this.persistenceConfig);
      
      if (savedData) {
        setTimeout(() => {
          this.filterForm.patchValue(savedData, { emitEvent: false });
          console.log('✅ Filtros de vehículos restaurados:', savedData);
          
          // Aplicar filtros restaurados
          this.applyFilters();
        }, 100);
      }
    } catch (error) {
      console.error('Error al restaurar filtros de vehículos:', error);
    }
  }

  private setupFilterPersistence(): void {
    this.formPersistenceService.setupAutoSave(this.filterForm, this.persistenceConfig);
  }

  saveFilters(): void {
    this.formPersistenceService.saveFormData(this.filterForm, this.persistenceConfig);
    this.snackBar.open('Filtros guardados', 'Cerrar', { duration: 2000 });
  }

  clearSavedFilters(): void {
    this.formPersistenceService.clearFormData(this.persistenceConfig);
    this.filterForm.reset();
    this.snackBar.open('Filtros limpiados', 'Cerrar', { duration: 2000 });
  }

  getFiltersInfo(): { exists: boolean; timestamp?: string; size?: number } {
    return this.formPersistenceService.getFormDataInfo(this.persistenceConfig);
  }
} 