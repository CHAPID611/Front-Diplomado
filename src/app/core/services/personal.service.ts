import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Personal, Cualidad, Cargo, Rango, PersonalStats } from '../interfaces/personal.interface';

@Injectable({
  providedIn: 'root'
})
export class PersonalService {
  
  private mockPersonal: Personal[] = [
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
      cargo: 'capitan',
      rango: 'capitan',
      fechaIngreso: new Date('2010-01-15'),
      estado: 'activo',
      cualidades: ['liderazgo', 'rescate_acuatico', 'primeros_auxilios', 'manejo_materiales_peligrosos'],
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
      cargo: 'bombero',
      rango: 'bombero_profesional',
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
    },
    {
      id: 3,
      cedula: '11223344',
      nombres: 'Miguel Ángel',
      apellidos: 'Fernández López',
      fechaNacimiento: new Date('1982-11-30'),
      telefono: '3153456789',
      email: 'miguel.fernandez@bomberos.gov.co',
      direccion: 'Avenida 68 #12-34, Barrio Sur',
      tipoSangre: 'B+',
      cargo: 'teniente',
      rango: 'teniente',
      fechaIngreso: new Date('2008-03-20'),
      estado: 'activo',
      cualidades: ['instructor', 'rescate_vehicular', 'manejo_materiales_peligrosos', 'liderazgo'],
      experienciaAnios: 16,
      observaciones: 'Instructor en rescate vehicular. 16 años de experiencia.',
      contactoEmergencia: {
        nombre: 'Laura Fernández',
        parentesco: 'Esposa',
        telefono: '3157654321'
      }
    },
    {
      id: 4,
      cedula: '55667788',
      nombres: 'Diana Patricia',
      apellidos: 'Vargas Ruiz',
      fechaNacimiento: new Date('1988-05-18'),
      telefono: '3004567890',
      email: 'diana.vargas@bomberos.gov.co',
      direccion: 'Calle 78 #45-23, Barrio Este',
      tipoSangre: 'AB+',
      cargo: 'bombero',
      rango: 'bombero_voluntario',
      fechaIngreso: new Date('2018-09-10'),
      estado: 'licencia',
      cualidades: ['primeros_auxilios', 'comunicaciones'],
      experienciaAnios: 6,
      observaciones: 'En licencia de maternidad. Regreso programado para febrero.',
      contactoEmergencia: {
        nombre: 'Carlos Vargas',
        parentesco: 'Hermano',
        telefono: '3006543210'
      }
    },
    {
      id: 5,
      cedula: '22334455',
      nombres: 'Luis Fernando',
      apellidos: 'Martínez Silva',
      fechaNacimiento: new Date('1987-12-08'),
      telefono: '3125678901',
      email: 'luis.martinez@bomberos.gov.co',
      direccion: 'Calle 90 #15-27, Barrio Chapinero',
      tipoSangre: 'O-',
      cargo: 'sargento',
      rango: 'sargento',
      fechaIngreso: new Date('2012-05-15'),
      estado: 'activo',
      cualidades: ['rescate_acuatico', 'conduccion_emergencia', 'primeros_auxilios', 'liderazgo'],
      experienciaAnios: 12,
      observaciones: 'Especialista en rescate acuático y conducción de emergencia. Supervisor nocturno.',
      contactoEmergencia: {
        nombre: 'Sandra Martínez',
        parentesco: 'Esposa',
        telefono: '3124567890'
      }
    },
    {
      id: 6,
      cedula: '33445566',
      nombres: 'Carmen Elena',
      apellidos: 'Jiménez Torres',
      fechaNacimiento: new Date('1992-04-14'),
      telefono: '3186789012',
      email: 'carmen.jimenez@bomberos.gov.co',
      direccion: 'Carrera 45 #67-89, Barrio La Candelaria',
      tipoSangre: 'A-',
      cargo: 'bombero',
      rango: 'bombero_profesional',
      fechaIngreso: new Date('2017-08-22'),
      estado: 'activo',
      cualidades: ['paramedicina', 'rescate_urbano', 'comunicaciones', 'primeros_auxilios'],
      experienciaAnios: 7,
      observaciones: 'Paramédica con especialización en trauma. Operadora de comunicaciones.',
      contactoEmergencia: {
        nombre: 'Roberto Jiménez',
        parentesco: 'Padre',
        telefono: '3185678901'
      }
    },
    {
      id: 7,
      cedula: '44556677',
      nombres: 'Alejandro',
      apellidos: 'Ramírez Castillo',
      fechaNacimiento: new Date('1983-09-25'),
      telefono: '3147890123',
      email: 'alejandro.ramirez@bomberos.gov.co',
      direccion: 'Avenida 19 #23-45, Barrio Zona Rosa',
      tipoSangre: 'B-',
      cargo: 'cabo',
      rango: 'cabo',
      fechaIngreso: new Date('2009-11-10'),
      estado: 'activo',
      cualidades: ['rescate_vehicular', 'manejo_materiales_peligrosos', 'primeros_auxilios', 'instructor'],
      experienciaAnios: 15,
      observaciones: 'Especialista en materiales peligrosos. Instructor certificado en HAZMAT.',
      contactoEmergencia: {
        nombre: 'Patricia Ramírez',
        parentesco: 'Hermana',
        telefono: '3146789012'
      }
    },
    {
      id: 8,
      cedula: '55667700',
      nombres: 'Mónica',
      apellidos: 'Herrera Díaz',
      fechaNacimiento: new Date('1989-01-30'),
      telefono: '3108901234',
      email: 'monica.herrera@bomberos.gov.co',
      direccion: 'Calle 127 #8-15, Barrio Usaquén',
      tipoSangre: 'AB-',
      cargo: 'bombero',
      rango: 'bombero_auxiliar',
      fechaIngreso: new Date('2020-02-14'),
      estado: 'activo',
      cualidades: ['primeros_auxilios', 'comunicaciones'],
      experienciaAnios: 4,
      observaciones: 'Bombera auxiliar en proceso de certificación profesional.',
      contactoEmergencia: {
        nombre: 'Diego Herrera',
        parentesco: 'Esposo',
        telefono: '3107890123'
      }
    },
    {
      id: 9,
      cedula: '66778899',
      nombres: 'Jorge Esteban',
      apellidos: 'Mendoza Ruiz',
      fechaNacimiento: new Date('1986-06-18'),
      telefono: '3169012345',
      email: 'jorge.mendoza@bomberos.gov.co',
      direccion: 'Carrera 30 #45-67, Barrio Teusaquillo',
      tipoSangre: 'O+',
      cargo: 'bombero',
      rango: 'bombero_profesional',
      fechaIngreso: new Date('2014-03-08'),
      estado: 'activo',
      cualidades: ['rescate_acuatico', 'conduccion_emergencia', 'primeros_auxilios'],
      experienciaAnios: 10,
      observaciones: 'Conductor especializado. Certificado en rescate acuático nivel avanzado.',
      contactoEmergencia: {
        nombre: 'Ana Mendoza',
        parentesco: 'Madre',
        telefono: '3168901234'
      }
    },
    {
      id: 10,
      cedula: '77889900',
      nombres: 'Paola Andrea',
      apellidos: 'Castro Moreno',
      fechaNacimiento: new Date('1991-11-12'),
      telefono: '3120123456',
      email: 'paola.castro@bomberos.gov.co',
      direccion: 'Calle 63 #11-28, Barrio Chapinero Norte',
      tipoSangre: 'A+',
      cargo: 'bombero',
      rango: 'bombero_voluntario',
      fechaIngreso: new Date('2019-07-19'),
      estado: 'activo',
      cualidades: ['primeros_auxilios', 'comunicaciones'],
      experienciaAnios: 5,
      observaciones: 'Bombera voluntaria estudiante de enfermería. Turno de fines de semana.',
      contactoEmergencia: {
        nombre: 'María Castro',
        parentesco: 'Madre',
        telefono: '3119012345'
      }
    },
    {
      id: 11,
      cedula: '88990011',
      nombres: 'Ricardo',
      apellidos: 'Sánchez Vega',
      fechaNacimiento: new Date('1984-02-28'),
      telefono: '3181234567',
      email: 'ricardo.sanchez@bomberos.gov.co',
      direccion: 'Avenida 68 #89-12, Barrio Engativá',
      tipoSangre: 'B+',
      cargo: 'teniente',
      rango: 'teniente',
      fechaIngreso: new Date('2007-09-12'),
      estado: 'activo',
      cualidades: ['liderazgo', 'instructor', 'rescate_urbano', 'manejo_materiales_peligrosos'],
      experienciaAnios: 17,
      observaciones: 'Jefe de turno diurno. Instructor en rescate urbano y colapso estructural.',
      contactoEmergencia: {
        nombre: 'Luz Sánchez',
        parentesco: 'Esposa',
        telefono: '3180123456'
      }
    },
    {
      id: 12,
      cedula: '99001122',
      nombres: 'Andrea Milena',
      apellidos: 'Ospina León',
      fechaNacimiento: new Date('1993-08-07'),
      telefono: '3142345678',
      email: 'andrea.ospina@bomberos.gov.co',
      direccion: 'Calle 170 #45-23, Barrio Suba',
      tipoSangre: 'O-',
      cargo: 'bombero',
      rango: 'bombero_profesional',
      fechaIngreso: new Date('2018-01-25'),
      estado: 'activo',
      cualidades: ['paramedicina', 'primeros_auxilios', 'rescate_vehicular'],
      experienciaAnios: 6,
      observaciones: 'Paramédica especializada en emergencias pediátricas.',
      contactoEmergencia: {
        nombre: 'Carlos Ospina',
        parentesco: 'Padre',
        telefono: '3141234567'
      }
    },
    {
      id: 13,
      cedula: '10203040',
      nombres: 'Fernando',
      apellidos: 'Aguilar Rojas',
      fechaNacimiento: new Date('1988-05-22'),
      telefono: '3203456789',
      email: 'fernando.aguilar@bomberos.gov.co',
      direccion: 'Carrera 7 #123-45, Barrio Centro',
      tipoSangre: 'AB+',
      cargo: 'mayor',
      rango: 'mayor',
      fechaIngreso: new Date('2005-04-18'),
      estado: 'activo',
      cualidades: ['liderazgo', 'instructor', 'manejo_materiales_peligrosos', 'rescate_acuatico'],
      experienciaAnios: 19,
      observaciones: 'Jefe de distrito. 19 años de experiencia. Especialista en comando de incidentes.',
      contactoEmergencia: {
        nombre: 'Gloria Aguilar',
        parentesco: 'Esposa',
        telefono: '3202345678'
      }
    },
    {
      id: 14,
      cedula: '20304050',
      nombres: 'Sebastián',
      apellidos: 'Torres Medina',
      fechaNacimiento: new Date('1995-10-15'),
      telefono: '3164567890',
      email: 'sebastian.torres@bomberos.gov.co',
      direccion: 'Calle 26 #68-90, Barrio San Rafael',
      tipoSangre: 'A-',
      cargo: 'bombero',
      rango: 'bombero_auxiliar',
      fechaIngreso: new Date('2021-06-10'),
      estado: 'activo',
      cualidades: ['primeros_auxilios', 'comunicaciones'],
      experienciaAnios: 3,
      observaciones: 'Bombero auxiliar recién graduado de la academia. En período de prueba.',
      contactoEmergencia: {
        nombre: 'Elena Torres',
        parentesco: 'Madre',
        telefono: '3163456789'
      }
    },
    {
      id: 15,
      cedula: '30405060',
      nombres: 'Valentina',
      apellidos: 'Guerrero Pineda',
      fechaNacimiento: new Date('1990-12-03'),
      telefono: '3125678900',
      email: 'valentina.guerrero@bomberos.gov.co',
      direccion: 'Avenida 15 #34-56, Barrio Santa Fe',
      tipoSangre: 'B-',
      cargo: 'cabo',
      rango: 'cabo',
      fechaIngreso: new Date('2016-11-08'),
      estado: 'activo',
      cualidades: ['rescate_urbano', 'primeros_auxilios', 'conduccion_emergencia'],
      experienciaAnios: 8,
      observaciones: 'Cabo especialista en rescate urbano. Supervisora de equipo de rescate.',
      contactoEmergencia: {
        nombre: 'Andrés Guerrero',
        parentesco: 'Hermano',
        telefono: '3124567899'
      }
    }
  ];

  private mockCualidades: Cualidad[] = [
    { id: 'primeros_auxilios', nombre: 'Primeros Auxilios', categoria: 'medica', descripcion: 'Atención básica de emergencias médicas' },
    { id: 'paramedicina', nombre: 'Paramedicina', categoria: 'medica', descripcion: 'Atención médica avanzada prehospitalaria' },
    { id: 'rescate_acuatico', nombre: 'Rescate Acuático', categoria: 'rescate', descripcion: 'Rescate en ambientes acuáticos' },
    { id: 'rescate_urbano', nombre: 'Rescate Urbano', categoria: 'rescate', descripcion: 'Rescate en estructuras colapsadas' },
    { id: 'rescate_vehicular', nombre: 'Rescate Vehicular', categoria: 'rescate', descripcion: 'Extracción de víctimas en accidentes vehiculares' },
    { id: 'manejo_materiales_peligrosos', nombre: 'Materiales Peligrosos', categoria: 'tecnica', descripcion: 'Manejo de sustancias químicas peligrosas' },
    { id: 'liderazgo', nombre: 'Liderazgo', categoria: 'administrativa', descripcion: 'Capacidad de liderar equipos de trabajo' },
    { id: 'instructor', nombre: 'Instructor', categoria: 'administrativa', descripcion: 'Capacitación y entrenamiento de personal' },
    { id: 'comunicaciones', nombre: 'Comunicaciones', categoria: 'operativa', descripcion: 'Manejo de equipos de comunicación' },
    { id: 'conduccion_emergencia', nombre: 'Conducción de Emergencia', categoria: 'operativa', descripcion: 'Conducción de vehículos de emergencia' }
  ];

  private mockCargos: Cargo[] = [
    { id: 'bombero', nombre: 'Bombero', descripcion: 'Personal operativo básico' },
    { id: 'cabo', nombre: 'Cabo', descripcion: 'Supervisor de grupo pequeño' },
    { id: 'sargento', nombre: 'Sargento', descripcion: 'Supervisor de turno' },
    { id: 'teniente', nombre: 'Teniente', descripcion: 'Jefe de compañía' },
    { id: 'capitan', nombre: 'Capitán', descripcion: 'Jefe de estación' },
    { id: 'mayor', nombre: 'Mayor', descripcion: 'Jefe de distrito' },
    { id: 'comandante', nombre: 'Comandante', descripcion: 'Jefe general del cuerpo' }
  ];

  private mockRangos: Rango[] = [
    { id: 'bombero_voluntario', nombre: 'Bombero Voluntario', nivel: 1, descripcion: 'Personal voluntario en entrenamiento' },
    { id: 'bombero_auxiliar', nombre: 'Bombero Auxiliar', nivel: 2, descripcion: 'Personal auxiliar con entrenamiento básico' },
    { id: 'bombero_profesional', nombre: 'Bombero Profesional', nivel: 3, descripcion: 'Personal profesional operativo' },
    { id: 'cabo', nombre: 'Cabo', nivel: 4, descripcion: 'Suboficial básico' },
    { id: 'sargento', nombre: 'Sargento', nivel: 5, descripcion: 'Suboficial intermedio' },
    { id: 'teniente', nombre: 'Teniente', nivel: 6, descripcion: 'Oficial básico' },
    { id: 'capitan', nombre: 'Capitán', nivel: 7, descripcion: 'Oficial intermedio' },
    { id: 'mayor', nombre: 'Mayor', nivel: 8, descripcion: 'Oficial superior' },
    { id: 'comandante', nombre: 'Comandante', nivel: 9, descripcion: 'Oficial general' }
  ];

  constructor() { }

  // Obtener todo el personal
  getPersonal(): Observable<Personal[]> {
    return of(this.mockPersonal);
  }

  // Obtener personal por ID
  getPersonalById(id: number): Observable<Personal | undefined> {
    const personal = this.mockPersonal.find(p => p.id === id);
    return of(personal);
  }

  // Crear nuevo personal
  createPersonal(personal: Personal): Observable<Personal> {
    const newId = Math.max(...this.mockPersonal.map(p => p.id || 0)) + 1;
    const newPersonal = { ...personal, id: newId };
    this.mockPersonal.push(newPersonal);
    return of(newPersonal);
  }

  // Actualizar personal
  updatePersonal(id: number, personal: Personal): Observable<Personal> {
    const index = this.mockPersonal.findIndex(p => p.id === id);
    if (index !== -1) {
      this.mockPersonal[index] = { ...personal, id };
      return of(this.mockPersonal[index]);
    }
    throw new Error('Personal no encontrado');
  }

  // Eliminar personal
  deletePersonal(id: number): Observable<boolean> {
    const index = this.mockPersonal.findIndex(p => p.id === id);
    if (index !== -1) {
      this.mockPersonal.splice(index, 1);
      return of(true);
    }
    return of(false);
  }

  // Obtener cualidades disponibles
  getCualidades(): Observable<Cualidad[]> {
    return of(this.mockCualidades);
  }

  // Obtener cargos disponibles
  getCargos(): Observable<Cargo[]> {
    return of(this.mockCargos);
  }

  // Obtener rangos disponibles
  getRangos(): Observable<Rango[]> {
    return of(this.mockRangos);
  }

  // Obtener estadísticas del personal
  getPersonalStats(): Observable<PersonalStats> {
    const total = this.mockPersonal.length;
    const activo = this.mockPersonal.filter(p => p.estado === 'activo').length;
    const inactivo = this.mockPersonal.filter(p => p.estado === 'inactivo').length;
    const licencia = this.mockPersonal.filter(p => p.estado === 'licencia').length;
    
    const totalExperiencia = this.mockPersonal.reduce((sum, p) => sum + p.experienciaAnios, 0);
    const promedioExperiencia = total > 0 ? totalExperiencia / total : 0;

    // Distribución por cargo
    const distribucuionPorCargo: { [cargo: string]: number } = {};
    this.mockPersonal.forEach(p => {
      distribucuionPorCargo[p.cargo] = (distribucuionPorCargo[p.cargo] || 0) + 1;
    });

    // Cualidades más comunes
    const cualidadesCount: { [cualidad: string]: number } = {};
    this.mockPersonal.forEach(p => {
      p.cualidades.forEach(c => {
        cualidadesCount[c] = (cualidadesCount[c] || 0) + 1;
      });
    });

    const cualidadesMasComunes = Object.entries(cualidadesCount)
      .map(([cualidad, cantidad]) => ({ cualidad, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);

    const stats: PersonalStats = {
      totalPersonal: total,
      personalActivo: activo,
      personalInactivo: inactivo,
      personalEnLicencia: licencia,
      promedioExperiencia,
      distribucuionPorCargo,
      cualidadesMasComunes
    };

    return of(stats);
  }

  // Tipos de sangre disponibles
  getTiposSangre(): string[] {
    return ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  }

  // Estados disponibles
  getEstados(): Array<{value: string, label: string}> {
    return [
      { value: 'activo', label: 'Activo' },
      { value: 'inactivo', label: 'Inactivo' },
      { value: 'licencia', label: 'En Licencia' }
    ];
  }
} 