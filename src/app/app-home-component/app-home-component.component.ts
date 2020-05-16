import { Component, OnInit, Input } from '@angular/core';
import { RemoteParamsService } from '../remote-params.service';

@Component({
  selector: 'app-app-home-component',
  templateUrl: './app-home-component.component.html',
  styleUrls: ['./app-home-component.component.scss']
})
export class AppHomeComponentComponent implements OnInit {
  showConnectForm = true;

  constructor(
    private remoteParamsService: RemoteParamsService
  ) { }

  ngOnInit() {
    this.showConnectForm = this.remoteParamsService.clients.length === 0;
    // this.remoteParamsService.findWebsockets((host: string, port: number) => {
    //   console.log('Found websocket server on: ', host, port);
    //   // found sockets are automatically recorded into:
    //   // remoteParamsService.websocketFinder.foundServers
    // }, {'onlyOnce': true});
  }

  toggleShowConnectForm() {
    this.showConnectForm = !this.showConnectForm;
  }

  onConnectAttempt() {
    console.log('onConnectAttempt');
    this.showConnectForm = false;
  }
}
