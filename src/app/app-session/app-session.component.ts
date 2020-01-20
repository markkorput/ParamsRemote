import { Component, OnInit, Input, NgZone } from '@angular/core';
import { RemoteParamsService, Param, Params, Client, createSyncParams } from '../remote-params.service';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-app-session',
  templateUrl: './app-session.component.html',
  styleUrls: ['./app-session.component.scss']
})

export class AppSessionComponent implements OnInit {
  client: Client = undefined;
  params: Params = undefined;
  destroySyncParams: () => void = undefined;

  @Input() id: string;
  @Input() liveUpdate = false;

  constructor(
    private remoteParamsService: RemoteParamsService,
    private ngZone: NgZone
  ) { }

  ngOnInit() {
    this.remoteParamsService.getClient(this.id).subscribe((c) => {
      this.client = c;
      window.sess = this;
      this.client.newSchema.subscribe(schemaData => this.onNewSchemaFromServer(schemaData));

      const { params, destroy } = createSyncParams(this.client);
      this.params = params;
      this.destroySyncParams = destroy;

      [new Param('/test/param', 's', undefined, undefined),
      new Param('/test/param2', 'i', undefined, undefined),
      new Param('/test/param3', 'f', undefined, undefined),
      new Param('/test/param4', 'b', false, undefined)].forEach(p => this.params.add(p));

      // this.onNewSchemaFromServer();
    });
  }

  disconnect() {
    this.remoteParamsService.disconnect(this.id);
  }

  getParams(): Observable<Param[]> {
    return of(this.params.params);
  }

  onNewSchemaFromServer(schemaData: []): void {
    // this function is called from an external event, we need to explicitly
    // execute inside the angular zone, otherwise attrtibute changes
    // are not detected
    this.ngZone.runGuarded(() => {
      if (this.destroySyncParams) {
        this.destroySyncParams();
      }

      const { params, destroy } = createSyncParams(this.client, schemaData);
      this.params = params;
      this.destroySyncParams = destroy;
    });
  }

  testNewSchema() {
    const data = [
      {path:'/new/p1', type:'s', value:'_INITIAL VALUE_'},
      {path:'/new/p2', type:'i', value:'1'}
    ];

    this.client.newSchema.emit(data);
  }
}
