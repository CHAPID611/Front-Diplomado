import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { trigger, state, style, transition, animate } from '@angular/animations';

export interface NotificationData {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: string;
  dismissible?: boolean;
}

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <div class="notification-container" [@slideIn]="'in'" [ngClass]="'notification-' + data.type">
      <div class="notification-content">
        <div class="notification-icon">
          <mat-icon>{{ getIcon() }}</mat-icon>
        </div>
        
        <div class="notification-text">
          <div class="notification-title">{{ data.title }}</div>
          <div class="notification-message">{{ data.message }}</div>
        </div>
        
        <div class="notification-actions">
          <button *ngIf="data.action" 
                  mat-button 
                  class="action-btn"
                  (click)="onAction()">
            {{ data.action }}
          </button>
          
          <button *ngIf="data.dismissible !== false" 
                  mat-icon-button 
                  class="close-btn"
                  (click)="onClose()">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>
      
      <div *ngIf="showProgressBar" class="progress-bar">
        <div class="progress-fill" [style.animation-duration.ms]="data.duration"></div>
      </div>
    </div>
  `,
  styles: [`
    .notification-container {
      min-width: 320px;
      max-width: 500px;
      margin: 8px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
      overflow: hidden;
      position: relative;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .notification-content {
      display: flex;
      align-items: flex-start;
      padding: 16px;
      gap: 12px;
    }

    .notification-icon {
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 2px;
    }

    .notification-icon mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .notification-text {
      flex: 1;
      min-width: 0;
    }

    .notification-title {
      font-weight: 600;
      font-size: 16px;
      line-height: 1.2;
      margin-bottom: 4px;
    }

    .notification-message {
      font-size: 14px;
      line-height: 1.4;
      opacity: 0.9;
    }

    .notification-actions {
      display: flex;
      align-items: flex-start;
      gap: 4px;
      flex-shrink: 0;
    }

    .action-btn {
      font-size: 13px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 4px 12px;
      border-radius: 6px;
      min-width: auto;
    }

    .close-btn {
      width: 28px;
      height: 28px;
      border-radius: 50%;
    }

    .close-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .progress-bar {
      height: 3px;
      background: rgba(255, 255, 255, 0.2);
      position: relative;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: rgba(255, 255, 255, 0.8);
      width: 100%;
      transform: translateX(-100%);
      animation: progressFill linear forwards;
    }

    /* Estilos por tipo de notificación */
    .notification-success {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
    }

    .notification-success .notification-icon {
      background: rgba(255, 255, 255, 0.2);
    }

    .notification-error {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
    }

    .notification-error .notification-icon {
      background: rgba(255, 255, 255, 0.2);
    }

    .notification-warning {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
    }

    .notification-warning .notification-icon {
      background: rgba(255, 255, 255, 0.2);
    }

    .notification-info {
      background: linear-gradient(135deg, #0e2868 0%, #1a3a7a 100%);
      color: white;
    }

    .notification-info .notification-icon {
      background: rgba(255, 255, 255, 0.2);
    }

    .action-btn {
      color: rgba(255, 255, 255, 0.9);
      background: rgba(255, 255, 255, 0.15);
    }

    .action-btn:hover {
      background: rgba(255, 255, 255, 0.25);
    }

    .close-btn {
      color: rgba(255, 255, 255, 0.7);
    }

    .close-btn:hover {
      background: rgba(255, 255, 255, 0.15);
      color: white;
    }

    @keyframes progressFill {
      to {
        transform: translateX(0);
      }
    }
  `],
  animations: [
    trigger('slideIn', [
      state('in', style({ transform: 'translateX(0)', opacity: 1 })),
      transition('void => *', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)')
      ]),
      transition('* => void', [
        animate('200ms cubic-bezier(0.4, 0, 0.2, 1)', 
          style({ transform: 'translateX(100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class NotificationComponent implements OnInit {
  @Input() data!: NotificationData;
  @Output() closed = new EventEmitter<void>();
  @Output() actionClicked = new EventEmitter<void>();

  showProgressBar: boolean = false;

  ngOnInit() {
    this.showProgressBar = this.data.duration !== undefined && this.data.duration > 0;
  }

  getIcon(): string {
    switch (this.data.type) {
      case 'success': return 'check_circle';
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'info';
    }
  }

  onClose() {
    this.closed.emit();
  }

  onAction() {
    this.actionClicked.emit();
  }
} 