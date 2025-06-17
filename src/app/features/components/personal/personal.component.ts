import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { Personal, PersonalStats, Cualidad, Rango } from '../../../core/interfaces/personal.interface';
import { PersonalService } from '../../../core/services/personal.service';
import { PersonalFormComponent } from './personal-form/personal-form.component';

@Component({
  selector: 'app-personal',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    MatSnackBarModule,
    MatMenuModule,
    MatTooltipModule,
    MatDividerModule,
    ReactiveFormsModule
  ],
  templateUrl: './personal.component.html',
  styleUrls: ['./personal.component.css']
})
export class PersonalComponent implements OnInit {
  personal: Personal[] = [];
  filteredPersonal: Personal[] = [];
  stats: PersonalStats | null = null;
  cualidades: any[] = [];
  rangos: any[] = [];
  
  displayedColumns: string[] = ['foto', 'nombre', 'rango', 'estado', 'experiencia', 'cualidades', 'acciones'];
  
  filterForm: FormGroup;
  loading = false;

  constructor(
    private personalService: PersonalService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      estado: [''],
      rango: ['']
    });
  }

  ngOnInit() {
    this.loadData();
    this.setupFilters();
  }

  loadData() {
    this.loading = true;
    
    // Cargar personal
    this.personalService.getPersonal().subscribe(personal => {
      this.personal = personal;
      this.filteredPersonal = [...personal];
      this.loading = false;
    });

    // Cargar estadísticas
    this.personalService.getPersonalStats().subscribe(stats => {
      this.stats = stats;
    });

    // Cargar datos de catálogos
    this.personalService.getCualidades().subscribe(cualidades => {
      this.cualidades = cualidades;
    });

    this.personalService.getRangos().subscribe(rangos => {
      this.rangos = rangos;
    });
  }

  setupFilters() {
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  applyFilters() {
    const filters = this.filterForm.value;
    
    this.filteredPersonal = this.personal.filter(persona => {
      const matchesSearch = !filters.search || 
        `${persona.nombres} ${persona.apellidos}`.toLowerCase().includes(filters.search.toLowerCase()) ||
        persona.cedula.includes(filters.search) ||
        persona.email.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesEstado = !filters.estado || persona.estado === filters.estado;
      const matchesRango = !filters.rango || persona.rango === filters.rango;

      return matchesSearch && matchesEstado && matchesRango;
    });
  }

  openPersonalForm(personal?: Personal) {
    const dialogRef = this.dialog.open(PersonalFormComponent, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '95vh',
      data: { personal, rangos: this.rangos, cualidades: this.cualidades }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (personal) {
          // Actualizar
          this.personalService.updatePersonal(personal.id!, result).subscribe({
            next: () => {
              this.snackBar.open('Personal actualizado exitosamente', 'Cerrar', { duration: 3000 });
              this.loadData();
            },
            error: () => {
              this.snackBar.open('Error al actualizar personal', 'Cerrar', { duration: 3000 });
            }
          });
        } else {
          // Crear
          this.personalService.createPersonal(result).subscribe({
            next: () => {
              this.snackBar.open('Personal registrado exitosamente', 'Cerrar', { duration: 3000 });
              this.loadData();
            },
            error: () => {
              this.snackBar.open('Error al registrar personal', 'Cerrar', { duration: 3000 });
            }
          });
        }
      }
    });
  }

  deletePersonal(personal: Personal) {
    if (confirm(`¿Está seguro que desea eliminar a ${personal.nombres} ${personal.apellidos}?`)) {
      this.personalService.deletePersonal(personal.id!).subscribe({
        next: () => {
          this.snackBar.open('Personal eliminado exitosamente', 'Cerrar', { duration: 3000 });
          this.loadData();
        },
        error: () => {
          this.snackBar.open('Error al eliminar personal', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  getNombreRango(rangoId: string): string {
    const rango = this.rangos.find(r => r.id === rangoId);
    return rango ? rango.nombre : rangoId;
  }

  getNombreCualidad(cualidadId: string): string {
    const cualidad = this.cualidades.find(c => c.id === cualidadId);
    return cualidad ? cualidad.nombre : cualidadId;
  }

  getEstadoColor(estado: string): string {
    switch (estado) {
      case 'activo': return 'success';
      case 'inactivo': return 'danger';
      case 'licencia': return 'warning';
      default: return 'default';
    }
  }

  getEstadoLabel(estado: string): string {
    switch (estado) {
      case 'activo': return 'Activo';
      case 'inactivo': return 'Inactivo';
      case 'licencia': return 'En Licencia';
      default: return estado;
    }
  }

  clearFilters() {
    this.filterForm.reset();
  }

  exportData() {
    // TODO: Implementar exportación
    this.snackBar.open('Funcionalidad de exportación en desarrollo', 'Cerrar', { duration: 3000 });
  }
} 