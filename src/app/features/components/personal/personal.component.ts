import { Component, OnInit, ViewChild } from '@angular/core';
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
import { NotificationService } from '../../../shared/services/notification.service';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { Personal, PersonalStats, Cualidad, Rango } from '../../../core/interfaces/personal.interface';
import { PersonalService } from '../../../core/services/personal.service';
import { AuthService } from '../../../core/services/auth.service';
import { FormPersistenceService, FormPersistenceConfig } from '../../../core/services/form-persistence.service';
import { PersonalFormComponent } from './personal-form/personal-form.component';
import { CualidadesDialogComponent } from './cualidades-dialog/cualidades-dialog.component';
import { PersonalDetailsComponent } from './personal-details/personal-details.component';

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
  estados: Array<{value: string, label: string}> = [];
  tiposSangre: any[] = []; // NUEVO: Tipos de sangre para conversión
  
  displayedColumns: string[] = ['foto', 'nombre', 'rango', 'estado', 'experiencia', 'cualidades', 'acciones'];
  
  filterForm: FormGroup;
  loading = false;

  // Configuración de persistencia para filtros
  private persistenceConfig: FormPersistenceConfig = {
    key: 'personal_filters',
    autoSave: true,
    autoSaveDelay: 1000,
    storageType: 'localStorage', // Los filtros pueden persistir entre sesiones
    excludeFields: []
  };

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  dataSource!: MatTableDataSource<Personal>;

  constructor(
    private personalService: PersonalService,
    private authService: AuthService,
    private formPersistenceService: FormPersistenceService,
    private dialog: MatDialog,
    private notificationService: NotificationService,
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
    this.restoreFilters();
    this.setupFilterPersistence();
  }

  loadData() {
    this.loading = true;
    
    // Cargar estados
    this.personalService.getEstados().subscribe({
      next: (estados) => {
        this.estados = estados.map(e => ({
          value: e.state.toLowerCase() === 'en licencia' ? 'licencia' : e.state.toLowerCase(),
          label: e.state
        }));
      },
      error: () => {
        this.estados = this.personalService.getEstadosStatic();
      }
    });
    
    // Primero cargar los catálogos
    Promise.all([
      // Cargar rangos
      new Promise<void>((resolve) => {
        this.personalService.getRangos().subscribe({
          next: (rangos) => {
            this.rangos = rangos;
            resolve();
          },
          error: (error) => {
            console.warn('Error al cargar rangos, usando mock:', error);
            this.rangos = [
              { rangeId: 1, range: 'Bombero Auxiliar' },
              { rangeId: 2, range: 'Bombero Profesional' },
              { rangeId: 3, range: 'Cabo' },
              { rangeId: 4, range: 'Sargento' },
              { rangeId: 5, range: 'Teniente' },
              { rangeId: 6, range: 'Capitán' }
            ];
            resolve();
          }
        });
      }),
      
      // NUEVO: Cargar tipos de sangre
      new Promise<void>((resolve) => {
        this.personalService.getTiposSangre().subscribe({
          next: (tipos) => {
            this.tiposSangre = tipos;
            resolve();
          },
          error: (error) => {
            console.warn('Error al cargar tipos de sangre, usando estáticos:', error);
            this.tiposSangre = this.personalService.getTiposSangreStatic().map((tipo, index) => ({
              bloodTypeId: index + 1,
              bloodType: tipo
            }));
            resolve();
          }
        });
      }),
      
      // Cargar cualidades
      new Promise<void>((resolve) => {
        this.personalService.getCualidades().subscribe({
          next: (cualidades) => {
            this.cualidades = cualidades;
            resolve();
          },
          error: (error) => {
            console.warn('Error al cargar cualidades, usando mock:', error);
            this.cualidades = [
              { competenciaId: 1, name: 'Primeros Auxilios', category: 'medica' },
              { competenciaId: 2, name: 'Paramedicina', category: 'medica' },
              { competenciaId: 3, name: 'Rescate Urbano', category: 'rescate' },
              { competenciaId: 4, name: 'Rescate Acuático', category: 'rescate' },
              { competenciaId: 5, name: 'Liderazgo', category: 'administrativa' }
            ];
            resolve();
          }
        });
      })
    ]).then(() => {
      // Una vez cargados los catálogos, cargar el personal
      this.personalService.getPersonal().subscribe(personal => {
        this.personal = personal.map(p => ({
          ...p,
          expandedQualifications: false
        }));
        this.filteredPersonal = [...this.personal];
        this.dataSource = new MatTableDataSource(this.personal);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.loading = false;
      });

      // Cargar estadísticas
      this.personalService.getPersonalStats().subscribe(stats => {
        this.stats = stats;
      });
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
      // Búsqueda por texto
      const matchesSearch = !filters.search || 
        `${persona.nombres} ${persona.apellidos}`.toLowerCase().includes(filters.search.toLowerCase()) ||
        persona.cedula.includes(filters.search) ||
        persona.email.toLowerCase().includes(filters.search.toLowerCase());
      
      // Filtro por estado
      const matchesEstado = !filters.estado || persona.estado === filters.estado;
      
      // Filtro por rango - comparar tanto ID como nombre
      const matchesRango = !filters.rango || 
        String(persona.rango) === String(filters.rango) ||
        this.getNombreRango(persona.rango).toLowerCase() === this.getNombreRango(filters.rango).toLowerCase();

      return matchesSearch && matchesEstado && matchesRango;
    });

    this.dataSource.data = this.filteredPersonal;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
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
          this.personalService.updatePersonal(personal.id!, result).subscribe({
            next: (response) => {
              this.notificationService.success('Personal Actualizado', 'Los datos del personal han sido actualizados exitosamente.');
              this.loadData();
            },
            error: (error) => {
              this.notificationService.error('Error al actualizar personal', 'No se pudo actualizar la información del personal. Intenta nuevamente.');
            }
          });
        } else {
          this.personalService.createPersonal(result).subscribe({
            next: (response) => {
              this.notificationService.success('Personal Registrado', 'El nuevo personal ha sido registrado exitosamente');
              this.loadData();
            },
            error: (error) => {
              this.notificationService.error('Error de Registro', 'No se pudo registrar el nuevo personal. Verifica los datos e intenta nuevamente.');
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
          this.notificationService.success('Personal Eliminado', 'El personal ha sido eliminado exitosamente');
          this.loadData();
        },
        error: () => {
          this.notificationService.error('Error de Eliminación', 'No se pudo eliminar el personal. Intenta nuevamente.');
        }
      });
    }
  }

  getNombreRango(rangoId: string | number): string {
    if (!rangoId) return 'Sin Rango';
    
    const rango = this.rangos.find(r => 
      String(r.rangeId) === String(rangoId) || 
      String(r.id) === String(rangoId)
    );
    
    if (rango) {
      return rango.range || String(rangoId);
    }
    
    return 'Rango Desconocido';
  }

  /**
   * NUEVO: Convierte ID de tipo de sangre a nombre legible
   */
  getNombreTipoSangre(tipoSangreId: string | number): string {
    if (!tipoSangreId) return 'No especificado';
    
    // Si ya es un nombre de tipo de sangre (string conocido), retornarlo
    const tiposSangreConocidos = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    if (tiposSangreConocidos.includes(String(tipoSangreId))) {
      return String(tipoSangreId);
    }
    
    // Si tenemos tipos de sangre cargados, buscar en ellos
    if (this.tiposSangre && this.tiposSangre.length > 0) {
      const tipoEncontrado = this.tiposSangre.find(tipo => 
        String(tipo.bloodTypeId) === String(tipoSangreId) ||
        tipo.bloodType === String(tipoSangreId)
      );
      
      if (tipoEncontrado) {
        return tipoEncontrado.bloodType;
      }
    }
    
    // Fallback con tipos estáticos
    const tiposEstaticos = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const indice = Number(tipoSangreId) - 1;
    if (indice >= 0 && indice < tiposEstaticos.length) {
      return tiposEstaticos[indice];
    }
    
    // Último fallback: retornar el ID como string
    return String(tipoSangreId);
  }

  getNombreCualidad(cualidadId: string | number): string {
    if (!cualidadId) return 'Sin Cualidad';
    
    const cualidad = this.cualidades.find(c => 
      String(c.competenciaId) === String(cualidadId)
    );
    
    if (cualidad) {
      return cualidad.name || String(cualidadId);
    }
    
    return 'Cualidad Desconocida';
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
    const estadoObj = this.estados.find(e => e.value === estado);
    return estadoObj ? estadoObj.label : estado;
  }

  clearFilters() {
    this.filterForm.reset();
  }
  // Métodos de validación de permisos para administrador
  isAdmin(): boolean {
    const userRole = this.authService.getUserRole();
    const isAdmin = userRole === 'admin' || userRole === 'ADMIN' || userRole === 'Administrador';
    return isAdmin;
  }

  canCreatePersonal(): boolean {
    return this.isAdmin();
  }

  canEditPersonal(): boolean {
    return this.isAdmin();
  }

  canDeletePersonal(): boolean {
    return this.isAdmin();
  }

  // Método mejorado para abrir formulario con validaciones
  openPersonalFormWithValidation(personal?: Personal) {
    if (!this.isAdmin()) {
      this.notificationService.warning(
        'Acceso Restringido',
        'Solo los administradores pueden gestionar personal del sistema.',
        { duration: 5000 }
      );
      return;
    }

    if (!personal && !this.canCreatePersonal()) {
      this.notificationService.warning('Permisos Insuficientes', 'No tienes permisos para crear nuevo personal.');
      return;
    }

    if (personal && !this.canEditPersonal()) {
      this.notificationService.warning('Permisos Insuficientes', 'No tienes permisos para editar información del personal.');
      return;
    }

    this.openPersonalForm(personal);
  }

  // Método mejorado para eliminar con validaciones
  deletePersonalWithValidation(personal: Personal) {
    if (!this.canDeletePersonal()) {
      this.notificationService.warning('Permisos Insuficientes', 'No tienes permisos para eliminar personal del sistema.');
      return;
    }

    this.deletePersonal(personal);
  }

  openCualidadesDialog(persona: Personal) {
    const cualidadesCompletas = persona.cualidades.map(cualidadId => {
      const cualidad = this.cualidades.find(c => String(c.competenciaId) === String(cualidadId));
      return cualidad || { competenciaId: cualidadId, name: 'Desconocida', category: 'otra' };
    });

    this.dialog.open(CualidadesDialogComponent, {
      width: '600px',
      data: {
        nombres: persona.nombres,
        apellidos: persona.apellidos,
        cualidades: cualidadesCompletas,
        getCualidadNombre: (id: string) => this.getNombreCualidad(id)
      }
    });
  }

  toggleQualifications(persona: Personal) {
    persona.expandedQualifications = !persona.expandedQualifications;
  }

  openPersonalDetails(persona: Personal) {
    const dialogRef = this.dialog.open(PersonalDetailsComponent, {
      width: '800px',
      data: {
        personal: persona,
        getNombreRango: (id: string) => this.getNombreRango(id),
        getNombreCualidad: (id: string) => this.getNombreCualidad(id),
        getEstadoLabel: (estado: string) => this.getEstadoLabel(estado),
        getNombreTipoSangre: (id: string) => this.getNombreTipoSangre(id), // NUEVO: Método para tipo de sangre
        canEdit: this.canEditPersonal(),
        onEdit: () => {
          dialogRef.close();
          this.openPersonalFormWithValidation(persona);
        }
      }
    });
  }

  // ===== MÉTODOS DE PERSISTENCIA DE FILTROS =====

  private restoreFilters(): void {
    try {
      const savedData = this.formPersistenceService.loadFormData(this.persistenceConfig);
      
      if (savedData) {
        setTimeout(() => {
          this.filterForm.patchValue(savedData, { emitEvent: false });          
          // Aplicar filtros restaurados
          this.applyFilters();
        }, 100);
      }
    } catch (error) {
    }
  }

  private setupFilterPersistence(): void {
    this.formPersistenceService.setupAutoSave(this.filterForm, this.persistenceConfig);
  }

  saveFilters(): void {
    this.formPersistenceService.saveFormData(this.filterForm, this.persistenceConfig);
    this.notificationService.success('Filtros Guardados', 'Los filtros han sido guardados correctamente.');
  }

  clearSavedFilters(): void {
    this.formPersistenceService.clearFormData(this.persistenceConfig);
    this.filterForm.reset();
    this.notificationService.success('Filtros Limpiados', 'Los filtros han sido restablecidos correctamente.');
  }

  getFiltersInfo(): { exists: boolean; timestamp?: string; size?: number } {
    return this.formPersistenceService.getFormDataInfo(this.persistenceConfig);
  }
} 