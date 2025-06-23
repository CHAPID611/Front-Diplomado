import { Injectable, ApplicationRef, ComponentRef, createComponent, EnvironmentInjector, inject } from '@angular/core';
import { NotificationComponent, NotificationData } from '../components/notification/notification.component';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private applicationRef = inject(ApplicationRef);
  private injector = inject(EnvironmentInjector);
  private container: HTMLElement | null = null;
  private notifications: ComponentRef<NotificationComponent>[] = [];

  constructor() {
    this.createContainer();
  }

  private createContainer() {
    if (typeof document !== 'undefined') {
      this.container = document.createElement('div');
      this.container.className = 'notification-container-overlay';
      this.container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        pointer-events: none;
        max-height: calc(100vh - 40px);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 12px;
      `;
      document.body.appendChild(this.container);
    }
  }

  show(data: NotificationData): ComponentRef<NotificationComponent> {
    if (!this.container) return null as any;

    // Crear el componente de notificación
    const componentRef = createComponent(NotificationComponent, {
      environmentInjector: this.injector
    });

    // Configurar los datos
    componentRef.instance.data = data;
    componentRef.instance.closed.subscribe(() => this.close(componentRef));
    componentRef.instance.actionClicked.subscribe(() => {
      if (data.action) {
        this.close(componentRef);
      }
    });

    // Hacer que la notificación sea clickeable
    componentRef.location.nativeElement.style.pointerEvents = 'auto';

    // Añadir al contenedor
    this.container.appendChild(componentRef.location.nativeElement);
    this.applicationRef.attachView(componentRef.hostView);
    this.notifications.push(componentRef);

    // Auto-cerrar si se especifica duración
    if (data.duration && data.duration > 0) {
      setTimeout(() => {
        this.close(componentRef);
      }, data.duration);
    }

    // Limitar a máximo 5 notificaciones visibles
    if (this.notifications.length > 5) {
      const oldest = this.notifications[0];
      this.close(oldest);
    }

    return componentRef;
  }

  private close(componentRef: ComponentRef<NotificationComponent>) {
    const index = this.notifications.indexOf(componentRef);
    if (index !== -1) {
      this.notifications.splice(index, 1);
      componentRef.destroy();
    }
  }

  // Métodos de conveniencia
  success(title: string, message: string, options?: Partial<NotificationData>) {
    return this.show({
      type: 'success',
      title,
      message,
      duration: 4000,
      dismissible: true,
      ...options
    });
  }

  error(title: string, message: string, options?: Partial<NotificationData>) {
    return this.show({
      type: 'error',
      title,
      message,
      duration: 6000,
      dismissible: true,
      ...options
    });
  }

  warning(title: string, message: string, options?: Partial<NotificationData>) {
    return this.show({
      type: 'warning',
      title,
      message,
      duration: 5000,
      dismissible: true,
      ...options
    });
  }

  info(title: string, message: string, options?: Partial<NotificationData>) {
    return this.show({
      type: 'info',
      title,
      message,
      duration: 4000,
      dismissible: true,
      ...options
    });
  }

  // Cerrar todas las notificaciones
  clearAll() {
    this.notifications.forEach(notification => {
      notification.destroy();
    });
    this.notifications = [];
  }
} 