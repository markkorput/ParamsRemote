import { Component, OnInit, Input } from '@angular/core';
import { RemoteParamsService } from '../remote-params.service';

@Component({
  selector: 'app-app-home-component',
  templateUrl: './app-home-component.component.html',
  styleUrls: ['./app-home-component.component.scss']
})
export class AppHomeComponentComponent implements OnInit {
  sessionIds: string[];

  constructor(
    private remoteParamsService: RemoteParamsService
  ) { }

  ngOnInit() {
  //   // this.remoteParamsService.onConnect.subscribe((c) => this.updateSessionIds());
  //   // this.remoteParamsService.onDisconnect.subscribe((c) => this.updateSessionIds());
  //   // this.updateSessionIds();
  //   // this.getSessionIds();
  }

  // updateSessionIds() {
  //   // this.sessionIds = Object.keys(this.remoteParamsService.clients);
  // }
}
