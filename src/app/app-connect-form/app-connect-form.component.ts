import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { RemoteParamsService } from '../remote-params.service';

@Component({
  selector: 'app-connect-form',
  templateUrl: './app-connect-form.component.html',
  styleUrls: ['./app-connect-form.component.scss']
})
export class AppConnectFormComponent implements OnInit {
  oscConnectForm: FormGroup;
  websocketsConnectForm: FormGroup;

  constructor(
    private remoteParamsService: RemoteParamsService,
    private formBuilder: FormBuilder
  ) {
    this.formBuilder = new FormBuilder();

    this.oscConnectForm = this.formBuilder.group({
      host: '',
      port: 8000
    });

    this.websocketsConnectForm = this.formBuilder.group({
      host: '127.0.0.1',
      port: 8081
    });

  }

  ngOnInit() {
  }

  onSubmitOscForm(data) {
    this.remoteParamsService.connectOsc(data.host, data.port);
    // this.connectForm.reset();
  }

  onSubmitWebsocketsForm(data) {
    this.remoteParamsService.connectWebsockets(data.host, data.port);
  }
}
