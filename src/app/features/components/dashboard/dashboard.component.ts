import { Component, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  // Ya no necesitas propiedades como totalEmergencies, activeEmergencies, etc.

  ngOnInit() {
    // Ocultar barra de scroll del body y html cuando se carga el dashboard
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    // También aplicar al contenedor del layout si existe
    const sidenavContainer = document.querySelector('.sidenav-container') as HTMLElement;
    if (sidenavContainer) {
      sidenavContainer.style.overflow = 'hidden';
    }
    
    const contentDiv = document.querySelector('.content') as HTMLElement;
    if (contentDiv) {
      contentDiv.style.overflow = 'hidden';
    }
  }

  ngOnDestroy() {
    // Restaurar barra de scroll cuando se sale del dashboard
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
    
    // Restaurar el contenedor del layout
    const sidenavContainer = document.querySelector('.sidenav-container') as HTMLElement;
    if (sidenavContainer) {
      sidenavContainer.style.overflow = 'auto';
    }
    
    const contentDiv = document.querySelector('.content') as HTMLElement;
    if (contentDiv) {
      contentDiv.style.overflow = 'auto';
    }
  }
}
