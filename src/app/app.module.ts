import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { AppHomeComponentComponent } from './app-home-component/app-home-component.component';

@NgModule({
  declarations: [
    AppComponent,
    AppHomeComponentComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
