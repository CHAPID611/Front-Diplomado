import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-emergencias-container',
  templateUrl: './emergencias-container.component.html',
  styleUrls: ['./emergencias-container.component.css']
})
export class EmergenciasContainerComponent {
  emergencias: { id: string, tipo: string, form: FormGroup }[] = [];
  selectedIndex = 0;

  constructor(private fb: FormBuilder) {
    this.agregarEmergencia();
  }

  agregarEmergencia() {
    const id = Date.now().toString();
    const form = this.fb.group({}); // Aquí puedes clonar la estructura de tu emergencyForm si lo deseas
    this.emergencias.push({ id, tipo: 'Nueva', form });
    this.selectedIndex = this.emergencias.length - 1;
  }

  onTipoChange(tipo: string, idx: number) {
    this.emergencias[idx].tipo = tipo;
  }
} 