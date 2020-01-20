import { Component, OnInit, Input } from '@angular/core';
import { RemoteParamsService, Param, Client } from '../remote-params.service';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-app-session',
  templateUrl: './app-session.component.html',
  styleUrls: ['./app-session.component.scss']
})

export class AppSessionComponent implements OnInit {
  client: Client = undefined;
  
  @Input() id: string;
  @Input() liveUpdate = false;

  paramList = [
      new Param('/test/param', 's', undefined, undefined),
      new Param('/test/param2', 'i', undefined, undefined),
      new Param('/test/param3', 'f', undefined, undefined),
      new Param('/test/param4', 'b', undefined, undefined)];

  constructor(
    private remoteParamsService: RemoteParamsService
  ) { }

  ngOnInit() {
    this.remoteParamsService.getClient(this.id).subscribe((c) => this.client=c);
  }

  disconnect() {
    this.remoteParamsService.disconnect(this.id);
  }

  getParams(): Observable<Param[]> {
    return of(this.paramList);
  }

  setValue(path: string, value: any) {
    // console.log('session.setValue:', path, value);
    if (!this.client) {
      console.warn(`Could not send value '${value}' for param '${path}'`,
        `because we don't haven a client instance for session ID '${this.id}' yet`);
      return;
    }

    this.client.sendValue(path, value)
      .then()
      .catch(err => console.log('Failed to send param value:', err));
  }

  getValue(path: string): Observable<any> {
    return of('no-values-yet');
  }

  onParamInput(path, value) {
    // console.log(`onParamInput: ${path} ${value}`)

    if (this.liveUpdate) {
      this.onParamChange(path, value);
    }
  }

  onParamChange(path, value) {
    // console.log(`onParamChange: ${path} ${value}`)
    if (!this.client) {
      console.warn('No client');
      return;
    }

    this.client.sendValue(path, value)
      .catch(err => console.log('Failed to send remote param value: ', err));
  }
}
