import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSliderModule } from '@angular/material/slider';
import { MatToolbarModule } from '@angular/material/toolbar';
import {MatIconModule} from '@angular/material/icon';
import {MatListModule} from '@angular/material/list';
import {MatSelectModule} from '@angular/material/select';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import { SESSION_STORAGE } from 'ngx-webstorage-service';

import { AppComponent } from './app.component';
import { SettingsServiceInjectionToken, SettingsService } from './settings.service';
import { AppConnectFormComponent } from './app-connect-form/app-connect-form.component';
import { AppSessionComponent } from './app-session/app-session.component';
import { ParamComponent } from './param/param.component';
import { DatGuiParamsComponent } from './dat-gui-params/dat-gui-params.component';
import { DatGuiParamDetailsComponent } from './dat-gui-param-details/dat-gui-param-details.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';

@NgModule({
  declarations: [
    AppComponent,
    AppConnectFormComponent,
    AppSessionComponent,
    ParamComponent,
    DatGuiParamsComponent,
    DatGuiParamDetailsComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    MatSliderModule, MatToolbarModule,
    MatIconModule, MatListModule,
    MatGridListModule, MatButtonToggleModule,
    MatSelectModule,
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production })
  ],
  providers: [
    { provide: SettingsServiceInjectionToken, useExisting: SESSION_STORAGE },
    SettingsService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
