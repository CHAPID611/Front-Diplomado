import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { Personal } from '../../../../core/interfaces/personal.interface';

@Component({
  selector: 'app-personal-details',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatChipsModule,
    MatIconModule,
    MatDividerModule,
    MatButtonModule
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-content">
        <div class="details-container">
          <!-- Encabezado -->
          <div class="header">
            <div class="profile-info">
              <div class="avatar">
                <mat-icon>person</mat-icon>
              </div>
              <div class="basic-info">
                <h2>{{ data.personal.nombres }} {{ data.personal.apellidos }}</h2>
                <div class="subtitle">
                  <mat-chip [ngClass]="'estado-' + data.personal.estado">
                    {{ data.getEstadoLabel(data.personal.estado) }}
                  </mat-chip>
                  <span class="rango">{{ data.getNombreRango(data.personal.rango) }}</span>
                </div>
              </div>
            </div>
          </div>

          <mat-divider></mat-divider>

          <!-- Información Laboral -->
          <section class="info-section">
            <h3>
              <mat-icon>work</mat-icon>
              Información Laboral
            </h3>
            <div class="info-grid">
              <div class="info-item">
                <label>Fecha de Ingreso</label>
                <span>{{ data.personal.fechaIngreso | date:'dd/MM/yyyy' }}</span>
              </div>
              <div class="info-item">
                <label>Experiencia</label>
                <span>{{ data.personal.experienciaAnios }} años</span>
              </div>
              <div class="info-item">
                <label>Rango</label>
                <span>{{ data.getNombreRango(data.personal.rango) }}</span>
              </div>
              <div class="info-item">
                <label>Estado</label>
                <span>{{ data.getEstadoLabel(data.personal.estado) }}</span>
              </div>
            </div>
          </section>

          <mat-divider></mat-divider>

          <!-- Información Personal -->
          <section class="info-section">
            <h3>
              <mat-icon>badge</mat-icon>
              Información Personal
            </h3>
            <div class="info-grid">
              <div class="info-item">
                <label>Cédula</label>
                <span>{{ data.personal.cedula }}</span>
              </div>
              <div class="info-item">
                <label>Email</label>
                <span>{{ data.personal.email }}</span>
              </div>
              <div class="info-item">
                <label>Teléfono</label>
                <span>{{ data.personal.telefono }}</span>
              </div>
              <div class="info-item">
                <label>Dirección</label>
                <span>{{ data.personal.direccion }}</span>
              </div>
              <div class="info-item">
                <label>Fecha de Nacimiento</label>
                <span>{{ data.personal.fechaNacimiento | date:'dd/MM/yyyy' }}</span>
              </div>
              <div class="info-item">
                <label>Tipo de Sangre</label>
                <span>{{ data.personal.tipoSangre }}</span>
              </div>
            </div>
          </section>

          <mat-divider></mat-divider>

          <!-- Contacto de Emergencia -->
          <section class="info-section" *ngIf="data.personal.contactoEmergencia">
            <h3>
              <mat-icon>contact_emergency</mat-icon>
              Contacto de Emergencia
            </h3>
            <div class="info-grid">
              <div class="info-item">
                <label>Nombre</label>
                <span>{{ data.personal.contactoEmergencia.nombre }}</span>
              </div>
              <div class="info-item">
                <label>Parentesco</label>
                <span>{{ data.personal.contactoEmergencia.parentesco }}</span>
              </div>
              <div class="info-item">
                <label>Teléfono</label>
                <span>{{ data.personal.contactoEmergencia.telefono }}</span>
              </div>
            </div>
          </section>

          <mat-divider></mat-divider>

          <!-- Cualidades y Competencias -->
          <section class="info-section">
            <h3>
              <mat-icon>star</mat-icon>
              Cualidades y Competencias
            </h3>
            <div class="cualidades-container">
              <mat-chip-listbox>
                <mat-chip *ngFor="let cualidad of data.personal.cualidades">
                  {{ data.getNombreCualidad(cualidad) }}
                </mat-chip>
              </mat-chip-listbox>
            </div>
          </section>

          <!-- Observaciones -->
          <section class="info-section" *ngIf="data.personal.observaciones">
            <h3>
              <mat-icon>notes</mat-icon>
              Observaciones
            </h3>
            <p class="observaciones">{{ data.personal.observaciones }}</p>
          </section>
        </div>
      </div>

      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>Cerrar</button>
        <button mat-raised-button color="primary" *ngIf="data.canEdit" (click)="data.onEdit()">
          <mat-icon>edit</mat-icon>
          Editar
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container {
      display: flex;
      flex-direction: column;
      height: 90vh;
      max-height: 90vh;
    }

    .dialog-content {
      flex: 1;
      overflow-y: auto;
      padding: 0 24px;
    }

    .details-container {
      padding: 24px 0;
      max-width: 800px;
      margin: 0 auto;
    }

    mat-dialog-actions {
      padding: 12px 24px;
      margin: 0;
      background: white;
      border-top: 1px solid rgba(0, 0, 0, 0.12);
    }

    .header {
      margin-bottom: 24px;
      position: sticky;
      top: 0;
      background: white;
      z-index: 1;
      padding: 12px 0;
    }

    .profile-info {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background-color: #f5f5f5;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .avatar mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #666;
    }

    .basic-info h2 {
      margin: 0;
      font-size: 24px;
      color: #333;
    }

    .subtitle {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 8px;
    }

    .rango {
      color: #666;
      font-size: 16px;
    }

    .info-section {
      margin: 24px 0;
    }

    .info-section h3 {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #333;
      font-size: 18px;
      margin-bottom: 16px;
    }

    .info-section mat-icon {
      color: #666;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .info-item label {
      color: #666;
      font-size: 14px;
    }

    .info-item span {
      color: #333;
      font-size: 16px;
    }

    .cualidades-container {
      margin-top: 16px;
    }

    mat-chip-listbox {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .observaciones {
      color: #666;
      font-style: italic;
      line-height: 1.5;
    }

    .estado-activo {
      background-color: #4caf50 !important;
      color: white !important;
    }

    .estado-licencia {
      background-color: #ff9800 !important;
      color: white !important;
    }
  `]
})
export class PersonalDetailsComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {
      personal: Personal;
      getNombreRango: (id: string) => string;
      getNombreCualidad: (id: string) => string;
      getEstadoLabel: (estado: string) => string;
      canEdit: boolean;
      onEdit: () => void;
    }
  ) {}
} 