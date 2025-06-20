import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmergencyFormBackendComponent } from '../emergency-form-backend/emergency-form-backend.component';
  
@Component({
  selector: 'app-emergencias-container',
  templateUrl: './emergencias-container.component.html',
  styleUrls: ['./emergencias-container.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    EmergencyFormBackendComponent
  ]
})
export class EmergenciasContainerComponent {
  constructor() {}
} 