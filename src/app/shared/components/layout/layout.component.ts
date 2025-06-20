import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { RouterOutlet, RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatSidenavModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatDividerModule,
    MatMenuModule,
    RouterOutlet,
    RouterModule
  ],
  template: `
    <mat-sidenav-container class="sidenav-container">
      <!-- Sidebar -->
      <mat-sidenav #drawer class="sidenav" fixedInViewport mode="over">
        <div class="sidenav-header">
          <div class="header-content">
            <mat-icon class="fire-icon">local_fire_department</mat-icon>
            <div class="header-text">
              <h3>Bomberos</h3>
              <p>Sistema de Emergencias</p>
            </div>
          </div>
          <button mat-icon-button (click)="drawer.toggle()" class="close-btn">
            <mat-icon>close</mat-icon>
          </button>
        </div>
        
        <mat-nav-list class="nav-list">
          <a mat-list-item routerLink="/dashboard" (click)="drawer.close()" routerLinkActive="active">
            <mat-icon matListItemIcon>dashboard</mat-icon>
            <span matListItemTitle>Dashboard</span>
          </a>
          
          <a mat-list-item routerLink="/emergencias" (click)="drawer.close()" routerLinkActive="active">
            <mat-icon matListItemIcon>local_fire_department</mat-icon>
            <span matListItemTitle>Emergencias</span>
          </a>
          
          <a mat-list-item *ngIf="userRole === 'admin'" routerLink="/reportes" (click)="drawer.close()" routerLinkActive="active">
            <mat-icon matListItemIcon>assessment</mat-icon>
            <span matListItemTitle>Reportes</span>
          </a>
          
          <a mat-list-item *ngIf="userRole === 'admin'" routerLink="/personal" (click)="drawer.close()" routerLinkActive="active">
            <mat-icon matListItemIcon>people</mat-icon>
            <span matListItemTitle>Personal</span>
          </a>

          <a mat-list-item *ngIf="userRole === 'admin'" routerLink="/vehiculos" (click)="drawer.close()" routerLinkActive="active">
            <mat-icon matListItemIcon>directions_car</mat-icon>
            <span matListItemTitle>Vehículos</span>
          </a>
          
          <mat-divider class="menu-divider"></mat-divider>
          
          <a mat-list-item *ngIf="userRole === 'admin'" routerLink="/configuracion" (click)="drawer.close()" routerLinkActive="active">
            <mat-icon matListItemIcon>settings</mat-icon>
            <span matListItemTitle>Configuración</span>
          </a>
          
          <a mat-list-item (click)="logout(); drawer.close()" class="logout-item">
            <mat-icon matListItemIcon>logout</mat-icon>
            <span matListItemTitle>Cerrar Sesión</span>
          </a>
        </mat-nav-list>
      </mat-sidenav>

      <!-- Main content -->
      <mat-sidenav-content>
        <!-- Navbar -->
        <mat-toolbar class="navbar">
          <button
            type="button"
            mat-icon-button
            (click)="drawer.toggle()"
            class="menu-btn">
            <mat-icon>menu</mat-icon>
          </button>
          
          <div class="navbar-brand">
            <mat-icon class="brand-icon">local_fire_department</mat-icon>
            <span class="app-title">Sistema de Gestión de Emergencias</span>
          </div>
          
          <span class="spacer"></span>
        </mat-toolbar>

        <!-- Page content -->
        <div class="content">
          <router-outlet></router-outlet>
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .sidenav-container {
      height: 100vh;
      background-color: var(--bg-secondary, #f8f9fa);
    }

    .sidenav {
      width: 280px;
      box-shadow: var(--shadow-lg, 0 8px 24px rgba(0, 0, 0, 0.12));
      background-color: var(--bg-primary, #ffffff);
      border-right: 1px solid var(--border-light, #e9ecef);
    }

    .sidenav-header {
      background: var(--gradient-red, linear-gradient(135deg, #c62828 0%, #b71c1c 100%));
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      min-height: 80px;
      box-shadow: var(--shadow-sm, 0 2px 4px rgba(0, 0, 0, 0.05));
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .fire-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #fff3cd;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
    }

    .header-text h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    .header-text p {
      margin: 0;
      font-size: 12px;
      opacity: 0.9;
      font-weight: 400;
    }

    .close-btn {
      color: white;
      transition: background-color 0.3s ease;
    }

    .close-btn:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }

    .nav-list {
      padding: 16px 0;
    }

    .nav-list a[mat-list-item] {
      margin: 4px 12px;
      border-radius: 8px;
      transition: all 0.3s ease;
      color: var(--text-primary, #2c3e50);
      min-height: 48px;
      border: 1px solid transparent;
    }

    .nav-list a[mat-list-item]:hover {
      background-color: var(--bg-secondary, #f8f9fa);
      border-color: var(--border-light, #e9ecef);
      transform: translateX(2px);
    }

    .nav-list a[mat-list-item].active {
      background-color: var(--primary-red-subtle, rgba(198, 40, 40, 0.08));
      color: var(--primary-red, #c62828);
      border-color: var(--primary-red, #c62828);
      font-weight: 500;
    }

    .nav-list a[mat-list-item].active mat-icon {
      color: var(--primary-red, #c62828);
    }

    .nav-list a[mat-list-item] mat-icon {
      color: var(--text-secondary, #6c757d);
      transition: color 0.3s ease;
    }

    .nav-list a[mat-list-item]:hover mat-icon {
      color: var(--primary-red, #c62828);
    }

    .logout-item {
      color: var(--danger, #dc3545) !important;
    }

    .logout-item mat-icon {
      color: var(--danger, #dc3545) !important;
    }

    .logout-item:hover {
      background-color: rgba(220, 53, 69, 0.05) !important;
      border-color: var(--danger, #dc3545) !important;
    }

    .menu-divider {
      margin: 16px 12px;
      border-color: var(--border-light, #e9ecef);
    }

    .navbar {
      background: var(--primary-red, #c62828);
      color: white;
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: var(--shadow-md, 0 4px 8px rgba(0, 0, 0, 0.1));
      min-height: 64px;
      border-bottom: 1px solid var(--border-light, #e9ecef);
    }

    .navbar-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
    }

    .brand-icon {
      color: #fff3cd;
      font-size: 28px;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
    }

    .app-title {
      font-size: 18px;
      font-weight: 600;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    .menu-btn, .user-btn {
      color: white;
      transition: background-color 0.3s ease;
    }

    .menu-btn:hover, .user-btn:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }

    .spacer {
      flex: 1 1 auto;
    }

    .content {
      padding: 0;
      background-color: var(--bg-secondary, #f8f9fa);
      min-height: calc(100vh - 64px);
    }

    /* Personalización del menú de usuario */
    .mat-mdc-menu-panel {
      border-radius: 8px !important;
      box-shadow: var(--shadow-lg, 0 8px 24px rgba(0, 0, 0, 0.12)) !important;
      border: 1px solid var(--border-light, #e9ecef) !important;
    }

    .mat-mdc-menu-item {
      color: var(--text-primary, #2c3e50) !important;
      transition: all 0.3s ease !important;
    }

    .mat-mdc-menu-item:hover {
      background-color: var(--bg-secondary, #f8f9fa) !important;
    }

    .mat-mdc-menu-item mat-icon {
      color: var(--text-secondary, #6c757d) !important;
      margin-right: 12px !important;
    }

    .mat-mdc-menu-item:hover mat-icon {
      color: var(--primary-red, #c62828) !important;
    }

    /* Responsive design */
    @media (max-width: 768px) {
      .sidenav {
        width: 260px;
      }

      .sidenav-header {
        padding: 16px;
        min-height: 72px;
      }

      .fire-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
      }

      .header-text h3 {
        font-size: 16px;
      }

      .header-text p {
        font-size: 11px;
      }

      .app-title {
        font-size: 16px;
      }

      .brand-icon {
        font-size: 24px;
      }

      .navbar {
        min-height: 56px;
      }

      .content {
        min-height: calc(100vh - 56px);
      }
    }

    @media (max-width: 480px) {
      .sidenav {
        width: 240px;
      }

      .app-title {
        display: none;
      }

      .navbar-brand {
        gap: 8px;
      }
    }
  `]
})
export class LayoutComponent implements OnInit {
  userRole: string = '';

  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit(): void {
    this.userRole = this.authService.getUserRole();
    console.log('LayoutComponent: Rol de usuario en ngOnInit:', this.userRole);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
} 