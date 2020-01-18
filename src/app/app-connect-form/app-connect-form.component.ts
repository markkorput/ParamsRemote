import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { RemoteParamsService } from '../remote-params.service';

@Component({
  selector: 'app-app-connect-form',
  templateUrl: './app-connect-form.component.html',
  styleUrls: ['./app-connect-form.component.scss']
})
export class AppConnectFormComponent implements OnInit {

  connectForm;
 
  constructor(
    private formBuilder: FormBuilder,
    private remoteParamsService: RemoteParamsService
  ) {
    this.connectForm = this.formBuilder.group({
      host: '',
      port: 8000
    });
  }

  ngOnInit() {
  }

  onSubmit(customerData) {
    // Process checkout data here
    console.warn('TODO submit data to ', this.remoteParamsService, customerData);

    // this.items = this.cartService.clearCart();
    this.connectForm.reset();
  }
}
