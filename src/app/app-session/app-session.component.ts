import { Component, OnInit, Input, NgZone } from '@angular/core';
import { RemoteParamsService, Param, Params, Client } from '../remote-params.service';
import { SettingsService } from '../settings.service';
import { Observable, of } from 'rxjs';
// import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-app-session',
  templateUrl: './app-session.component.html',
  styleUrls: ['./app-session.component.scss']
})

export class AppSessionComponent implements OnInit {
  client: Client = undefined;
  params: Param[] = [];
  showSettings = false;
  settings: {persistView?: boolean} = {};

  @Input() id: string;
  @Input() liveUpdate = false;

  constructor(
    private remoteParamsService: RemoteParamsService,
    private settingsService: SettingsService,
    private ngZone: NgZone
  ) { }

  ngOnInit() {
    this.settings = this.settingsService.getSessionSettings(this.id) || {};

    this.remoteParamsService.getClient(this.id).subscribe((c) => {
      this.client = c;
      this.client.params.schemaChange.subscribe(() => {
        this._initNewParams(this.client.params);
      });

      this._initNewParams(this.client.params);
    });
  }

  disconnect() {
    this.remoteParamsService.disconnect(this.id);
    this.settingsService.setSessionSettings(this.id, null); // remove settings
  }

  refresh() {
    this.client.output.requestSchema();
  }

  toggleSettings() {
    this.showSettings = !this.showSettings;
  }

  getParams(): Observable<Param[]> {
    return of(this.params);
  }

  noParams(): boolean {
    return this.params.length === 0;
  }

  _initNewParams(params: Params): void {
    // this function is called from an external event, we need to explicitly
    // execute inside the angular zone, otherwise attrtibute changes
    // are not detected
    this.ngZone.runGuarded(() => {
      this.params = params.params;
    });
  }

  onSettingsPersistViewChange(val: boolean): void {
    this.settings.persistView = val;
    this.settingsService.setSessionSettings(this.id, this.settings);
  }
}
