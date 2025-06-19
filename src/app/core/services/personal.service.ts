import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, map, catchError, throwError } from 'rxjs';
import { Personal, Rango, PersonalStats } from '../interfaces/personal.interface';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

// DTOs para el backend
interface CreatePersonalBackendDto {
  userId: number;
  bloodTypeId: number;
  firstName: string;
  secondName?: string;
  firstLastName: string;
  secondLastName?: string;
  idNumber: string;
  birthDate: string;
  address: string;
  phoneNumber: string;
  email: string;
  competencias: number[];
  emergencyContact: {
    name: string;
    relationship: string;
    mobilePhone: string;
  };
  employmentData: {
    rangeId: number;
    stateId: number;
    admissionDate: string;
    yearsOfExperience: number;
    observations?: string;
  };
}

interface BloodType {
  bloodTypeId: number;
  bloodType: string;
}

interface Estado {
  stateId: number;
  state: string;
}

interface RangoBackend {
  rangeId: number;
  rangeName: string;
}

interface CompetenciaBackend {
  competenciaId: number;
  name: string;
  category: string;
}

@Injectable({
  providedIn: 'root'
})
export class PersonalService {
  
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  // Métodos principales
  getPersonal(): Observable<Personal[]> {
    return this.http.get<any[]>(`${this.apiUrl}/personal`)
      .pipe(
        map(personalList => personalList.map(p => this.transformBackendToFrontend(p))),
        catchError((error) => {
          console.warn('Error al cargar personal desde backend, usando datos mock:', error);
          return of(this.getMockPersonal());
        })
      );
  }

  getPersonalById(id: number): Observable<Personal | undefined> {
    return this.http.get<any>(`${this.apiUrl}/personal/${id}`)
      .pipe(
        map(personal => this.transformBackendToFrontend(personal)),
        catchError(this.handleError)
      );
  }

  createPersonal(personal: Personal): Observable<Personal> {
    console.log('PersonalService.createPersonal: Iniciando registro...');
    
    const currentUser = this.authService.currentUserValue;
    console.log('PersonalService: Usuario actual:', currentUser);
    
    if (!currentUser) {
      console.error('PersonalService: Usuario no autenticado');
      return throwError(() => new Error('Usuario no autenticado'));
    }

    const backendDto = this.transformFrontendToBackend(personal, currentUser.id);
    console.log('PersonalService: DTO para backend:', backendDto);
    
    // Verificar token antes de la petición
    const token = this.authService.getToken();
    console.log('PersonalService: Token disponible:', !!token);
    
    return this.http.post<any>(`${this.apiUrl}/personal`, backendDto)
      .pipe(
        map(response => {
          console.log('PersonalService: Respuesta exitosa del backend:', response);
          return this.transformBackendToFrontend(response);
        }),
        catchError((error) => {
          console.error('PersonalService: Error en createPersonal:', error);
          if (error.status === 401) {
            console.error('PersonalService: Error 401 - Problema de autenticación');
            console.error('Token actual:', token);
          }
          return this.handleError(error);
        })
      );
  }

  updatePersonal(id: number, personal: Personal): Observable<Personal> {
    console.log('PersonalService.updatePersonal: Iniciando actualización...');
    console.log('PersonalService: ID a actualizar:', id);
    
    const currentUser = this.authService.currentUserValue;
    console.log('PersonalService: Usuario actual:', currentUser);
    
    if (!currentUser) {
      console.error('PersonalService: Usuario no autenticado para actualización');
      return throwError(() => new Error('Usuario no autenticado'));
    }

    const backendDto = this.transformFrontendToBackend(personal, currentUser.id);
    console.log('PersonalService: DTO para actualización:', backendDto);
    
    // Verificar token antes de la petición
    const token = this.authService.getToken();
    console.log('PersonalService: Token disponible para actualización:', !!token);
    
    return this.http.put<any>(`${this.apiUrl}/personal/${id}`, backendDto)
      .pipe(
        map(response => {
          console.log('PersonalService: Personal actualizado exitosamente:', response);
          return this.transformBackendToFrontend(response);
        }),
        catchError((error) => {
          console.error('PersonalService: Error en updatePersonal:', error);
          console.error('PersonalService: Status del error:', error.status);
          console.error('PersonalService: Response del error:', error.error);
          console.error('PersonalService: URL que falló:', error.url);
          
          if (error.status === 401) {
            console.error('PersonalService: Error 401 en actualización - Problema de autenticación');
          } else if (error.status === 404) {
            console.error('PersonalService: Error 404 - Personal no encontrado');
          } else if (error.status === 500) {
            console.error('PersonalService: Error 500 - Error interno del servidor');
            console.error('PersonalService: Datos enviados que causaron el error:', backendDto);
            console.error('PersonalService: ID utilizado:', id);
          }
          return this.handleError(error);
        })
      );
  }

  deletePersonal(id: number): Observable<boolean> {
    return this.http.delete(`${this.apiUrl}/personal/${id}`)
      .pipe(
        map(() => true),
        catchError(this.handleError)
      );
  }

  // Métodos para obtener datos de constantes
  getTiposSangre(): Observable<BloodType[]> {
    return this.http.get<BloodType[]>(`${this.apiUrl}/constantes/tipos-sangre`)
      .pipe(
        catchError(() => {
          const mockTypes: BloodType[] = this.getTiposSangreStatic().map((tipo, index) => ({
            bloodTypeId: index + 1,
            bloodType: tipo
          }));
          return of(mockTypes);
        })
      );
  }

  getEstados(): Observable<Estado[]> {
    return this.http.get<Estado[]>(`${this.apiUrl}/constantes/estados`)
      .pipe(
        catchError(() => {
          const mockStates: Estado[] = this.getEstadosStatic().map((estado, index) => ({
            stateId: index + 1,
            state: estado.label
          }));
          return of(mockStates);
        })
      );
  }

  getRangos(): Observable<RangoBackend[]> {
    return this.http.get<RangoBackend[]>(`${this.apiUrl}/constantes/rangos`)
      .pipe(
        catchError(() => {
          const mockRangos: RangoBackend[] = [
            { rangeId: 1, rangeName: 'Bombero Auxiliar' },
            { rangeId: 2, rangeName: 'Bombero Profesional' },
            { rangeId: 3, rangeName: 'Cabo' },
            { rangeId: 4, rangeName: 'Sargento' },
            { rangeId: 5, rangeName: 'Teniente' },
            { rangeId: 6, rangeName: 'Capitán' },
            { rangeId: 7, rangeName: 'Mayor' }
          ];
          return of(mockRangos);
        })
      );
  }

  getCualidades(): Observable<CompetenciaBackend[]> {
    return this.http.get<CompetenciaBackend[]>(`${this.apiUrl}/competencias`)
      .pipe(
        catchError(() => {
          const mockCualidades: CompetenciaBackend[] = [
            { competenciaId: 1, name: 'Primeros Auxilios', category: 'medica' },
            { competenciaId: 2, name: 'Paramedicina', category: 'medica' },
            { competenciaId: 3, name: 'Rescate Urbano', category: 'rescate' },
            { competenciaId: 4, name: 'Rescate Acuático', category: 'rescate' },
            { competenciaId: 5, name: 'Rescate Vehicular', category: 'rescate' },
            { competenciaId: 6, name: 'Liderazgo', category: 'administrativa' },
            { competenciaId: 7, name: 'Instructor', category: 'administrativa' },
            { competenciaId: 8, name: 'Comunicaciones', category: 'tecnica' },
            { competenciaId: 9, name: 'Manejo Materiales Peligrosos', category: 'tecnica' },
            { competenciaId: 10, name: 'Conducción Emergencia', category: 'operativa' }
          ];
          return of(mockCualidades);
        })
      );
  }

  getCualidadesAgrupadas(): Observable<{[categoria: string]: CompetenciaBackend[]}> {
    return this.http.get<{[categoria: string]: CompetenciaBackend[]}>(`${this.apiUrl}/competencias/agrupadas`)
      .pipe(catchError(this.handleError));
  }

  // Métodos de transformación
  private transformFrontendToBackend(personal: Personal, userId: number): CreatePersonalBackendDto {
    console.log('PersonalService: Transformando datos frontend a backend...');
    console.log('PersonalService: Personal recibido:', personal);
    console.log('PersonalService: UserId:', userId);
    
    // Validar y procesar fechas
    const fechaNacimiento = personal.fechaNacimiento instanceof Date ? 
      personal.fechaNacimiento : new Date(personal.fechaNacimiento);
    const fechaIngreso = personal.fechaIngreso instanceof Date ? 
      personal.fechaIngreso : new Date(personal.fechaIngreso);
    
    // Validar y procesar nombres
    const nombres = (personal.nombres || '').trim().split(' ').filter(n => n.length > 0);
    const apellidos = (personal.apellidos || '').trim().split(' ').filter(a => a.length > 0);
    
    // Validar y procesar competencias
    const competencias = (personal.cualidades || [])
      .map(c => Number(c))
      .filter(c => !isNaN(c) && c > 0);

    // Validar y procesar tipo de sangre
    const bloodTypeId = Number(personal.tipoSangre);
    if (isNaN(bloodTypeId)) {
      console.warn('PersonalService: Tipo de sangre inválido:', personal.tipoSangre);
    }

    // Validar y procesar rango
    const rangeId = Number(personal.rango);
    if (isNaN(rangeId)) {
      console.warn('PersonalService: Rango inválido:', personal.rango);
    }

    // Crear DTO base
    const dto: any = {};

    // Solo agregar campos que tienen valor
    if (userId) dto.userId = userId;
    if (bloodTypeId && !isNaN(bloodTypeId)) dto.bloodTypeId = bloodTypeId;
    if (nombres[0]) dto.firstName = nombres[0];
    if (nombres.length > 1) dto.secondName = nombres.slice(1).join(' ');
    if (apellidos[0]) dto.firstLastName = apellidos[0];
    if (apellidos.length > 1) dto.secondLastName = apellidos.slice(1).join(' ');
    if (personal.cedula) dto.idNumber = personal.cedula;
    if (fechaNacimiento) dto.birthDate = fechaNacimiento.toISOString().split('T')[0];
    if (personal.direccion) dto.address = personal.direccion;
    if (personal.telefono) dto.phoneNumber = personal.telefono;
    if (personal.email) dto.email = personal.email;
    if (competencias.length > 0) dto.competencias = competencias;

    // Solo agregar contacto de emergencia si hay al menos un campo
    if (personal.contactoEmergencia?.nombre || 
        personal.contactoEmergencia?.parentesco || 
        personal.contactoEmergencia?.telefono) {
      dto.emergencyContact = {};
      if (personal.contactoEmergencia.nombre) 
        dto.emergencyContact.name = personal.contactoEmergencia.nombre;
      if (personal.contactoEmergencia.parentesco) 
        dto.emergencyContact.relationship = personal.contactoEmergencia.parentesco;
      if (personal.contactoEmergencia.telefono) 
        dto.emergencyContact.mobilePhone = personal.contactoEmergencia.telefono;
    }

    // Solo agregar datos de empleo si hay al menos un campo
    if (rangeId || personal.estado || fechaIngreso || 
        typeof personal.experienciaAnios !== 'undefined' || 
        personal.observaciones) {
      dto.employmentData = {};
      if (rangeId && !isNaN(rangeId)) dto.employmentData.rangeId = rangeId;
      if (personal.estado) dto.employmentData.stateId = this.getStateIdFromString(personal.estado);
      if (fechaIngreso) dto.employmentData.admissionDate = fechaIngreso.toISOString().split('T')[0];
      if (typeof personal.experienciaAnios !== 'undefined') 
        dto.employmentData.yearsOfExperience = Number(personal.experienciaAnios);
      if (personal.observaciones) dto.employmentData.observations = personal.observaciones;
    }

    // Validaciones finales
    console.log('PersonalService: DTO generado:', dto);
    console.log('PersonalService: Campos incluidos:', Object.keys(dto));

    return dto as CreatePersonalBackendDto;
  }

  private transformBackendToFrontend(backendPersonal: any): Personal {
    console.log('PersonalService: Transformando datos del backend:', backendPersonal);
    
    // Extraer rango
    let rango = '';
    if (backendPersonal.employmentDataEntity?.range) {
      const rangeData = backendPersonal.employmentDataEntity.range;
      rango = String(rangeData.rangeId);
      console.log('PersonalService: Rango desde employmentDataEntity.range:', rango);
    } else if (backendPersonal.range) {
      const rangeData = backendPersonal.range;
      rango = String(rangeData.rangeId);
      console.log('PersonalService: Rango desde range directo:', rango);
    } else if (backendPersonal.employmentDataEntity?.rangeId) {
      rango = String(backendPersonal.employmentDataEntity.rangeId);
      console.log('PersonalService: Rango desde employmentDataEntity.rangeId:', rango);
    }
    
    // Extraer competencias
    let cualidades: string[] = [];
    if (backendPersonal.peopleCompetencias && Array.isArray(backendPersonal.peopleCompetencias)) {
      cualidades = backendPersonal.peopleCompetencias
        .map((pc: any) => {
          const competencia = pc.competencia || pc;
          return String(competencia.competenciaId);
        })
        .filter(Boolean);
      console.log('PersonalService: Competencias extraídas de peopleCompetencias:', cualidades);
    } else if (backendPersonal.competencias && Array.isArray(backendPersonal.competencias)) {
      cualidades = backendPersonal.competencias
        .map((comp: any) => String(comp.competenciaId))
        .filter(Boolean);
      console.log('PersonalService: Competencias extraídas de competencias:', cualidades);
    }
    
    // Extraer tipo de sangre
    let tipoSangre = '';
    if (backendPersonal.bloodTypeEntity) {
      tipoSangre = String(backendPersonal.bloodTypeEntity.bloodTypeId || backendPersonal.bloodTypeEntity.bloodType);
      console.log('PersonalService: Tipo sangre desde bloodTypeEntity:', tipoSangre);
    } else if (backendPersonal.bloodType) {
      tipoSangre = String(backendPersonal.bloodType.bloodTypeId || backendPersonal.bloodType.bloodType);
      console.log('PersonalService: Tipo sangre desde bloodType:', tipoSangre);
    } else if (backendPersonal.bloodTypeId) {
      tipoSangre = String(backendPersonal.bloodTypeId);
      console.log('PersonalService: Tipo sangre desde bloodTypeId directo:', tipoSangre);
    }
    
    // Procesar fechas
    let fechaNacimiento: Date;
    let fechaIngreso: Date;
    
    try {
      fechaNacimiento = new Date(backendPersonal.birthDate);
      if (isNaN(fechaNacimiento.getTime())) throw new Error('Fecha inválida');
    } catch (e) {
      console.warn('PersonalService: Error procesando fecha nacimiento:', e);
      fechaNacimiento = new Date();
    }
    
    try {
      fechaIngreso = new Date(backendPersonal.employmentDataEntity?.admissionDate || backendPersonal.admissionDate);
      if (isNaN(fechaIngreso.getTime())) throw new Error('Fecha inválida');
    } catch (e) {
      console.warn('PersonalService: Error procesando fecha ingreso:', e);
      fechaIngreso = new Date();
    }
    
    // Extraer estado
    const estadoId = backendPersonal.employmentDataEntity?.stateId || backendPersonal.stateId || 1;
    console.log('PersonalService: Estado ID recibido:', estadoId);
    console.log('PersonalService: Estado completo:', backendPersonal.employmentDataEntity?.stateEntity);
    
    let estado: 'activo' | 'licencia';
    if (backendPersonal.employmentDataEntity?.stateEntity?.state) {
      // Normalizar el estado del backend
      const estadoBackend = backendPersonal.employmentDataEntity.stateEntity.state.toLowerCase();
      estado = estadoBackend === 'en licencia' ? 'licencia' : estadoBackend as 'activo' | 'licencia';
      console.log('PersonalService: Estado extraído y normalizado de stateEntity:', estado);
    } else {
      estado = this.getStateStringFromId(estadoId);
      console.log('PersonalService: Estado mapeado desde ID:', estado);
    }
    
    // Construir objeto Personal
    const transformed: Personal = {
      id: backendPersonal.personalId || backendPersonal.id,
      cedula: backendPersonal.idNumber || '',
      nombres: [backendPersonal.firstName, backendPersonal.secondName].filter(Boolean).join(' '),
      apellidos: [backendPersonal.firstLastName, backendPersonal.secondLastName].filter(Boolean).join(' '),
      fechaNacimiento,
      telefono: backendPersonal.phoneNumber || '',
      email: backendPersonal.email || backendPersonal.user?.email || '',
      direccion: backendPersonal.address || '',
      tipoSangre,
      rango,
      fechaIngreso,
      estado,
      cualidades,
      experienciaAnios: Number(backendPersonal.employmentDataEntity?.yearsOfExperience || backendPersonal.yearsOfExperience || 0),
      observaciones: backendPersonal.employmentDataEntity?.observations || backendPersonal.observations || '',
      contactoEmergencia: {
        nombre: backendPersonal.emergencyContact?.name || '',
        parentesco: backendPersonal.emergencyContact?.relationship || '',
        telefono: backendPersonal.emergencyContact?.mobilePhone || ''
      }
    };
    
    // Validaciones finales
    console.log('PersonalService: Datos transformados:', transformed);
    console.log('PersonalService: Validaciones:');
    console.log('- ID:', transformed.id);
    console.log('- Nombres completos:', transformed.nombres, transformed.apellidos);
    console.log('- Tipo sangre:', transformed.tipoSangre);
    console.log('- Rango:', transformed.rango);
    console.log('- Competencias:', transformed.cualidades);
    console.log('- Estado:', transformed.estado);
    
    return transformed;
  }

  // Métodos auxiliares
  private getStateIdFromString(estado: string): number {
    const stateMap: {[key: string]: number} = {
      'activo': 1,
      'licencia': 2,
      'en licencia': 2  // Agregar soporte para ambos formatos
    };
    return stateMap[estado.toLowerCase()] || 1;
  }

  private getStateStringFromId(stateId: number): 'activo' | 'licencia' {
    const stateMap: {[key: number]: 'activo' | 'licencia'} = {
      1: 'activo',
      2: 'licencia'
    };
    return stateMap[stateId] || 'activo';
  }

  private handleError = (error: any): Observable<never> => {
    console.error('Error en PersonalService:', error);
    let errorMessage = 'Error desconocido';
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return throwError(() => new Error(errorMessage));
  }

  // Métodos para compatibilidad con datos estáticos (fallback)
  getTiposSangreStatic(): string[] {
    return ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  }

  getEstadosStatic(): Array<{value: string, label: string}> {
    return [
      { value: 'activo', label: 'Activo' },
      { value: 'licencia', label: 'En Licencia' },
      { value: 'retirado', label: 'Retirado' }
    ];
  }

  getMockPersonal(): Personal[] {
    return [
    {
      id: 1,
      cedula: '12345678',
      nombres: 'Carlos Eduardo',
      apellidos: 'González Morales',
      fechaNacimiento: new Date('1985-03-15'),
      telefono: '3101234567',
      email: 'carlos.gonzalez@bomberos.gov.co',
      direccion: 'Calle 45 #23-15, Barrio Centro',
      tipoSangre: 'O+',
        rango: 'Capitán',
      fechaIngreso: new Date('2010-01-15'),
      estado: 'activo',
        cualidades: ['liderazgo', 'rescate_acuatico', 'primeros_auxilios'],
      experienciaAnios: 14,
      observaciones: 'Especialista en rescate acuático. Instructor certificado.',
      contactoEmergencia: {
        nombre: 'María González',
        parentesco: 'Esposa',
        telefono: '3109876543'
      }
    },
    {
      id: 2,
      cedula: '87654321',
      nombres: 'Ana Sofía',
      apellidos: 'Rodríguez Pérez',
      fechaNacimiento: new Date('1990-07-22'),
      telefono: '3202345678',
      email: 'ana.rodriguez@bomberos.gov.co',
      direccion: 'Carrera 12 #34-56, Barrio Norte',
      tipoSangre: 'A+',
        rango: 'Bombero Profesional',
      fechaIngreso: new Date('2015-06-01'),
      estado: 'activo',
      cualidades: ['paramedicina', 'rescate_urbano', 'primeros_auxilios'],
      experienciaAnios: 9,
      observaciones: 'Paramédica certificada. Especialista en emergencias médicas.',
      contactoEmergencia: {
        nombre: 'José Rodríguez',
        parentesco: 'Padre',
        telefono: '3108765432'
      }
      }
    ];
  }

  // Método para estadísticas (implementación básica)
  getPersonalStats(): Observable<PersonalStats> {
    return this.getPersonal().pipe(
      map(personalList => {
        const total = personalList.length;
        const activos = personalList.filter(p => p.estado === 'activo').length;
        const enLicencia = personalList.filter(p => p.estado === 'licencia').length;
        
        const promedioExperiencia = personalList.reduce((sum, p) => sum + p.experienciaAnios, 0) / total;
        
        const distribucuionPorRango: { [rango: string]: number } = {};
        personalList.forEach(p => {
          distribucuionPorRango[p.rango] = (distribucuionPorRango[p.rango] || 0) + 1;
        });

        const cualidadesMasComunes: { cualidad: string; cantidad: number }[] = [];
    const cualidadesCount: { [cualidad: string]: number } = {};
        personalList.forEach(p => {
      p.cualidades.forEach(c => {
        cualidadesCount[c] = (cualidadesCount[c] || 0) + 1;
      });
    });

        Object.entries(cualidadesCount)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .forEach(([cualidad, cantidad]) => {
            cualidadesMasComunes.push({ cualidad, cantidad });
          });

        return {
      totalPersonal: total,
          personalActivo: activos,
          personalEnLicencia: enLicencia,
          promedioExperiencia: Math.round(promedioExperiencia * 100) / 100,
          distribucuionPorCargo: distribucuionPorRango,
      cualidadesMasComunes
    };
      })
    );
  }
} 