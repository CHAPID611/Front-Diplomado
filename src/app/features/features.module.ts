import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';

// Material Imports
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

// Components
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { EmergenciasContainerComponent } from './components/emergencias-container/emergencias-container.component';
import { EmergencyFormBackendComponent } from './components/emergency-form-backend/emergency-form-backend.component';
import { PersonalComponent } from './components/personal/personal.component';
import { PersonalFormComponent } from './components/personal/personal-form/personal-form.component';
import { PersonalDetailsComponent } from './components/personal/personal-details/personal-details.component';
import { CualidadesDialogComponent } from './components/personal/cualidades-dialog/cualidades-dialog.component';
import { ReportsComponent } from './components/reports/reports.component';
import { VehiclesComponent } from './components/vehicles/vehicles.component';
import { VehicleFormComponent } from './components/vehicles/vehicle-form/vehicle-form.component';

@NgModule({
  declarations: [
    DashboardComponent,
    EmergenciasContainerComponent,
    EmergencyFormBackendComponent,
    PersonalComponent,
    PersonalFormComponent,
    PersonalDetailsComponent,
    CualidadesDialogComponent,
    ReportsComponent,
    VehiclesComponent,
    VehicleFormComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    SharedModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatTabsModule,
    MatListModule,
    MatChipsModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  exports: [
    DashboardComponent,
    EmergenciasContainerComponent,
    EmergencyFormBackendComponent,
    PersonalComponent,
    ReportsComponent,
    VehiclesComponent
  ]
})
export class FeaturesModule { }
