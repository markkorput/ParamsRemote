import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// import { AppComponent } from './app.component';
import { AppHomeComponentComponent } from './app-home-component/app-home-component.component';
import { AppConnectFormComponent } from './app-connect-form/app-connect-form.component';
import { AppSessionComponent } from './app-session/app-session.component';

@NgModule({
  declarations: [
    // AppComponent,
    AppHomeComponentComponent,
    AppConnectFormComponent,
    AppSessionComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [],
  // bootstrap: [AppComponent]
  bootstrap: [AppHomeComponentComponent]
})
export class AppModule { }
