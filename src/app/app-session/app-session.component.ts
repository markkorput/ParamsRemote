import { Component, OnInit, Input, NgZone } from '@angular/core';
import { RemoteParamsService, Param, Params, Client } from '../remote-params.service';
import { SettingsService } from '../settings.service';
import { Observable, of } from 'rxjs';
import { map, distinct } from 'rxjs/operators';

@Component({
  selector: 'app-app-session',
  templateUrl: './app-session.component.html',
  styleUrls: ['./app-session.component.scss']
})

export class AppSessionComponent implements OnInit {
  client: Client = undefined;
  showSettings = false;
  settings: {persistView?: boolean, collapsedPaths?: string[]} = {};
  params: Param[] = [];
  lines: {param?: Param, path?: string}[] = [];

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

  _initNewParams(params: Params): void {
    // this function is called from an external event, we need to explicitly
    // execute inside the angular zone, otherwise attrtibute changes
    // are not detected
    this.ngZone.runGuarded(() => {
      this.params = params.params;
      // const ofparams = of(this.params);
      // this.ofLines = this.getLines(this.ofparams);
      this.lines = this.getLines(this.params);
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

  onSettingsPersistViewChange(val: boolean): void {
    this.settings = {...this.settings, ...{persistView: val}};
    this.settingsService.setSessionSettings(this.id, this.settings);
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
}