import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationComponent } from './components/notification/notification.component';
import { NotificationService } from './services/notification.service';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    NotificationComponent
  ],
  exports: [
    NotificationComponent
  ],
  providers: [
    NotificationService
  ]
})
export class SharedModule { }
