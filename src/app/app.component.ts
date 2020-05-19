import { Component, OnInit, Input } from '@angular/core';
import { RemoteParamsService } from './remote-params.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  showConnectForm = true;

  constructor(
    public remoteParamsService: RemoteParamsService
  ) { }

  ngOnInit() {
    this.showConnectForm = this.remoteParamsService.clients.length === 0;

    // Re-enable this to scan default ports for websocket server
    // TODO make this configurable
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
