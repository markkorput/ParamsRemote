import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { StorageServiceModule} from 'angular-webstorage-service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSliderModule } from '@angular/material/slider';
import { MatToolbarModule } from '@angular/material/toolbar';
import {MatIconModule} from '@angular/material/icon';
import {MatListModule} from '@angular/material/list';
import {MatSelectModule} from '@angular/material/select';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatButtonToggleModule} from '@angular/material/button-toggle';

// import { AppComponent } from './app.component';
import { AppHomeComponentComponent } from './app-home-component/app-home-component.component';
import { AppConnectFormComponent } from './app-connect-form/app-connect-form.component';
import { AppSessionComponent } from './app-session/app-session.component';
import { ParamComponent } from './param/param.component';
import { DatGuiParamsComponent } from './dat-gui-params/dat-gui-params.component';
import { DatGuiParamDetailsComponent } from './dat-gui-param-details/dat-gui-param-details.component';

@NgModule({
  declarations: [
    // AppComponent,
    AppHomeComponentComponent,
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
    StorageServiceModule,
    BrowserAnimationsModule,
    MatSliderModule, MatToolbarModule,
    MatIconModule, MatListModule,
    MatGridListModule, MatButtonToggleModule,
    MatSelectModule
  ],
  providers: [],
  // bootstrap: [AppComponent]
  bootstrap: [AppHomeComponentComponent]
})
export class AppModule { }
