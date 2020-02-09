import { Component, OnInit, Input, NgZone } from '@angular/core';
import { RemoteParamsService, Param, Client } from '../remote-params.service';

@Component({
  selector: 'app-param',
  templateUrl: './param.component.html',
  styleUrls: ['./param.component.scss']
})
export class ParamComponent implements OnInit {
  @Input() client: Client;
  @Input() param: Param;
  @Input() liveUpdate = false;

  path: string;
  type: string;
  value: string;

  editValue: any = undefined;

  constructor(
    private remoteParamsService: RemoteParamsService,
    private ngZone: NgZone
  ) { }

  ngOnInit() {
    this.path = this.param.path;
    this.value = this.param.value;
    this.type = this.param.type;
    this.editValue = this.param.value;

    // register callback for when receiving new values from server
    // (which are applied  to our param)
    this.param.valueChange.subscribe(value => {
      this.onNewValueFromServer(value);
    });
  }

  /**
   * onUserInput is called whenever user starts editing the value
   * It will call onUserChange IF live-updates are enabled (using this.liveUpdate)
   */
  onUserInput(path: string, value: any) {
    // console.log(`onParamInput: ${path} ${value}`)

    if (this.liveUpdate) {
      this.onUserChange(path, value);
    }
  }

  /**
   * onUserChange is called whenever user submits a the value
   */
  onUserChange(path: string, value) {
    // console.log(`onParamChange: ${path} ${value}`)
    if (!this.client) {
      console.warn('No client');
      return;
    }
    this.onNewValueFromServer()

    this.client.output.sendValue(path, value);
  }

  /**
   * onNewValueFromServer is called whenever a new value is received
   * an takes care of updating the UI to show the new value.
   */
  onNewValueFromServer(value: any) {
    // this function is called from an external event, we need to explicitly
    // execute inside the angular zone, otherwise attrtibute changes
    // are not detected
    this.ngZone.runGuarded(() => {
      // console.log(`onNewValueFromServer (path=${this.path}):`, value);
      this.editValue = value;
    });
  }
}
