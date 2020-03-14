import { Component, OnInit, Input, Output, NgZone, EventEmitter } from '@angular/core';
import { RemoteParamsService, Client } from '../remote-params.service';

@Component({
  selector: 'app-param',
  templateUrl: './param.component.html',
  styleUrls: ['./param.component.scss']
})
export class ParamComponent implements OnInit {
  // @Input() client: Client;
  @Input() sessionId: string;
  @Input() paramId: string;
  // @Input() param: Param;
  @Input() liveUpdate = false;
  @Output() collapsePath = new EventEmitter<string>();

  client: Client;
  path: string;
  type: string;
  value: string;
  opts: {};

  clickActivated = false;
  hoverActivated = false;
  editValue: any = undefined;

  constructor(
    private remoteParamsService: RemoteParamsService,
    private ngZone: NgZone
  ) { }

  ngOnInit() {

    this.remoteParamsService.getClient(this.sessionId).subscribe((c) => {
      this.client = c;
      // this.client.params.schemaChange.subscribe(() => {
      //   this._initNewParams(this.client.params);
      // });

      // this._initNewParams(this.client.params);
      const param = this.client.params.get(this.paramId);

      if (param) {
        this.path = param.path;
        this.value = param.value;
        this.type = param.type;
        this.editValue = param.value;
        this.opts = param.opts;

        // register callback for when receiving new values from server
        // (which are applied  to our param)
        param.valueChange.subscribe(value => {
          this.onNewValueFromServer(value);
        });
      } else {
        console.error('No param given to ParamComponent!');
        this.path = 'NO_PARAM';
        this.value = null;
        this.type = 'v';
        this.editValue = this.value;
        this.opts = {};
      }
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
  onUserChange(path: string, value: any) {
    // eager-update our local state
    this.editValue = value;

    // console.log(`onParamChange: ${path} ${value}`)
    if (!this.client) {
      console.warn('No client');
      return;
    }

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

  onMouseEnterValue() {
    this.hoverActivated = true;
  }

  onMouseLeaveValue() {
    this.hoverActivated = false;
  }

  onClick() {
    this.clickActivated = (this.clickActivated === false);
  }

  pathParts(): {name: string, action: () => void}[] {
    const p = this.path.startsWith('/') ? this.path.slice(1) : this.path;
    const pieces = p.split('/');
    const parts = pieces.map((piece, idx) => ({name: piece, action: () => this.togglePathPart(idx)}));
    return parts;
  }

  togglePathPart(partIdx: number) {
    // console.log(`togglePathPart: ${partIdx}`);
    const startSlash = this.path.startsWith('/');
    const p = startSlash ? this.path.slice(1) : this.path;
    const pieces = p.split('/');
    const path = (startSlash ? '/' : '') + pieces.slice(0, partIdx + 1).join('/');
    // console.log(`emitting collapsePath event: ${path}`);
    this.collapsePath.emit(path);
  }
}
