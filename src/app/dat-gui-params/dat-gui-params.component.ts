import { Component, OnInit, Input, NgZone, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { RemoteParamsService, Client, Params, Param } from '../remote-params.service';
import * as dat from 'dat.gui';

@Component({
  selector: 'app-dat-gui-params',
  templateUrl: './dat-gui-params.component.html',
  styleUrls: ['./dat-gui-params.component.scss']
})
export class DatGuiParamsComponent implements OnInit, AfterViewInit {
  @Input() sessionId: string;

  @ViewChild('guiContainer', {static: false}) guiContainer: ElementRef;
  gui: dat.GUI = undefined;
  guiControllers: dat.Controller[] = [];
  client: Client = undefined;

  constructor(
    private remoteParamsService: RemoteParamsService,
    private ngZone: NgZone
  ) { }

  ngOnInit() {
    this.gui = new dat.GUI({autoPlace: false, hideable: false});
    const gui = this.gui;

    const FizzyText = function() {
      this.message = 'dat.gui';
      this.speed = 0.8;
      this.displayOutline = false;
      this.explode = () => {};
      // Define render logic ...
    };
    const text = new FizzyText();
    this.guiControllers.push(gui.add(text, 'message'));
    this.guiControllers.push(gui.add(text, 'speed', -5, 5));
    this.guiControllers.push(gui.add(text, 'displayOutline'));
    this.guiControllers.push(gui.add(text, 'explode'));

    this.remoteParamsService.getClient(this.sessionId).subscribe((c) => {
      this.client = c;

      this.client.params.schemaChange.subscribe(() => {
        this._initParams(this.client.params);
      });

      this._initParams(this.client.params);
    });
  }

  ngAfterViewInit() {
    // remove close button
    const closeButtonEl = this.gui.domElement.querySelector('.close-button');
    closeButtonEl.parentNode.removeChild(closeButtonEl);
    // append to our wrapper element
    this.guiContainer.nativeElement.appendChild(this.gui.domElement);
    this.gui.domElement.className += ' gui';
  }

  _initParams(params: Params): void {
    // remove existing params
    this.guiControllers.forEach((c) => this.gui.remove(c));
    this.guiControllers = [];

    this.guiControllers = params.params.map((p: Param, idx) => {
      console.log(p);
      let c = null;

      if (p.value === undefined && p.opts[p.OPT_DEFAULT] !== undefined) {
        p.value = p.opts[p.OPT_DEFAULT];
      }

      if (p.opts[p.OPT_MIN] !== undefined && p.opts[p.OPT_MAX] !== undefined) {
        c = this.gui.add(p, 'value', p.opts[p.OPT_MIN], p.opts[p.OPT_MAX]);
      } else {
        c = this.gui.add(p, 'value');
      }

      return c.name(p.path)
        .listen()
        .onFinishChange((value: any) => {
          // p.set(value);
          if (isNaN(value)) {
            p.set(0.0);
            return;
          }
          this.client.output.sendValue(p.path, value);
        });
    });
  }
}
