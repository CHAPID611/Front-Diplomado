import { Routes } from '@angular/router';
import { LoginComponent } from './features/login/login.component';

export const routes: Routes = [
    {
        path: '', // Ruta raíz
        redirectTo: '/login', // Redirigir a /login
        pathMatch: 'full' // Coincidir exactamente con la ruta raíz
    },
    {
        path: 'login',
        component: LoginComponent,
        title: 'Login'
    }
];
