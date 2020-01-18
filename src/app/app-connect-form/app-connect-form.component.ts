import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { RemoteParamsService } from '../remote-params.service';

@Component({
  selector: 'app-connect-form',
  templateUrl: './app-connect-form.component.html',
  styleUrls: ['./app-connect-form.component.scss']
})
export class AppConnectFormComponent implements OnInit {
  connectForm: FormGroup;
 
  constructor(
    private remoteParamsService: RemoteParamsService,
    private formBuilder: FormBuilder
  ) {
    this.formBuilder = new FormBuilder();

    this.connectForm = this.formBuilder.group({
      host: '',
      port: 8000
    });
  }

  ngOnInit() {
  }

  onSubmit(data) {
    this.remoteParamsService.connect(data.host, data.port);
    // this.connectForm.reset();
  }
}
