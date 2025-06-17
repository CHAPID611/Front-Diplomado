import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, map, catchError, throwError } from 'rxjs';
import { Personal, Cualidad, Rango, PersonalStats } from '../interfaces/personal.interface';
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
  competenciaName: string;
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
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) {
      return throwError(() => new Error('Usuario no autenticado'));
    }

    const backendDto = this.transformFrontendToBackend(personal, currentUser.id);
    
    return this.http.post<any>(`${this.apiUrl}/personal`, backendDto)
      .pipe(
        map(response => this.transformBackendToFrontend(response)),
        catchError(this.handleError)
      );
  }

  updatePersonal(id: number, personal: Personal): Observable<Personal> {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) {
      return throwError(() => new Error('Usuario no autenticado'));
    }

    const backendDto = this.transformFrontendToBackend(personal, currentUser.id);
    
    return this.http.put<any>(`${this.apiUrl}/personal/${id}`, backendDto)
      .pipe(
        map(response => this.transformBackendToFrontend(response)),
        catchError(this.handleError)
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
            { competenciaId: 1, competenciaName: 'Primeros Auxilios', category: 'medica' },
            { competenciaId: 2, competenciaName: 'Paramedicina', category: 'medica' },
            { competenciaId: 3, competenciaName: 'Rescate Urbano', category: 'rescate' },
            { competenciaId: 4, competenciaName: 'Rescate Acuático', category: 'rescate' },
            { competenciaId: 5, competenciaName: 'Rescate Vehicular', category: 'rescate' },
            { competenciaId: 6, competenciaName: 'Liderazgo', category: 'administrativa' },
            { competenciaId: 7, competenciaName: 'Instructor', category: 'administrativa' },
            { competenciaId: 8, competenciaName: 'Comunicaciones', category: 'tecnica' },
            { competenciaId: 9, competenciaName: 'Manejo Materiales Peligrosos', category: 'tecnica' },
            { competenciaId: 10, competenciaName: 'Conducción Emergencia', category: 'operativa' }
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
    // Separar nombres y apellidos
    const nombres = personal.nombres.trim().split(' ');
    const apellidos = personal.apellidos.trim().split(' ');

    return {
      userId: userId,
      bloodTypeId: Number(personal.tipoSangre), // Asumiendo que tipoSangre será un ID
      firstName: nombres[0],
      secondName: nombres.length > 1 ? nombres.slice(1).join(' ') : undefined,
      firstLastName: apellidos[0],
      secondLastName: apellidos.length > 1 ? apellidos.slice(1).join(' ') : undefined,
      idNumber: personal.cedula,
      birthDate: personal.fechaNacimiento.toISOString().split('T')[0],
      address: personal.direccion,
      phoneNumber: personal.telefono,
      competencias: personal.cualidades.map(c => Number(c)),
      emergencyContact: {
        name: personal.contactoEmergencia.nombre,
        relationship: personal.contactoEmergencia.parentesco,
        mobilePhone: personal.contactoEmergencia.telefono
      },
      employmentData: {
        rangeId: Number(personal.rango),
        stateId: this.getStateIdFromString(personal.estado),
        admissionDate: personal.fechaIngreso.toISOString().split('T')[0],
        yearsOfExperience: personal.experienciaAnios,
        observations: personal.observaciones
      }
    };
  }

  private transformBackendToFrontend(backendPersonal: any): Personal {
    return {
      id: backendPersonal.personalId,
      cedula: backendPersonal.idNumber,
      nombres: [backendPersonal.firstName, backendPersonal.secondName].filter(Boolean).join(' '),
      apellidos: [backendPersonal.firstLastName, backendPersonal.secondLastName].filter(Boolean).join(' '),
      fechaNacimiento: new Date(backendPersonal.birthDate),
      telefono: backendPersonal.phoneNumber,
      email: backendPersonal.user?.email || '',
      direccion: backendPersonal.address,
      tipoSangre: backendPersonal.bloodTypeEntity?.bloodType || '',
      rango: backendPersonal.employmentDataEntity?.range?.rangeName || '',
      fechaIngreso: new Date(backendPersonal.employmentDataEntity?.admissionDate),
      estado: this.getStateStringFromId(backendPersonal.employmentDataEntity?.stateId),
      cualidades: backendPersonal.peopleCompetencias?.map((pc: any) => pc.competencia.competenciaName) || [],
      experienciaAnios: backendPersonal.employmentDataEntity?.yearsOfExperience || 0,
      observaciones: backendPersonal.employmentDataEntity?.observations,
      contactoEmergencia: {
        nombre: backendPersonal.emergencyContact?.name || '',
        parentesco: backendPersonal.emergencyContact?.relationship || '',
        telefono: backendPersonal.emergencyContact?.mobilePhone || ''
      }
    };
  }

  // Métodos auxiliares
  private getStateIdFromString(estado: string): number {
    const stateMap: {[key: string]: number} = {
      'activo': 1,
      'inactivo': 2,
      'licencia': 3
    };
    return stateMap[estado] || 1;
  }

  private getStateStringFromId(stateId: number): 'activo' | 'inactivo' | 'licencia' {
    const stateMap: {[key: number]: 'activo' | 'inactivo' | 'licencia'} = {
      1: 'activo',
      2: 'inactivo',
      3: 'licencia'
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
      { value: 'inactivo', label: 'Inactivo' },
      { value: 'licencia', label: 'En Licencia' }
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
        const inactivos = personalList.filter(p => p.estado === 'inactivo').length;
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
          personalInactivo: inactivos,
          personalEnLicencia: enLicencia,
          promedioExperiencia: Math.round(promedioExperiencia * 100) / 100,
          distribucuionPorCargo: distribucuionPorRango,
          cualidadesMasComunes
        };
      })
    );
  }
} 