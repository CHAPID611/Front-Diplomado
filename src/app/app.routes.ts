import { Routes } from '@angular/router';

// Layout y componentes principales
import { LayoutComponent } from './shared/components/layout/layout.component';
import { DashboardComponent } from './features/components/dashboard/dashboard.component';
import { EmergencyFormComponent } from './features/components/emergency-form/emergency-form.component';
import { ReportsComponent } from './features/components/reports/reports.component';
import { PersonalComponent } from './features/components/personal/personal.component';
import { LoginComponent } from './features/login/login.component';

export const routes: Routes = [
    {
        path: '',
        component: LayoutComponent,
        children: [
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            },
            {
                path: 'dashboard',
                component: DashboardComponent,
                title: 'Dashboard'
            },
            {
                path: 'emergencias',
                component: EmergencyFormComponent,
                title: 'Registro de Emergencias'
            },
            {
                path: 'reportes',
                component: ReportsComponent,
                title: 'Reportes y Estadísticas'
            },
            {
                path: 'personal',
                component: PersonalComponent,
                title: 'Gestión de Personal'
            }
        ]
    },
    {
        path: 'login',
        component: LoginComponent,
        title: 'Login'
    }
];
