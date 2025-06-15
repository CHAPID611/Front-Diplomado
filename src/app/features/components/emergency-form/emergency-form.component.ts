import { Component, OnInit } from '@angular/core';
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

import { EmergencyReportService } from '../../../core/services/emergency-report.service';
import { EmergencyReport, TipoEmergencia, PersonalDisponible, VehiculoDisponible, EvidenciaFotograficaData } from '../../../core/interfaces/emergency-report.interface';

interface EvidenciaFotografica {
  id: string;
  file: File;
  preview: string;
  descripcion: string;
  fecha: Date;
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
    MatProgressBarModule
  ],
  template: `
    <div class="form-container">
      <mat-card class="form-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>local_fire_department</mat-icon>
            Registro de Emergencia
          </mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="emergencyForm" (ngSubmit)="onSubmit()">
            
            <mat-stepper #stepper orientation="vertical">
              
              <!-- Paso 1: Información General -->
              <mat-step label="Información General" [stepControl]="informacionGeneralGroup">
                <ng-template matStepContent>
                  <div formGroupName="informacionGeneral" class="step-content">
                    
                    <div class="form-row">
                      <mat-form-field>
                        <mat-label>Fecha del Reporte</mat-label>
                        <input matInput [matDatepicker]="picker" formControlName="fechaReporte" required>
                        <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
                        <mat-datepicker #picker></mat-datepicker>
                      </mat-form-field>

                      <mat-form-field>
                        <mat-label>Quien Informa</mat-label>
                        <input matInput formControlName="quienInforma" required>
                      </mat-form-field>
                    </div>

                    <div class="form-row">
                      <mat-form-field>
                        <mat-label>Tipo de Emergencia</mat-label>
                        <mat-select formControlName="tipoEmergencia" required>
                          <mat-option *ngFor="let tipo of tiposEmergencia" [value]="tipo.id">
                            {{tipo.nombre}}
                          </mat-option>
                        </mat-select>
                      </mat-form-field>

                      <mat-form-field>
                        <mat-label>Vehículo</mat-label>
                        <mat-select formControlName="vehiculo" required>
                          <mat-option *ngFor="let vehiculo of vehiculosDisponibles" [value]="vehiculo.id">
                            {{vehiculo.nombre}}
                          </mat-option>
                        </mat-select>
                      </mat-form-field>
                    </div>

                    <mat-form-field class="full-width">
                      <mat-label>Ubicación</mat-label>
                      <textarea matInput formControlName="ubicacion" rows="2" required></textarea>
                    </mat-form-field>

                    <div class="turno-section">
                      <h3>
                        <mat-icon style="font-size: 18px; vertical-align: middle; margin-right: 8px;">schedule</mat-icon>
                        Turno
                      </h3>
                      
                      <mat-form-field *ngIf="!esTurnoSinConvenio" class="turno-numero">
                        <mat-label>Número de Turno</mat-label>
                        <input matInput type="number" formControlName="numeroTurno" min="1">
                      </mat-form-field>

                      <mat-checkbox 
                        formControlName="sinConvenio" 
                        (change)="onSinConvenioChange($event)"
                        class="sin-convenio-checkbox">
                        Turno sin Convenio
                      </mat-checkbox>
                    </div>

                    <div class="step-actions">
                      <button mat-raised-button color="primary" matStepperNext>Siguiente</button>
                    </div>
                  </div>
                </ng-template>
              </mat-step>

              <!-- Paso 2: Cronología -->
              <mat-step label="Cronología de Eventos" [stepControl]="cronologiaGroup">
                <ng-template matStepContent>
                  <div formGroupName="cronologia" class="step-content">
                    
                    <div class="time-section">
                      <h3>
                        <mat-icon style="font-size: 18px; vertical-align: middle; margin-right: 8px;">access_time</mat-icon>
                        Hora de Reporte
                      </h3>
                      <div class="time-group">
                        <mat-form-field>
                          <mat-label>Hora</mat-label>
                          <input matInput type="time" formControlName="horaReporte" required>
                        </mat-form-field>
                        <mat-form-field class="description-field">
                          <mat-label>Descripción del reporte</mat-label>
                          <textarea matInput formControlName="horaReporteDescripcion" rows="2"></textarea>
                        </mat-form-field>
                      </div>
                    </div>

                    <div class="time-section">
                      <h3>
                        <mat-icon style="font-size: 18px; vertical-align: middle; margin-right: 8px;">local_fire_department</mat-icon>
                        Hora de Salida
                      </h3>
                      <div class="time-group">
                        <mat-form-field>
                          <mat-label>Hora</mat-label>
                          <input matInput type="time" formControlName="horaSalida" required>
                        </mat-form-field>
                        <mat-form-field class="description-field">
                          <mat-label>Descripción de la salida</mat-label>
                          <textarea matInput formControlName="horaSalidaDescripcion" rows="2"></textarea>
                        </mat-form-field>
                      </div>
                    </div>

                    <div class="time-section">
                      <h3>
                        <mat-icon style="font-size: 18px; vertical-align: middle; margin-right: 8px;">place</mat-icon>
                        Hora de Llegada a la Escena
                      </h3>
                      <div class="time-group">
                        <mat-form-field>
                          <mat-label>Hora</mat-label>
                          <input matInput type="time" formControlName="horaLlegadaEscena" required>
                        </mat-form-field>
                        <mat-form-field class="description-field">
                          <mat-label>Descripción de la llegada</mat-label>
                          <textarea matInput formControlName="horaLlegadaEscenaDescripcion" rows="2"></textarea>
                        </mat-form-field>
                      </div>
                    </div>

                    <div class="time-section">
                      <h3>
                        <mat-icon style="font-size: 18px; vertical-align: middle; margin-right: 8px;">local_hospital</mat-icon>
                        Hora de Llegada al Hospital (Opcional)
                      </h3>
                      <div class="time-group">
                        <mat-form-field>
                          <mat-label>Hora</mat-label>
                          <input matInput type="time" formControlName="horaLlegadaHospital">
                        </mat-form-field>
                        <mat-form-field class="description-field">
                          <mat-label>Descripción de la llegada al hospital</mat-label>
                          <textarea matInput formControlName="horaLlegadaHospitalDescripcion" rows="2"></textarea>
                        </mat-form-field>
                      </div>
                    </div>

                    <div class="time-section">
                      <h3>
                        <mat-icon style="font-size: 18px; vertical-align: middle; margin-right: 8px;">home</mat-icon>
                        Hora de Regreso a la Estación
                      </h3>
                      <div class="time-group">
                        <mat-form-field>
                          <mat-label>Hora</mat-label>
                          <input matInput type="time" formControlName="horaRegresoEstacion" required>
                        </mat-form-field>
                        <mat-form-field class="description-field">
                          <mat-label>Descripción del regreso</mat-label>
                          <textarea matInput formControlName="horaRegresoEstacionDescripcion" rows="2"></textarea>
                        </mat-form-field>
                      </div>
                    </div>

                    <div class="step-actions">
                      <button mat-button matStepperPrevious>Anterior</button>
                      <button mat-raised-button color="primary" matStepperNext>Siguiente</button>
                    </div>
                  </div>
                </ng-template>
              </mat-step>

              <!-- Paso 3: Personal -->
              <mat-step label="Personal Interviniente" [stepControl]="personalGroup">
                <ng-template matStepContent>
                  <div formGroupName="personal" class="step-content">
                    
                    <div class="personal-section">
                      <h3>
                        <mat-icon style="font-size: 18px; vertical-align: middle; margin-right: 8px;">groups</mat-icon>
                        Unidades de Respuesta
                      </h3>
                      <p>Selecciona el personal que respondió a la emergencia:</p>
                      <div class="personal-grid">
                        <mat-checkbox 
                          *ngFor="let persona of personalDisponible" 
                          [value]="persona.nombre"
                          [checked]="isUnidadSelected(persona.nombre)"
                          (change)="onUnidadChange($event, persona.nombre)">
                          {{persona.nombre}} - {{persona.cargo}}
                        </mat-checkbox>
                      </div>
                      <div *ngIf="personalGroup.get('unidades')?.errors?.['required'] && personalGroup.get('unidades')?.touched" class="error-message">
                        Por favor selecciona al menos una unidad de respuesta
                      </div>
                    </div>

                    <mat-divider></mat-divider>

                    <div class="personal-section">
                      <h3>
                        <mat-icon style="font-size: 18px; vertical-align: middle; margin-right: 8px;">security</mat-icon>
                        Personal de Guardia
                      </h3>
                      <p>Selecciona el personal que prestó guardia durante la emergencia:</p>
                      <div class="personal-grid">
                        <mat-checkbox 
                          *ngFor="let persona of personalDisponible" 
                          [value]="persona.nombre"
                          [checked]="isGuardiaSelected(persona.nombre)"
                          (change)="onGuardiaChange($event, persona.nombre)">
                          {{persona.nombre}} - {{persona.cargo}}
                        </mat-checkbox>
                      </div>
                      <div *ngIf="personalGroup.get('guardia')?.errors?.['required'] && personalGroup.get('guardia')?.touched" class="error-message">
                        Por favor selecciona al menos una persona de guardia
                      </div>
                    </div>

                    <div class="step-actions">
                      <button mat-button matStepperPrevious>Anterior</button>
                      <button mat-raised-button color="primary" matStepperNext>Siguiente</button>
                    </div>
                  </div>
                </ng-template>
              </mat-step>

              <!-- Paso 4: Evidencias Fotográficas -->
              <mat-step label="Evidencias Fotográficas" [stepControl]="evidenciasGroup">
                <ng-template matStepContent>
                  <div formGroupName="evidencias" class="step-content">
                    
                    <h3>
                      <mat-icon style="font-size: 20px; vertical-align: middle; margin-right: 8px;">photo_camera</mat-icon>
                      Evidencias Fotográficas de la Emergencia
                    </h3>
                    
                    <div class="evidencias-info">
                      <p class="info-text">
                        <mat-icon>info</mat-icon>
                        Se requiere un mínimo de <strong>{{minPhotos}} fotografías</strong> que documenten la emergencia. 
                        Las imágenes deben ser en formato JPG, JPEG o PNG con un tamaño máximo de 5MB cada una.
                      </p>
                    </div>

                    <!-- Zona de carga de archivos -->
                    <div class="upload-section">
                      <div class="upload-area" (click)="fileInput.click()" 
                           [class.uploading]="isUploading"
                           [class.dragover]="false">
                        <mat-icon class="upload-icon">cloud_upload</mat-icon>
                        <h4>Subir Fotografías</h4>
                        <p>Haz clic aquí o arrastra las imágenes</p>
                        <input #fileInput type="file" 
                               multiple 
                               accept="image/jpeg,image/jpg,image/png" 
                               (change)="onFileSelected($event)" 
                               style="display: none;">
                      </div>
                      
                      <mat-progress-bar *ngIf="isUploading" mode="indeterminate" color="primary"></mat-progress-bar>
                      
                      <div class="upload-info">
                        <small>
                          <mat-icon>help_outline</mat-icon>
                          Formatos permitidos: JPG, JPEG, PNG | Tamaño máximo: 5MB por archivo
                        </small>
                      </div>
                    </div>

                    <!-- Lista de fotografías cargadas -->
                    <div class="photos-section" *ngIf="evidenciasFotograficas.length > 0">
                      <h4>
                        <mat-icon>photo_library</mat-icon>
                        Fotografías Cargadas ({{evidenciasFotograficas.length}}/{{minPhotos}} mínimo)
                      </h4>
                      
                      <div class="photos-grid">
                        <div *ngFor="let evidencia of evidenciasFotograficas" class="photo-card">
                          <div class="photo-preview">
                            <img [src]="evidencia.preview" [alt]="evidencia.file.name">
                            <button mat-icon-button 
                                    class="delete-btn" 
                                    color="warn" 
                                    (click)="removePhotography(evidencia.id)">
                              <mat-icon>delete</mat-icon>
                            </button>
                          </div>
                          
                          <div class="photo-info">
                            <div class="file-name">
                              <mat-icon>image</mat-icon>
                              {{evidencia.file.name}}
                            </div>
                            <div class="file-size">
                              {{(evidencia.file.size / 1024 / 1024).toFixed(2)}} MB
                            </div>
                            
                            <mat-form-field class="description-field">
                              <mat-label>Descripción de la imagen</mat-label>
                              <textarea matInput 
                                        rows="2" 
                                        [value]="evidencia.descripcion"
                                        (input)="updatePhotoDescription(evidencia.id, $any($event.target).value)"
                                        placeholder="Describe qué muestra esta fotografía...">
                              </textarea>
                            </mat-form-field>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Mensaje de validación -->
                    <div class="validation-message" 
                         [class.success]="isEvidenciasValid" 
                         [class.error]="!isEvidenciasValid && evidenciasGroup.get('fotografias')?.touched">
                      <mat-icon>{{isEvidenciasValid ? 'check_circle' : 'error'}}</mat-icon>
                      <span *ngIf="isEvidenciasValid">
                        ¡Perfecto! Has cargado {{evidenciasFotograficas.length}} fotografías.
                      </span>
                      <span *ngIf="!isEvidenciasValid && evidenciasGroup.get('fotografias')?.touched">
                        Debes cargar al menos {{minPhotos}} fotografías para continuar.
                      </span>
                    </div>

                    <div class="step-actions">
                      <button mat-button matStepperPrevious>Anterior</button>
                      <button mat-raised-button 
                              color="primary" 
                              matStepperNext 
                              [disabled]="!isEvidenciasValid">
                        Siguiente
                      </button>
                    </div>
                  </div>
                </ng-template>
              </mat-step>

              <!-- Paso 5: Revisión -->
              <mat-step label="Revisión y Envío">
                <ng-template matStepContent>
                  <div class="step-content">
                    <h3>
                      <mat-icon style="font-size: 20px; vertical-align: middle; margin-right: 8px;">assignment</mat-icon>
                      Revisión del Reporte
                    </h3>
                    
                    <!-- Debug info (solo para desarrollo) -->
                    <div class="debug-section" *ngIf="showDebugInfo">
                      <h4>
                        <mat-icon style="font-size: 18px; vertical-align: middle; margin-right: 8px;">bug_report</mat-icon>
                        Información de Debug:
                      </h4>
                      <p><strong>Formulario válido:</strong> {{emergencyForm.valid}}</p>
                      <p><strong>Información General válida:</strong> {{informacionGeneralGroup.valid}}</p>
                      <p><strong>Cronología válida:</strong> {{cronologiaGroup.valid}}</p>
                      <p><strong>Personal válido:</strong> {{personalGroup.valid}}</p>
                      <p><strong>Evidencias válidas:</strong> {{evidenciasGroup.valid}}</p>
                      <p><strong>Unidades seleccionadas:</strong> {{personalGroup.get('unidades')?.value?.length || 0}} - {{personalGroup.get('unidades')?.value | json}}</p>
                      <p><strong>Guardia seleccionada:</strong> {{personalGroup.get('guardia')?.value?.length || 0}} - {{personalGroup.get('guardia')?.value | json}}</p>
                      <p><strong>Fotografías cargadas:</strong> {{evidenciasFotograficas.length}}/{{minPhotos}} - {{isEvidenciasValid ? 'Válido' : 'Inválido'}}</p>
                      
                      <h5>Valores actuales del formulario:</h5>
                      <div class="debug-values">
                        <p><strong>Quien informa:</strong> "{{informacionGeneralGroup.get('quienInforma')?.value}}"</p>
                        <p><strong>Tipo emergencia:</strong> "{{informacionGeneralGroup.get('tipoEmergencia')?.value}}"</p>
                        <p><strong>Ubicación:</strong> "{{informacionGeneralGroup.get('ubicacion')?.value}}"</p>
                        <p><strong>Vehículo:</strong> "{{informacionGeneralGroup.get('vehiculo')?.value}}"</p>
                        <p><strong>Hora reporte:</strong> "{{cronologiaGroup.get('horaReporte')?.value}}"</p>
                        <p><strong>Hora salida:</strong> "{{cronologiaGroup.get('horaSalida')?.value}}"</p>
                        <p><strong>Hora llegada escena:</strong> "{{cronologiaGroup.get('horaLlegadaEscena')?.value}}"</p>
                        <p><strong>Hora regreso:</strong> "{{cronologiaGroup.get('horaRegresoEstacion')?.value}}"</p>
                      </div>
                    </div>
                    
                    <div *ngIf="previewDescription" class="preview-section">
                      <h4>Descripción Detallada Generada:</h4>
                      <div class="description-preview">
                        <pre>{{previewDescription}}</pre>
                      </div>
                    </div>

                    <!-- Resumen de evidencias fotográficas -->
                    <div *ngIf="evidenciasFotograficas.length > 0" class="evidencias-summary">
                      <h4>
                        <mat-icon>photo_library</mat-icon>
                        Resumen de Evidencias Fotográficas
                      </h4>
                      <div class="evidencias-grid-summary">
                        <div *ngFor="let evidencia of evidenciasFotograficas; let i = index" class="evidencia-summary-item">
                          <div class="evidencia-thumb">
                            <img [src]="evidencia.preview" [alt]="evidencia.file.name">
                            <span class="foto-number">{{i + 1}}</span>
                          </div>
                          <div class="evidencia-info-summary">
                            <div class="file-name-summary">{{evidencia.file.name}}</div>
                            <div class="file-description-summary" *ngIf="evidencia.descripcion">
                              "{{evidencia.descripcion}}"
                            </div>
                            <div class="file-size-summary">{{(evidencia.file.size / 1024 / 1024).toFixed(2)}} MB</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="step-actions">
                      <button mat-button matStepperPrevious>Anterior</button>
                      <button mat-button (click)="toggleDebugInfo()" color="warn">
                        <mat-icon>bug_report</mat-icon>
                        {{showDebugInfo ? 'Ocultar' : 'Mostrar'}} Debug
                      </button>
                      <button mat-button (click)="generatePreview()" color="accent">
                        <mat-icon>visibility</mat-icon>
                        Vista Previa
                      </button>
                      <button mat-raised-button color="primary" type="submit">
                        <mat-icon>save</mat-icon>
                        Guardar Reporte
                      </button>
                    </div>
                  </div>
                </ng-template>
              </mat-step>

            </mat-stepper>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .form-container {
      padding: 20px;
      max-width: 1000px;
      margin: 0 auto;
      background: #f8f9fa;
      min-height: 100vh;
    }

    .form-card {
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      border-radius: 12px;
      background: #ffffff;
      border: 1px solid #e9ecef;
    }

    .mat-mdc-card-header {
      background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
      border-bottom: 3px solid #c62828;
      border-radius: 12px 12px 0 0;
      padding: 24px;
    }

    .mat-mdc-card-title {
      color: #c62828;
      font-weight: 600;
      font-size: 24px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .mat-mdc-card-title mat-icon {
      color: #d32f2f;
      font-size: 28px;
    }

    .step-content {
      padding: 24px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }

    .full-width {
      width: 100%;
      margin-bottom: 20px;
    }

    .turno-section {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #c62828;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .turno-section h3 {
      margin: 0 0 16px 0;
      color: #2c3e50;
      font-size: 16px;
      font-weight: 600;
    }

    .turno-numero {
      margin: 0 0 16px 0;
      width: 200px;
    }

    .sin-convenio-checkbox {
      margin-top: 8px;
    }

    .sin-convenio-checkbox .mdc-checkbox {
      --mdc-checkbox-selected-checkmark-color: #ffffff;
      --mdc-checkbox-selected-focus-icon-color: #c62828;
      --mdc-checkbox-selected-hover-icon-color: #c62828;
      --mdc-checkbox-selected-icon-color: #c62828;
    }

    .time-section {
      background: #ffffff;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border: 1px solid #e9ecef;
      border-left: 4px solid #c62828;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .time-section h3 {
      margin: 0 0 16px 0;
      color: #2c3e50;
      font-size: 16px;
      font-weight: 600;
    }

    .time-group {
      display: grid;
      grid-template-columns: 200px 1fr;
      gap: 20px;
      align-items: start;
    }

    .description-field {
      margin: 0;
    }

    .personal-section {
      margin: 24px 0;
      background: #ffffff;
      padding: 20px;
      border-radius: 8px;
      border: 1px solid #e9ecef;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .personal-section h3 {
      color: #2c3e50;
      margin-bottom: 12px;
      font-weight: 600;
      border-bottom: 2px solid #c62828;
      padding-bottom: 8px;
    }

    .personal-section p {
      color: #6c757d;
      margin-bottom: 16px;
      font-size: 14px;
    }

    .personal-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 12px;
      margin: 16px 0;
    }

    .personal-grid mat-checkbox {
      padding: 8px;
      border-radius: 4px;
      transition: background-color 0.2s ease;
    }

    .personal-grid mat-checkbox:hover {
      background-color: #f8f9fa;
    }

    .personal-grid mat-checkbox .mdc-checkbox {
      --mdc-checkbox-selected-checkmark-color: #ffffff;
      --mdc-checkbox-selected-focus-icon-color: #c62828;
      --mdc-checkbox-selected-hover-icon-color: #c62828;
      --mdc-checkbox-selected-icon-color: #c62828;
    }

    .error-message {
      color: #dc3545;
      font-size: 12px;
      margin-top: 8px;
      padding: 12px;
      background: #f8d7da;
      border-radius: 4px;
      border-left: 3px solid #dc3545;
      border: 1px solid #f5c6cb;
    }

    /* Estilos para evidencias fotográficas */
    .evidencias-info {
      background: #e3f2fd;
      padding: 16px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #2196f3;
    }

    .evidencias-info .info-text {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      margin: 0;
      color: #1565c0;
      font-size: 14px;
      line-height: 1.5;
    }

    .evidencias-info mat-icon {
      color: #2196f3;
      font-size: 20px;
      margin-top: 2px;
    }

    .upload-section {
      margin: 24px 0;
    }

    .upload-area {
      border: 2px dashed #c62828;
      border-radius: 12px;
      padding: 40px 20px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
      background: #fafafa;
      position: relative;
    }

    .upload-area:hover {
      border-color: #b71c1c;
      background: #f5f5f5;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(198, 40, 40, 0.2);
    }

    .upload-area.uploading {
      pointer-events: none;
      opacity: 0.7;
      border-color: #9e9e9e;
    }

    .upload-icon {
      font-size: 48px;
      color: #c62828;
      margin-bottom: 16px;
    }

    .upload-area h4 {
      color: #2c3e50;
      margin: 0 0 8px 0;
      font-size: 18px;
      font-weight: 600;
    }

    .upload-area p {
      color: #6c757d;
      margin: 0;
      font-size: 14px;
    }

    .upload-info {
      margin-top: 12px;
      text-align: center;
    }

    .upload-info small {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      color: #6c757d;
      font-size: 12px;
    }

    .upload-info mat-icon {
      font-size: 16px;
      color: #9e9e9e;
    }

    .photos-section {
      margin: 32px 0;
    }

    .photos-section h4 {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #2c3e50;
      margin: 0 0 20px 0;
      font-size: 16px;
      font-weight: 600;
      border-bottom: 2px solid #c62828;
      padding-bottom: 8px;
    }

    .photos-section mat-icon {
      color: #c62828;
      font-size: 20px;
    }

    .photos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }

    .photo-card {
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e9ecef;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .photo-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    }

    .photo-preview {
      position: relative;
      height: 200px;
      overflow: hidden;
      background: #f8f9fa;
    }

    .photo-preview img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    .photo-card:hover .photo-preview img {
      transform: scale(1.05);
    }

    .delete-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      background: rgba(220, 53, 69, 0.9);
      color: white;
      backdrop-filter: blur(4px);
      transition: all 0.2s ease;
    }

    .delete-btn:hover {
      background: rgba(220, 53, 69, 1);
      transform: scale(1.1);
    }

    .photo-info {
      padding: 16px;
    }

    .file-name {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #2c3e50;
      font-weight: 500;
      font-size: 14px;
      margin-bottom: 4px;
      word-break: break-all;
    }

    .file-name mat-icon {
      color: #6c757d;
      font-size: 16px;
    }

    .file-size {
      color: #6c757d;
      font-size: 12px;
      margin-bottom: 12px;
    }

    .photo-info .description-field {
      width: 100%;
      margin: 0;
    }

    .validation-message {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      border-radius: 8px;
      margin: 20px 0;
      font-size: 14px;
      font-weight: 500;
      border: 1px solid;
    }

    .validation-message.success {
      background: #d4edda;
      color: #155724;
      border-color: #c3e6cb;
    }

    .validation-message.success mat-icon {
      color: #28a745;
    }

    .validation-message.error {
      background: #f8d7da;
      color: #721c24;
      border-color: #f5c6cb;
    }

    .validation-message.error mat-icon {
      color: #dc3545;
    }

    .step-actions {
      display: flex;
      gap: 12px;
      margin-top: 32px;
      padding-top: 20px;
      border-top: 1px solid #e9ecef;
    }

    .step-actions button {
      border-radius: 6px;
      font-weight: 500;
      text-transform: none;
      padding: 0 24px;
      height: 40px;
    }

    .step-actions .mat-mdc-raised-button.mat-primary {
      background-color: #c62828;
      color: white;
    }

    .step-actions .mat-mdc-raised-button.mat-primary:hover {
      background-color: #b71c1c;
      box-shadow: 0 4px 12px rgba(198, 40, 40, 0.3);
    }

    .step-actions .mat-mdc-button {
      color: #6c757d;
    }

    .step-actions .mat-mdc-button:hover {
      background-color: #f8f9fa;
      color: #495057;
    }

    .preview-section {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border: 1px solid #e9ecef;
    }

    .preview-section h4 {
      color: #2c3e50;
      margin-bottom: 16px;
      font-weight: 600;
    }

    .description-preview {
      background: #ffffff;
      padding: 20px;
      border-radius: 6px;
      border: 1px solid #dee2e6;
      max-height: 400px;
      overflow-y: auto;
      box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .description-preview pre {
      white-space: pre-wrap;
      font-family: 'Roboto', sans-serif;
      font-size: 14px;
      line-height: 1.6;
      margin: 0;
      color: #495057;
    }

    .debug-section {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border: 1px solid #dee2e6;
    }

    .debug-section h4 {
      margin: 0 0 16px 0;
      color: #6c757d;
      font-size: 16px;
      font-weight: 600;
    }

    .debug-section p {
      margin: 8px 0;
      font-size: 13px;
      font-family: 'Courier New', monospace;
      color: #495057;
    }

    .debug-values {
      margin-top: 16px;
      padding: 16px;
      background: #ffffff;
      border-radius: 4px;
      border-left: 3px solid #6c757d;
      border: 1px solid #dee2e6;
    }

    .debug-values p {
      margin: 4px 0;
      font-size: 12px;
    }

    .debug-section h5 {
      margin: 16px 0 8px 0;
      color: #6c757d;
      font-size: 14px;
      font-weight: 600;
    }

    /* Estilos para Angular Material */
    ::ng-deep .mat-mdc-form-field {
      margin-bottom: 16px;
    }

    ::ng-deep .mat-mdc-form-field .mat-mdc-text-field-wrapper {
      border-radius: 6px;
    }

    ::ng-deep .mat-mdc-form-field.mat-focused .mat-mdc-form-field-focus-overlay {
      background-color: rgba(198, 40, 40, 0.04);
    }

    ::ng-deep .mat-mdc-form-field.mat-focused .mat-mdc-floating-label {
      color: #c62828;
    }

    ::ng-deep .mat-mdc-select-panel {
      border-radius: 6px;
    }

    ::ng-deep .mat-mdc-option.mdc-list-item--selected:not(.mdc-list-item--disabled) {
      background-color: rgba(198, 40, 40, 0.08);
    }

    ::ng-deep .mat-mdc-option:hover:not(.mdc-list-item--disabled) {
      background-color: rgba(198, 40, 40, 0.04);
    }

    ::ng-deep .mat-step-header .mat-step-icon-selected {
      background-color: #c62828;
      color: white;
    }

    ::ng-deep .mat-step-header .mat-step-icon-state-done {
      background-color: #28a745;
      color: white;
    }

    ::ng-deep .mat-step-header .mat-step-icon {
      background-color: #6c757d;
      color: white;
    }

    ::ng-deep .mat-divider {
      border-top-color: #e9ecef;
      margin: 24px 0;
    }

    /* Estilos para resumen de evidencias en revisión */
    .evidencias-summary {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border: 1px solid #e9ecef;
      border-left: 4px solid #2196f3;
    }

    .evidencias-summary h4 {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #2c3e50;
      margin: 0 0 16px 0;
      font-size: 16px;
      font-weight: 600;
      border-bottom: 2px solid #2196f3;
      padding-bottom: 8px;
    }

    .evidencias-summary mat-icon {
      color: #2196f3;
      font-size: 18px;
    }

    .evidencias-grid-summary {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 16px;
      margin-top: 16px;
    }

    .evidencia-summary-item {
      display: flex;
      gap: 12px;
      background: #ffffff;
      padding: 12px;
      border-radius: 8px;
      border: 1px solid #dee2e6;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .evidencia-thumb {
      position: relative;
      flex-shrink: 0;
      width: 60px;
      height: 60px;
      border-radius: 6px;
      overflow: hidden;
      background: #f8f9fa;
    }

    .evidencia-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .foto-number {
      position: absolute;
      top: 2px;
      right: 2px;
      background: rgba(198, 40, 40, 0.9);
      color: white;
      font-size: 10px;
      font-weight: bold;
      padding: 2px 6px;
      border-radius: 3px;
      min-width: 16px;
      text-align: center;
    }

    .evidencia-info-summary {
      flex: 1;
      min-width: 0;
    }

    .file-name-summary {
      font-weight: 500;
      font-size: 13px;
      color: #2c3e50;
      margin-bottom: 4px;
      word-break: break-all;
      line-height: 1.3;
    }

    .file-description-summary {
      font-size: 12px;
      color: #6c757d;
      font-style: italic;
      margin-bottom: 4px;
      line-height: 1.3;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .file-size-summary {
      font-size: 11px;
      color: #9e9e9e;
      font-weight: 500;
    }

    @media (max-width: 768px) {
      .form-container {
        padding: 12px;
        background: #ffffff;
      }

      .form-card {
        box-shadow: none;
        border: none;
        border-radius: 0;
      }

      .mat-mdc-card-header {
        padding: 16px;
        border-radius: 0;
      }

      .step-content {
        padding: 16px;
      }

      .form-row {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .time-group {
        grid-template-columns: 1fr;
        gap: 12px;
      }

      .personal-grid {
        grid-template-columns: 1fr;
      }

      .turno-section, .time-section, .personal-section {
        margin: 16px 0;
        padding: 16px;
      }

      /* Responsive para evidencias fotográficas */
      .photos-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .upload-area {
        padding: 30px 15px;
      }

      .upload-icon {
        font-size: 36px;
      }

      .upload-area h4 {
        font-size: 16px;
      }

      .evidencias-info {
        margin: 16px 0;
        padding: 12px;
      }

      .photo-preview {
        height: 160px;
      }

      .photo-info {
        padding: 12px;
      }

      /* Responsive para resumen de evidencias */
      .evidencias-grid-summary {
        grid-template-columns: 1fr;
        gap: 12px;
      }

      .evidencia-summary-item {
        padding: 10px;
        gap: 10px;
      }

      .evidencia-thumb {
        width: 50px;
        height: 50px;
      }

      .evidencias-summary {
        margin: 16px 0;
        padding: 16px;
      }
    }
  `]
})
export class EmergencyFormComponent implements OnInit {
  emergencyForm!: FormGroup;
  tiposEmergencia: TipoEmergencia[] = [];
  personalDisponible: PersonalDisponible[] = [];
  vehiculosDisponibles: VehiculoDisponible[] = [];
  esTurnoSinConvenio = false;
  previewDescription = '';
  showDebugInfo = false;

  // Propiedades para evidencias fotográficas
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
    this.loadFormData();
    this.updateShowNumeroTurno();
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
        horaLlegadaEscena: ['', Validators.required],
        horaLlegadaEscenaDescripcion: [''],
        horaLlegadaHospital: [''],
        horaLlegadaHospitalDescripcion: [''],
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
    return this.emergencyForm.get('informacionGeneral') as FormGroup;
  }

  get cronologiaGroup() {
    return this.emergencyForm.get('cronologia') as FormGroup;
  }

  get personalGroup() {
    return this.emergencyForm.get('personal') as FormGroup;
  }

  get evidenciasGroup() {
    return this.emergencyForm.get('evidencias') as FormGroup;
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
    this.markFormGroupTouched(this.emergencyForm);
    
    if (this.emergencyForm.valid) {
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
      valid: this.emergencyForm.valid,
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
    const form = this.emergencyForm.value;
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
      horaLlegadaEscena: form.cronologia.horaLlegadaEscena,
      horaLlegadaEscenaDescripcion: form.cronologia.horaLlegadaEscenaDescripcion || '',
      horaLlegadaHospital: form.cronologia.horaLlegadaHospital || '',
      horaLlegadaHospitalDescripcion: form.cronologia.horaLlegadaHospitalDescripcion || '',
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
      }))
    };
  }

  onSubmit(): void {
    this.markFormGroupTouched(this.emergencyForm);
    
    console.log('Intentando enviar formulario...');
    console.log('Formulario válido:', this.emergencyForm.valid);
    console.log('Valores del formulario:', this.emergencyForm.value);
    
    if (this.emergencyForm.valid) {
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
} 