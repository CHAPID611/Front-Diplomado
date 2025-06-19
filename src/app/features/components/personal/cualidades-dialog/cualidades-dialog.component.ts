import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-cualidades-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatChipsModule,
    MatIconModule,
    MatDividerModule

  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>star</mat-icon>
      Cualidades de {{ data.nombres }} {{ data.apellidos }}
    </h2>
    
    <mat-dialog-content>
      <div class="cualidades-container">
        <div *ngFor="let categoria of categorias" class="categoria-section">
          <h3>
            <mat-icon>{{ getCategoriaIcon(categoria) }}</mat-icon>
            {{ getCategoriaLabel(categoria) }}
          </h3>
          <div class="cualidades-list">
            <mat-chip *ngFor="let cualidad of getCualidadesPorCategoria(categoria)">
              {{ cualidad.name }}
            </mat-chip>
          </div>
          <mat-divider *ngIf="!isLastCategoria(categoria)"></mat-divider>
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .cualidades-container {
      padding: 16px;
      max-height: 400px;
      overflow-y: auto;
    }
    
    .categoria-section {
      margin-bottom: 16px;
    }
    
    h3 {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #666;
      margin-bottom: 12px;
    }
    
    .cualidades-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 16px;
    }
    
    mat-chip {
      background-color: #e0e0e0;
    }
    
    mat-dialog-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    mat-icon {
      color: #666;
    }
  `]
})
export class CualidadesDialogComponent {
  categorias = ['medica', 'rescate', 'tecnica', 'operativa', 'administrativa'];
  cualidadesAgrupadas: { [key: string]: any[] } = {};

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {
      nombres: string;
      apellidos: string;
      cualidades: any[];
      getCualidadNombre: (id: string) => string;
    }
  ) {
    this.agruparCualidadesPorCategoria();
  }

  private agruparCualidadesPorCategoria() {
    this.categorias.forEach(categoria => {
      this.cualidadesAgrupadas[categoria] = this.data.cualidades.filter(c => c.category === categoria);
    });
  }

  getCualidadesPorCategoria(categoria: string): any[] {
    return this.cualidadesAgrupadas[categoria] || [];
  }

  getCategoriaLabel(categoria: string): string {
    const labels = {
      'medica': 'Competencias Médicas',
      'rescate': 'Operaciones de Rescate',
      'tecnica': 'Competencias Técnicas',
      'operativa': 'Habilidades Operativas',
      'administrativa': 'Competencias Administrativas'
    };
    return labels[categoria as keyof typeof labels] || categoria;
  }

  getCategoriaIcon(categoria: string): string {
    const icons = {
      'medica': 'local_hospital',
      'rescate': 'safety_divider',
      'tecnica': 'engineering',
      'operativa': 'settings',
      'administrativa': 'admin_panel_settings'
    };
    return icons[categoria as keyof typeof icons] || 'star';
  }

  isLastCategoria(categoria: string): boolean {
    return this.categorias.indexOf(categoria) === this.categorias.length - 1;
  }
} 