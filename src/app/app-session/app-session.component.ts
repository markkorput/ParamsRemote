import { Component, OnInit, Input } from '@angular/core';
import { RemoteParamsService } from '../remote-params.service';

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
}
