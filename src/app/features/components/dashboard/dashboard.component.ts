import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../../../core/services/dashboard.service';
import { Emergency } from '../../../core/interfaces/emergency.interface';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatListModule,
    MatChipsModule,
    MatIconModule
  ]
})
export class DashboardComponent implements OnInit {
  totalEmergencies: number = 0;
  activeEmergencies: number = 0;
  latestEmergencies: Emergency[] = [];
  emergencyTypes: { tipo: string; cantidad: number }[] = [];

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.totalEmergencies = this.dashboardService.getTotalEmergencies();
    this.activeEmergencies = this.dashboardService.getActiveEmergencies();
    this.latestEmergencies = this.dashboardService.getLatestEmergencies();
    this.emergencyTypes = this.dashboardService.getEmergencyTypes();
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'activa':
        return 'Activa';
      case 'en_proceso':
        return 'En Proceso';
      case 'resuelta':
        return 'Resuelta';
      default:
        return status;
    }
  }
}
