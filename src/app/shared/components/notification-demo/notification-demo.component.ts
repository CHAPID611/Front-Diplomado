import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-notification-demo',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatIconModule],
  template: `
    <mat-card class="demo-card">
      <mat-card-header>
        <mat-card-title>
          <mat-icon style="vertical-align: middle; margin-right: 8px;">notifications</mat-icon>
          Notificaciones Personalizadas
        </mat-card-title>
        <mat-card-subtitle>Ejemplos de notificaciones estilizadas</mat-card-subtitle>
      </mat-card-header>
      
      <mat-card-content>
        <div class="demo-buttons">
          <button mat-raised-button color="primary" (click)="showSuccess()">
            <mat-icon>check_circle</mat-icon>
            Éxito
          </button>
          
          <button mat-raised-button color="warn" (click)="showError()">
            <mat-icon>error</mat-icon>
            Error
          </button>
          
          <button mat-raised-button style="background: #f59e0b; color: white;" (click)="showWarning()">
            <mat-icon>warning</mat-icon>
            Advertencia
          </button>
          
          <button mat-raised-button color="accent" (click)="showInfo()">
            <mat-icon>info</mat-icon>
            Información
          </button>
          
          <button mat-raised-button (click)="showWithAction()">
            <mat-icon>touch_app</mat-icon>
            Con Acción
          </button>
          
          <button mat-raised-button (click)="showPersistent()">
            <mat-icon>push_pin</mat-icon>
            Persistente
          </button>
          
          <button mat-stroked-button (click)="clearAll()">
            <mat-icon>clear_all</mat-icon>
            Limpiar Todas
          </button>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .demo-card {
      margin: 20px;
      max-width: 600px;
    }
    
    .demo-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
    }
    
    .demo-buttons button {
      border-radius: 8px;
      font-weight: 500;
    }
  `]
})
export class NotificationDemoComponent {
  
  constructor(private notificationService: NotificationService) {}

  showSuccess() {
    this.notificationService.success(
      'Operación Exitosa',
      'La acción se completó correctamente.'
    );
  }

  showError() {
    this.notificationService.error(
      'Error del Sistema',
      'Hubo un problema al procesar la solicitud. Inténtalo nuevamente.'
    );
  }

  showWarning() {
    this.notificationService.warning(
      'Advertencia Importante',
      'Por favor revisa los datos antes de continuar.'
    );
  }

  showInfo() {
    this.notificationService.info(
      'Información',
      'Esta es una notificación informativa para el usuario.'
    );
  }

  showWithAction() {
    this.notificationService.success(
      'Archivo Guardado',
      'Tu documento se guardó exitosamente.',
      {
        action: 'Ver Archivo',
        duration: 8000
      }
    );
  }

  showPersistent() {
    this.notificationService.warning(
      'Acción Requerida',
      'Esta notificación requiere tu atención inmediata.',
      {
        duration: 0, // No se cierra automáticamente
        action: 'Entendido'
      }
    );
  }

  clearAll() {
    this.notificationService.clearAll();
  }
} 