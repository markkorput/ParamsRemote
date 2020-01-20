import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { StorageServiceModule} from 'angular-webstorage-service';

// import { AppComponent } from './app.component';
import { AppHomeComponentComponent } from './app-home-component/app-home-component.component';
import { AppConnectFormComponent } from './app-connect-form/app-connect-form.component';
import { AppSessionComponent } from './app-session/app-session.component';
import { StringParamComponent } from './string-param/string-param.component';

@NgModule({
  declarations: [
    // AppComponent,
    AppHomeComponentComponent,
    AppConnectFormComponent,
    AppSessionComponent,
    StringParamComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    StorageServiceModule
  ],
  providers: [],
  // bootstrap: [AppComponent]
  bootstrap: [AppHomeComponentComponent]
})
export class AppModule { }
