export interface Emergency {
  id: number;
  tipo: string;
  direccion: string;
  fecha: Date;
  estado: 'activa' | 'resuelta' | 'en_proceso';
  descripcion: string;
  unidades: number;
} 