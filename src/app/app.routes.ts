import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { AdminGuard } from './core/guards/admin.guard';
import { LoginComponent } from './features/login/login.component';
import { DashboardComponent } from './features/components/dashboard/dashboard.component';
import { PersonalComponent } from './features/components/personal/personal.component';
import { ReportsComponent } from './features/components/reports/reports.component';
import { VehiclesComponent } from './features/components/vehicles/vehicles.component';
import { LayoutComponent } from './shared/components/layout/layout.component';
import { EmergencyFormBackendComponent } from './features/components/emergency-form-backend/emergency-form-backend.component';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    {
        path: '',
        component: LayoutComponent,
        canActivate: [AuthGuard],
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            { path: 'dashboard', component: DashboardComponent },
            { path: 'emergencias', component: EmergencyFormBackendComponent },
            { 
                path: 'personal', 
                component: PersonalComponent,
                canActivate: [AdminGuard]
            },
            { path: 'reportes', component: ReportsComponent },
            {
                path: 'vehiculos',
                component: VehiclesComponent,
                canActivate: [AdminGuard]
            }
        ]
    }
];
