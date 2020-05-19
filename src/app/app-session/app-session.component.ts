import { Component, OnInit, Input, NgZone } from '@angular/core';
import { RemoteParamsService, Param, Params, Client } from '../remote-params.service';
import { SettingsService, SessionSettings } from '../settings.service';

@Component({
  selector: 'app-app-session',
  templateUrl: './app-session.component.html',
  styleUrls: ['./app-session.component.scss']
})

export class AppSessionComponent implements OnInit {
  client: Client = undefined;
  showSettings = false;
  settings: SessionSettings = {};
  lines: {param?: Param, path?: string}[] = [];
  updateRestoreValuesTimeout: any = undefined;

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

        if (this.settings.restoreValuesEnabled && this.settings.restoreValues) {
          this.restoreValues();
        }
      });

      this._initNewParams(this.client.params);
    });
  }

  _initNewParams(params: Params): void {
    // this function is called from an external event, we need to explicitly
    // execute inside the angular zone, otherwise attrtibute changes
    // are not detected
    this.ngZone.runGuarded(() => {
      this.lines = this.getLines(params.params);
    });
  }

  disconnect() {
    this.remoteParamsService.disconnect(this.id);
    this.settingsService.setSessionSettings(this.id, null); // remove settings
  }

  isConnected(): boolean {
    return this.client && this.client.isConnected();
  }

  refresh() {
    this.client.output.requestSchema();
  }

  toggleSettings() {
    this.showSettings = !this.showSettings;
  }

  setSettings(settings: SessionSettings): void {
    this.settings = settings;
    this.settingsService.setSessionSettings(this.id, this.settings);
  }

  onSettingsPersistViewChange(val: boolean): void {
    this.setSettings({...this.settings, ...{persistView: val}});
  }

  onSettingsLiveUpdatesChange(val: boolean): void {
    this.setSettings({...this.settings, ...{liveUpdates: val}});
  }

  setSettingsRestoreValuesEnabled(val: boolean): void {
    this.setSettings({...this.settings, ...{restoreValuesEnabled: val}});

    if (val) {
      this.updateRestoreValues();
    }
  }

  setStyle(value: string): void {
    this.setSettings({...this.settings, ...{style: value}});
  }

  collapsePath(path: string) {
    // console.log(`collapsePath for session: ${path}`);
    this.settings = {...this.settings, ...{collapsedPaths: (this.settings.collapsedPaths || []).concat([ path ])}};
    // console.log(`collapsePath for session: ${path}: ${this.settings.collapsedPaths}`);
    this.settingsService.setSessionSettings(this.id, this.settings);
    this._initNewParams(this.client.params);
  }

  expandPath(path: string) {
    // console.log(`expandPath for session: ${path}`);
    this.settings = {...this.settings, ...{collapsedPaths: (this.settings.collapsedPaths || []).filter((p) => p !== path)}};
    // this.settings = {...this.settings, collapsedPaths: []};
    // console.log(`expandPath for session: ${path}: [${this.settings.collapsedPaths.join(',')}]`);
    this.settingsService.setSessionSettings(this.id, this.settings);
    this._initNewParams(this.client.params);
  }

  getHidingPath(paramPath: string): string {
    return (this.settings.collapsedPaths || []).find((p) => paramPath.startsWith(p));
  }

  isVisible(paramPath: string): boolean {
    return this.getHidingPath(paramPath) === undefined;
  }

  getLines(parms): {param?: Param, path?: string}[] {
    const hiders = [];

    return parms.map((param) => {
      const hider = this.getHidingPath(param.path);
      if (hider === undefined) {
        return {param};
      }

      if (hiders.find((h) => h === hider) === undefined) {
        hiders.push(hider);
        return {path: hider};
      }

      return null;
    }).filter((v) => v !== null);
  }

  // restore values
  onParamChange() {
    if (this.settings.restoreValuesEnabled !== true) { return; }

    if (this.updateRestoreValuesTimeout) {
      clearTimeout(this.updateRestoreValuesTimeout);
    }

    this.updateRestoreValuesTimeout = setTimeout(() => {
      this.updateRestoreValuesTimeout = undefined;
      this.updateRestoreValues();
    }, 500);
  }

  updateRestoreValues() {
    if (this.client === undefined) {
      console.log(`updateRestoreValues: no client`);
      return;
    }

    const values = this.client.params.getValues({'skipImages': true});
    this.setSettings({...this.settings, ...{restoreValues: values}});
    console.log(`updateRestoreValues: ${values}`);
  }

  restoreValues() {
    this.client.output.sendValues(this.settings.restoreValues);
  }
}
