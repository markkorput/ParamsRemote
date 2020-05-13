import { Component, OnInit, Input, NgZone, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { RemoteParamsService, Client, Params, Param } from '../remote-params.service';
import * as dat from 'dat.gui';

function Proxy(p: Param): void {
  // for 'void' (trigger) params, the value must stay an (empty)
  // function, so dat.gui understand it's trigger-type param
  const isVoid = (p.type === 'v');
  this.value = isVoid ? () => {} : p.getValue();

  const subscription = isVoid ? null : p.valueChange.subscribe((newValue: any) => {
    // apply new (incoming) values from the Param to `this` proxy
    this.value = newValue;
  });

  this.destroy = () => {
    if (subscription) {
      subscription.unsubscribe();
    }
  };
}

@Component({
  selector: 'app-dat-gui-params',
  templateUrl: './dat-gui-params.component.html',
  styleUrls: ['./dat-gui-params.component.scss']
})
export class DatGuiParamsComponent implements OnInit, AfterViewInit {
  @Input() sessionId: string;

  @ViewChild('guiContainer', {static: false}) guiContainer: ElementRef;
  gui: dat.GUI = undefined;
  guiControllers = {};
  client: Client = undefined;

  constructor(
    private remoteParamsService: RemoteParamsService,
    private ngZone: NgZone
  ) { }

  ngOnInit() {
    this.gui = new dat.GUI({autoPlace: false, hideable: false, width: 'auto'});
    const gui = this.gui;

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
    Object.keys(this.guiControllers).forEach((k) => {
      this.guiControllers[k].destroy();
      this.gui.remove(k);
    });

    this.guiControllers = {};
    params.params.forEach((p: Param) => {
      const pair = this._createController(p);
      this.guiControllers[pair[0]] = pair[1];
    });
  }

  _createController(p: Param): [dat.Controller, any] {
    const proxy = new Proxy(p);

    // dat.GUI doesn't react well to undefined values
    // make sure the param value
    if (p.value === undefined) {
      p.value = p.getValue();
    }

    let c = null;

    if (p.opts[p.OPT_MIN] !== undefined && p.opts[p.OPT_MAX] !== undefined) {
      c = this.gui.add(proxy, 'value', p.opts[p.OPT_MIN], p.opts[p.OPT_MAX]);
    } else {
      c = this.gui.add(proxy, 'value');
    }

    c.name(p.path)
      .listen()
      .onFinishChange((value: any) => {
        console.log('onFinishChange: ', value);

        if (p.type === 'v') {
          this.client.output.sendValue(p.path, p.value || 0);
          return;
        } else if (isNaN(value) && p.type === 'i') {
          proxy.value = 0;
          return;
        } else if (isNaN(value) && p.type === 'f') {
          proxy.value = 0.0;
          return;
        }

        this.client.output.sendValue(p.path, value);
      });

    return [c, proxy];
  }
}
