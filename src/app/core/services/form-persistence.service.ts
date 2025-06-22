import { Injectable, Inject, Optional } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { AuthService } from './auth.service';

export interface FormPersistenceConfig {
  key: string;
  excludeFields?: string[];
  autoSave?: boolean;
  autoSaveDelay?: number;
  storageType?: 'localStorage' | 'sessionStorage';
  requireAuth?: boolean; // Nueva opción para requerir autenticación
}

@Injectable({
  providedIn: 'root'
})
export class FormPersistenceService {
  private autoSaveTimeouts: Map<string, any> = new Map();

  constructor(@Optional() private authService: AuthService) {}

  /**
   * Guarda los datos de un formulario en el almacenamiento
   */
  saveFormData(form: FormGroup, config: FormPersistenceConfig): void {
    if (!form) return;

    // Verificar autenticación si es requerida
    if (config.requireAuth && !this.isUserAuthenticated()) {
      console.warn('⚠️ No se puede guardar: usuario no autenticado');
      return;
    }

    try {
      const formValue = form.value;
      const dataToSave = this.processFormValue(formValue, config.excludeFields);
      
      const storage = config.storageType === 'sessionStorage' ? sessionStorage : localStorage;
      const dataWithMetadata: any = {
        data: dataToSave,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };

      // Agregar ID de usuario si está autenticado para mayor seguridad
      if (this.authService && this.isUserAuthenticated()) {
        try {
          const userToken = this.authService.getToken();
          if (userToken) {
            // Usar hash simple del token para no guardar el token completo
            dataWithMetadata.userHash = this.simpleHash(userToken.substring(0, 20));
          }
        } catch (error) {
          // Continúar sin hash de usuario si hay error
        }
      }

      storage.setItem(config.key, JSON.stringify(dataWithMetadata));

      console.log(`✅ Formulario guardado en ${config.storageType || 'localStorage'} con clave: ${config.key}`);
    } catch (error) {
      console.error('Error al guardar formulario:', error);
    }
  }

  /**
   * Carga los datos de un formulario desde el almacenamiento
   */
  loadFormData(config: FormPersistenceConfig): any {
    // Verificar autenticación si es requerida
    if (config.requireAuth && !this.isUserAuthenticated()) {
      console.warn('⚠️ No se puede cargar: usuario no autenticado');
      return null;
    }

    try {
      const storage = config.storageType === 'sessionStorage' ? sessionStorage : localStorage;
      const savedData = storage.getItem(config.key);
      
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        
        // Verificar hash de usuario si existe
        if (parsedData.userHash && this.authService && this.isUserAuthenticated()) {
          try {
            const userToken = this.authService.getToken();
            if (userToken) {
              const currentUserHash = this.simpleHash(userToken.substring(0, 20));
              if (parsedData.userHash !== currentUserHash) {
                console.warn('⚠️ Datos pertenecen a otro usuario, no se cargarán');
                return null;
              }
            }
          } catch (error) {
            // Continúar sin verificación si hay error
          }
        }
        
        console.log(`✅ Formulario cargado desde ${config.storageType || 'localStorage'} con clave: ${config.key}`);
        return parsedData.data;
      }
    } catch (error) {
      console.error('Error al cargar formulario:', error);
    }
    
    return null;
  }

  /**
   * Aplica los datos cargados a un formulario
   */
  restoreFormData(form: FormGroup, config: FormPersistenceConfig): boolean {
    const savedData = this.loadFormData(config);
    
    if (savedData && form) {
      try {
        // Usar setTimeout para asegurar que el formulario está completamente inicializado
        setTimeout(() => {
          form.patchValue(savedData, { emitEvent: false });
          console.log(`✅ Datos restaurados en el formulario`);
        }, 100);
        return true;
      } catch (error) {
        console.error('Error al restaurar datos del formulario:', error);
      }
    }
    
    return false;
  }

  /**
   * Configura el auto-guardado para un formulario
   */
  setupAutoSave(form: FormGroup, config: FormPersistenceConfig): void {
    if (!config.autoSave) return;

    const delay = config.autoSaveDelay || 2000;

    form.valueChanges.subscribe(() => {
      // Limpiar timeout anterior
      if (this.autoSaveTimeouts.has(config.key)) {
        clearTimeout(this.autoSaveTimeouts.get(config.key));
      }

      // Configurar nuevo timeout
      const timeout = setTimeout(() => {
        this.saveFormData(form, config);
      }, delay);

      this.autoSaveTimeouts.set(config.key, timeout);
    });
  }

  /**
   * Elimina los datos guardados de un formulario
   */
  clearFormData(config: FormPersistenceConfig): void {
    try {
      const storage = config.storageType === 'sessionStorage' ? sessionStorage : localStorage;
      storage.removeItem(config.key);
      console.log(`✅ Datos del formulario eliminados: ${config.key}`);
    } catch (error) {
      console.error('Error al eliminar datos del formulario:', error);
    }
  }

  /**
   * Obtiene información sobre los datos guardados
   */
  getFormDataInfo(config: FormPersistenceConfig): { exists: boolean; timestamp?: string; size?: number } {
    try {
      const storage = config.storageType === 'sessionStorage' ? sessionStorage : localStorage;
      const savedData = storage.getItem(config.key);
      
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        return {
          exists: true,
          timestamp: parsedData.timestamp,
          size: new Blob([savedData]).size
        };
      }
    } catch (error) {
      console.error('Error al obtener información del formulario:', error);
    }
    
    return { exists: false };
  }

  /**
   * Procesa los valores del formulario, excluyendo campos sensibles
   */
  private processFormValue(formValue: any, excludeFields?: string[]): any {
    if (!excludeFields || excludeFields.length === 0) {
      return formValue;
    }

    const processed = { ...formValue };
    excludeFields.forEach(field => {
      if (field in processed) {
        delete processed[field];
      }
    });

    return processed;
  }

  /**
   * Limpia todos los timeouts de auto-guardado
   */
  clearAllAutoSaveTimeouts(): void {
    this.autoSaveTimeouts.forEach(timeout => clearTimeout(timeout));
    this.autoSaveTimeouts.clear();
  }

  /**
   * Valida si el formulario tiene cambios significativos para guardar
   */
  hasSignificantChanges(formValue: any, significantFields: string[]): boolean {
    return significantFields.some(field => {
      const value = formValue[field];
      return value && value !== '' && value !== null && value !== undefined;
    });
  }

  /**
   * Verifica si el usuario está autenticado
   */
  private isUserAuthenticated(): boolean {
    if (!this.authService) {
      return false;
    }
    
    try {
      return this.authService.isAuthenticated();
    } catch (error) {
      console.warn('Error al verificar autenticación:', error);
      return false;
    }
  }

  /**
   * Genera un hash simple de una cadena (para identificar usuarios sin exponer datos)
   */
  private simpleHash(str: string): string {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return Math.abs(hash).toString(36);
  }
} 