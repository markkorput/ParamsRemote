import { Component, OnInit, Input, NgZone, ViewChild, ElementRef } from '@angular/core';
import { RemoteParamsService, Client } from '../remote-params.service';
import * as dat from 'dat.gui';

@Component({
  selector: 'app-dat-gui-params',
  templateUrl: './dat-gui-params.component.html',
  styleUrls: ['./dat-gui-params.component.scss']
})
export class DatGuiParamsComponent implements OnInit {
  @Input() sessionId: string;
  gui: dat.GUI = null;

  @ViewChild('rendererContainer') rendererContainer: ElementRef;

  constructor(
    private remoteParamsService: RemoteParamsService,
    private ngZone: NgZone
  ) { }

  ngOnInit() {
    this.gui = new dat.GUI({autoPlace: false});
    const gui = this.gui;

    const FizzyText = function() {
      this.message = 'dat.gui';
      this.speed = 0.8;
      this.displayOutline = false;
      this.explode = () => {};
      // Define render logic ...
    };
    const text = new FizzyText();
    gui.add(text, 'message');
    gui.add(text, 'speed', -5, 5);
    gui.add(text, 'displayOutline');
    gui.add(text, 'explode');
    this.remoteParamsService.getClient(this.sessionId).subscribe((c) => {
    });
  }
}
