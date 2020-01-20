import { Component, OnInit, Input } from '@angular/core';
import { RemoteParamsService } from '../remote-params.service';
import { Observable, of } from 'rxjs';

class Param {
  path: string;
  type: string;
  value: any;
  opts: object;

  constructor(path: string, type: string, value: any, opts: object) {
    this.path = path;
    this.type = type;
    this.value = value;
    this.opts = opts || {};
  }
}

@Component({
  selector: 'app-app-session',
  templateUrl: './app-session.component.html',
  styleUrls: ['./app-session.component.scss']
})
export class AppSessionComponent implements OnInit {
  @Input() id: string;

  constructor(
    private remoteParamsService: RemoteParamsService
  ) { }

  ngOnInit() {
  }

  disconnect() {
    this.remoteParamsService.disconnect(this.id);
  }

  getParams(): Observable<Param[]> {
    return of([
      new Param('/test/param', 's', undefined, undefined),
      new Param('/test/param2', 'i', undefined, undefined),
      new Param('/test/param3', 'f', undefined, undefined),
      new Param('/test/param4', 'b', undefined, undefined)]);
  }
}
