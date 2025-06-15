import { Injectable } from '@angular/core';
import { Emergency } from '../interfaces/emergency.interface';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private mockEmergencies: Emergency[] = [
    // Emergencias recientes (últimas 24 horas)
    {
      id: 1,
      tipo: 'Incendio',
      direccion: 'Centro Comercial Plaza Mayor, Local 45',
      fecha: new Date('2024-12-28T14:30:00'),
      estado: 'activa',
      descripcion: 'Incendio en tienda de electrodomésticos, sistema de rociadores activado',
      unidades: 4
    },
    {
      id: 2,
      tipo: 'Rescate',
      direccion: 'Edificio Torre Norte, Piso 15',
      fecha: new Date('2024-12-28T13:15:00'),
      estado: 'en_proceso',
      descripcion: 'Persona atrapada en ascensor durante 2 horas',
      unidades: 2
    },
    {
      id: 3,
      tipo: 'Accidente',
      direccion: 'Autopista Norte Km 47, Peaje',
      fecha: new Date('2024-12-28T11:45:00'),
      estado: 'resuelta',
      descripcion: 'Accidente vehicular múltiple, 3 vehículos involucrados',
      unidades: 3
    },
    {
      id: 4,
      tipo: 'Emergencia Médica',
      direccion: 'Universidad Central, Aula Magna',
      fecha: new Date('2024-12-28T10:20:00'),
      estado: 'resuelta',
      descripcion: 'Estudiante con crisis asmática durante conferencia',
      unidades: 1
    },
    {
      id: 5,
      tipo: 'Materiales Peligrosos',
      direccion: 'Zona Industrial El Progreso, Bodega 12',
      fecha: new Date('2024-12-28T09:30:00'),
      estado: 'resuelta',
      descripcion: 'Derrame de químicos en área de almacenamiento',
      unidades: 5
    },

    // Emergencias de días anteriores
    {
      id: 6,
      tipo: 'Incendio',
      direccion: 'Barrio La Esperanza, Casa 123',
      fecha: new Date('2024-12-27T22:15:00'),
      estado: 'resuelta',
      descripcion: 'Incendio estructural en vivienda unifamiliar',
      unidades: 3
    },
    {
      id: 7,
      tipo: 'Inundación',
      direccion: 'Sector Valle Bajo, Calle Principal',
      fecha: new Date('2024-12-27T19:45:00'),
      estado: 'resuelta',
      descripcion: 'Inundación por rotura de tubería principal',
      unidades: 4
    },
    {
      id: 8,
      tipo: 'Rescate',
      direccion: 'Cerro Las Águilas, Sendero Norte',
      fecha: new Date('2024-12-27T16:30:00'),
      estado: 'resuelta',
      descripcion: 'Rescate de excursionista con tobillo fracturado',
      unidades: 3
    },
    {
      id: 9,
      tipo: 'Accidente',
      direccion: 'Puente Río Verde, Carril Izquierdo',
      fecha: new Date('2024-12-27T14:20:00'),
      estado: 'resuelta',
      descripcion: 'Colisión entre motocicleta y automóvil',
      unidades: 2
    },
    {
      id: 10,
      tipo: 'Emergencia Médica',
      direccion: 'Mercado Central, Puesto 78',
      fecha: new Date('2024-12-27T12:10:00'),
      estado: 'resuelta',
      descripcion: 'Comerciante con posible infarto, trasladado a hospital',
      unidades: 1
    },

    // Emergencias de esta semana
    {
      id: 11,
      tipo: 'Incendio',
      direccion: 'Fábrica Textil San José',
      fecha: new Date('2024-12-26T18:45:00'),
      estado: 'resuelta',
      descripcion: 'Incendio en área de producción, evacuación completa',
      unidades: 6
    },
    {
      id: 12,
      tipo: 'Rescate',
      direccion: 'Túnel La Montaña, Km 2',
      fecha: new Date('2024-12-26T15:30:00'),
      estado: 'resuelta',
      descripcion: 'Vehículo volcado en túnel, conductor atrapado',
      unidades: 4
    },
    {
      id: 13,
      tipo: 'Materiales Peligrosos',
      direccion: 'Planta Química Norte, Sector A',
      fecha: new Date('2024-12-25T20:15:00'),
      estado: 'resuelta',
      descripcion: 'Fuga menor de gas tóxico, área evacuada preventivamente',
      unidades: 5
    },
    {
      id: 14,
      tipo: 'Incendio',
      direccion: 'Hotel Plaza Central, Piso 8',
      fecha: new Date('2024-12-24T23:30:00'),
      estado: 'resuelta',
      descripcion: 'Incendio en habitación por cortocircuito eléctrico',
      unidades: 3
    },
    {
      id: 15,
      tipo: 'Emergencia Médica',
      direccion: 'Terminal de Buses, Sala de Espera',
      fecha: new Date('2024-12-24T17:20:00'),
      estado: 'resuelta',
      descripcion: 'Pasajera en trabajo de parto prematuro',
      unidades: 1
    },

    // Emergencias del mes pasado
    {
      id: 16,
      tipo: 'Inundación',
      direccion: 'Barrio El Río, Sector Bajo',
      fecha: new Date('2024-11-28T14:15:00'),
      estado: 'resuelta',
      descripcion: 'Inundación por desborde del río tras lluvias intensas',
      unidades: 8
    },
    {
      id: 17,
      tipo: 'Rescate',
      direccion: 'Mina El Dorado, Túnel Principal',
      fecha: new Date('2024-11-25T11:45:00'),
      estado: 'resuelta',
      descripcion: 'Minero atrapado por derrumbe menor',
      unidades: 6
    },
    {
      id: 18,
      tipo: 'Incendio',
      direccion: 'Bosque Municipal, Sector Norte',
      fecha: new Date('2024-11-22T16:30:00'),
      estado: 'resuelta',
      descripcion: 'Incendio forestal controlado, causa: fogata mal apagada',
      unidades: 5
    },
    {
      id: 19,
      tipo: 'Accidente',
      direccion: 'Carretera Central, Km 15',
      fecha: new Date('2024-11-20T08:20:00'),
      estado: 'resuelta',
      descripcion: 'Volcamiento de camión cisterna, sin heridos',
      unidades: 4
    },
    {
      id: 20,
      tipo: 'Materiales Peligrosos',
      direccion: 'Depósito Combustibles, Tanque 3',
      fecha: new Date('2024-11-18T19:10:00'),
      estado: 'resuelta',
      descripcion: 'Fuga de combustible en tanque de almacenamiento',
      unidades: 7
    },

    // Casos especiales y de alta complejidad
    {
      id: 21,
      tipo: 'Rescate',
      direccion: 'Edificio en Construcción, Torre Este',
      fecha: new Date('2024-11-15T13:45:00'),
      estado: 'resuelta',
      descripcion: 'Obrero atrapado en estructura colapsada',
      unidades: 8
    },
    {
      id: 22,
      tipo: 'Incendio',
      direccion: 'Centro Histórico, Museo Colonial',
      fecha: new Date('2024-11-12T21:30:00'),
      estado: 'resuelta',
      descripcion: 'Incendio en edificio patrimonial, rescate de obras de arte',
      unidades: 6
    },
    {
      id: 23,
      tipo: 'Emergencia Médica',
      direccion: 'Estadio Municipal, Tribuna Norte',
      fecha: new Date('2024-11-10T20:15:00'),
      estado: 'resuelta',
      descripcion: 'Múltiples personas afectadas por gases lacrimógenos',
      unidades: 4
    },
    {
      id: 24,
      tipo: 'Accidente',
      direccion: 'Aeropuerto Internacional, Pista 2',
      fecha: new Date('2024-11-08T15:20:00'),
      estado: 'resuelta',
      descripcion: 'Emergencia en aterrizaje, evacuación preventiva',
      unidades: 10
    },
    {
      id: 25,
      tipo: 'Incendio',
      direccion: 'Zona Industrial, Almacén Químicos',
      fecha: new Date('2024-11-05T12:30:00'),
      estado: 'resuelta',
      descripcion: 'Incendio con riesgo de explosión, área evacuada 2km',
      unidades: 12
    }
  ];

  getTotalEmergencies(): number {
    return this.mockEmergencies.length;
  }

  getLatestEmergencies(): Emergency[] {
    return this.mockEmergencies
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
      .slice(0, 8);
  }

  getEmergencyTypes(): { tipo: string; cantidad: number }[] {
    const tipos = this.mockEmergencies.reduce((acc, curr) => {
      acc[curr.tipo] = (acc[curr.tipo] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    return Object.entries(tipos).map(([tipo, cantidad]) => ({
      tipo,
      cantidad
    })).sort((a, b) => b.cantidad - a.cantidad);
  }

  getActiveEmergencies(): number {
    return this.mockEmergencies.filter(e => e.estado === 'activa').length;
  }

  getEmergenciesInProcess(): number {
    return this.mockEmergencies.filter(e => e.estado === 'en_proceso').length;
  }

  getResolvedEmergencies(): number {
    return this.mockEmergencies.filter(e => e.estado === 'resuelta').length;
  }

  getSuccessRate(): number {
    const total = this.mockEmergencies.length;
    const resolved = this.getResolvedEmergencies();
    return total > 0 ? Math.round((resolved / total) * 100) : 0;
  }

  getAverageResponseTime(): number {
    // Simular tiempos de respuesta promedio en minutos
    const responseTimes = [8, 12, 6, 15, 9, 11, 7, 13, 10, 14, 8, 9];
    const sum = responseTimes.reduce((a, b) => a + b, 0);
    return Math.round((sum / responseTimes.length) * 10) / 10;
  }

  getEmergenciesToday(): Emergency[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.mockEmergencies.filter(e => 
      e.fecha >= today && e.fecha < tomorrow
    );
  }

  getEmergenciesThisWeek(): Emergency[] {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    return this.mockEmergencies.filter(e => e.fecha >= weekAgo);
  }

  getEmergenciesThisMonth(): Emergency[] {
    const now = new Date();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    return this.mockEmergencies.filter(e => e.fecha >= monthAgo);
  }

  getEmergenciesByLocation(): { ubicacion: string; cantidad: number }[] {
    const locations = this.mockEmergencies.reduce((acc, curr) => {
      // Extraer la zona principal de la dirección
      const zona = curr.direccion.split(',')[0].trim();
      acc[zona] = (acc[zona] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    return Object.entries(locations).map(([ubicacion, cantidad]) => ({
      ubicacion,
      cantidad
    })).sort((a, b) => b.cantidad - a.cantidad).slice(0, 10);
  }

  getEmergenciesBySeverity(): { severidad: string; cantidad: number }[] {
    // Simular niveles de severidad basados en el número de unidades
    const severities = this.mockEmergencies.map(e => {
      if (e.unidades >= 8) return 'Crítica';
      if (e.unidades >= 5) return 'Alta';
      if (e.unidades >= 3) return 'Media';
      return 'Baja';
    });

    const severityCount = severities.reduce((acc, severity) => {
      acc[severity] = (acc[severity] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    return Object.entries(severityCount).map(([severidad, cantidad]) => ({
      severidad,
      cantidad
    }));
  }
} 