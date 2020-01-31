import { Component, OnInit, Input, NgZone } from '@angular/core';
import { RemoteParamsService, Param, Params, Client } from '../remote-params.service';
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

  @Input() id: string;
  @Input() liveUpdate = false;

  constructor(
    private remoteParamsService: RemoteParamsService,
    private ngZone: NgZone
  ) { }

  ngOnInit() {
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
  }

  refresh() {
    this.client.output.requestSchema();
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
}
