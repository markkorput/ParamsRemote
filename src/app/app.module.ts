import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

// import { AppComponent } from './app.component';
import { AppHomeComponentComponent } from './app-home-component/app-home-component.component';
import { AppConnectFormComponent } from './app-connect-form/app-connect-form.component';

@NgModule({
  declarations: [
    // AppComponent,
    AppHomeComponentComponent,
    AppConnectFormComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  // bootstrap: [AppComponent]
  bootstrap: [AppHomeComponentComponent]
})
export class AppModule { }
