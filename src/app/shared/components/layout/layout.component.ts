import { Component, OnInit, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { RouterOutlet, RouterModule, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { filter } from 'rxjs/operators';

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
    <mat-sidenav-container class="sidenav-container" [class.dashboard-view]="isDashboard">
      <!-- Sidebar -->
      <mat-sidenav #drawer class="sidenav" fixedInViewport="false" [mode]="sidenavMode" [opened]="sidenavOpened">
        <div class="sidenav-header">
          <div class="header-content">
            <mat-icon class="fire-icon">local_fire_department</mat-icon>
            <div class="header-text">
              <h3>Bomberos</h3>
            </div>
          </div>
          <button mat-icon-button (click)="toggleSidenav()" class="close-btn">
            <mat-icon>close</mat-icon>
          </button>
        </div>
        
        <mat-nav-list class="nav-list">
          <a mat-list-item routerLink="/dashboard" (click)="closeSidenavOnMobile()" routerLinkActive="active">
            <mat-icon matListItemIcon>dashboard</mat-icon>
            <span matListItemTitle>Dashboard</span>
          </a>
          
          <a mat-list-item routerLink="/emergencias" (click)="closeSidenavOnMobile()" routerLinkActive="active">
            <mat-icon matListItemIcon>local_fire_department</mat-icon>
            <span matListItemTitle>Emergencias</span>
          </a>
          
          <a mat-list-item *ngIf="userRole === 'admin'" routerLink="/reportes" (click)="closeSidenavOnMobile()" routerLinkActive="active">
            <mat-icon matListItemIcon>assessment</mat-icon>
            <span matListItemTitle>Reportes</span>
          </a>
          
          <a mat-list-item *ngIf="userRole === 'admin'" routerLink="/personal" (click)="closeSidenavOnMobile()" routerLinkActive="active">
            <mat-icon matListItemIcon>people</mat-icon>
            <span matListItemTitle>Personal</span>
          </a>

          <a mat-list-item *ngIf="userRole === 'admin'" routerLink="/vehiculos" (click)="closeSidenavOnMobile()" routerLinkActive="active">
            <mat-icon matListItemIcon>directions_car</mat-icon>
            <span matListItemTitle>Vehículos</span>
          </a>
          
          <mat-divider class="menu-divider"></mat-divider>
          
          <a mat-list-item (click)="logout(); closeSidenavOnMobile()" class="logout-item">
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
            (click)="toggleSidenav()"
            class="menu-btn"
            *ngIf="!sidenavOpened || sidenavMode === 'over'">
            <mat-icon>menu</mat-icon>
          </button>
          
          <div class="navbar-brand">
            <span class="app-title">Sistema de Gestión de Emergencias</span>
          </div>
          
          <span class="spacer"></span>
        </mat-toolbar>

        <!-- Page content -->
        <div class="content" [class.dashboard-content]="isDashboard">
          <router-outlet></router-outlet>
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    /* Deshabilitar overscroll en toda la aplicación */
    :host {
      overscroll-behavior: none;
    }

    :host ::ng-deep html,
    :host ::ng-deep body {
      overscroll-behavior: none;
      overscroll-behavior-x: none;
      overscroll-behavior-y: none;
    }

    .sidenav-container {
      height: 100vh;
      background-color: var(--bg-secondary, #f8f9fa);
      overscroll-behavior: none;
    }

    .sidenav {
      width: 280px;
      box-shadow: var(--shadow-lg, 0 8px 24px rgba(0, 0, 0, 0.12));
      background-color: var(--bg-primary, #ffffff);
      border-right: 1px solid #ffffff;
      overflow-x: hidden;
      overflow-y: auto;
      box-sizing: border-box;
      border-radius: 0;
    }

    .sidenav-header {
      background: black;
      color: #ffffff;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      min-height: 80px;
      box-shadow: var(--shadow-sm, 0 2px 4px rgba(0, 0, 0, 0.05));
      overflow: hidden;
      box-sizing: border-box;
      width: 100%;
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
      color: #ffffff;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
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
      overflow-x: hidden;
      width: 100%;
      box-sizing: border-box;
    }

    .nav-list a[mat-list-item] {
      margin: 4px 12px;
      border-radius: 8px;
      transition: all 0.3s ease;
      color: var(--text-primary, #2c3e50);
      min-height: 48px;
      border: 1px solid transparent;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: calc(100% - 24px);
      box-sizing: border-box;
    }

    .nav-list a[mat-list-item]:hover {
      background-color: var(--bg-secondary, #f8f9fa);
      border-color: var(--border-light, #e9ecef);
      transform: translateX(2px);
    }

    .nav-list a[mat-list-item].active {
      background-color: var(--primary-blue-subtle, rgba(14, 40, 104, 0.08));
      color: var(--primary-blue, #0e2868);
      border-color: var(--primary-blue, #0e2868);
      font-weight: 500;
    }

    .nav-list a[mat-list-item].active mat-icon {
      color: var(--primary-blue, #0e2868);
    }

    .nav-list a[mat-list-item] mat-icon {
      color: var(--text-secondary, #6c757d);
      transition: color 0.3s ease;
    }

    .nav-list a[mat-list-item]:hover mat-icon {
      color: var(--primary-blue, #0e2868);
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
      background: black;
      color: #ffffff;
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: var(--shadow-md, 0 4px 8px rgba(0, 0, 0, 0.1));
      min-height: 80px;
      border-bottom: 1px solid var(--border-light, #e9ecef);
    }

    .navbar-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
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
      transition: margin 0.3s ease-in-out;
      overscroll-behavior: none;
      overflow-y: auto;
    }

    /* Estilos específicos para la vista del dashboard */
    .sidenav-container.dashboard-view {
      overflow: hidden !important;
    }

    .sidenav-container.dashboard-view .content.dashboard-content {
      overflow: hidden !important;
      height: calc(100vh - 80px) !important;
      min-height: unset !important;
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
      color: var(--primary-blue, #0e2868) !important;
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
  @ViewChild('drawer') drawer!: MatSidenav;
  
  userRole: string = '';
  sidenavMode: 'over' | 'side' = 'side';
  sidenavOpened: boolean = true;
  isDashboard: boolean = false;

  constructor(private authService: AuthService, private router: Router) { }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  ngOnInit(): void {
    this.userRole = this.authService.getUserRole();
    console.log('LayoutComponent: Rol de usuario en ngOnInit:', this.userRole);
    this.checkScreenSize();
    
    // Detectar cambios de ruta para ocultar scroll en dashboard
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.isDashboard = event.url === '/dashboard' || event.url === '/';
    });
    
    // Verificar ruta inicial
    this.isDashboard = this.router.url === '/dashboard' || this.router.url === '/';
  }

  checkScreenSize() {
    if (window.innerWidth <= 768) {
      this.sidenavMode = 'over';
      this.sidenavOpened = false;
    } else {
      this.sidenavMode = 'side';
      this.sidenavOpened = true;
    }
  }

  toggleSidenav() {
    if (this.sidenavMode === 'over') {
      this.drawer.toggle();
    } else {
      this.sidenavOpened = !this.sidenavOpened;
    }
  }

  closeSidenavOnMobile() {
    if (this.sidenavMode === 'over') {
      this.drawer.close();
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
} 