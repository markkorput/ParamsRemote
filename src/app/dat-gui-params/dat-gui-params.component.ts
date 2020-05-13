import { Component, OnInit, Input, NgZone, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { RemoteParamsService, Client, Params, Param } from '../remote-params.service';
import * as dat from 'dat.gui';

/**
 * Create a prpxy object (with a `value` property and a `destroy` method)
 * for the given param that can be used as subject for a dat.GUI Controller.
 * @param p (Param): the param for which to create a proxy object.
 * @returns (Object): the proxy object that will auto-update its `value`
 * property when `p` emits the valueChange event. The proxy's `destroy` function
 * will cleanup the valueChange event subscriber.
 */
function Proxy(p: Param): void {
  // for 'void' (trigger) params, the value must stay an (empty)
  // function, so dat.gui understand it's trigger-type param
  const isVoid = (p.type === 'v');
  this.value = isVoid ? () => {} : p.getValue();
  console.log('this value:', this.value, typeof(this.value));
  const subscription = isVoid ? null : p.valueChange.subscribe((newValue: any) => {
    // apply new (incoming) values from the Param to `this` proxy
    const newv = p.getValue();
    console.log('updating proxy with: ', newv, typeof(newv), newValue, typeof(newValue));
    this.value = p.getValue(); //newValue;
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

  /**
   * Creates dat.GUI controllers for the given group of parameters.
   * @param params (Params): params groups for which to create controllers
   */
  _initParams(params: Params): void {
    // remove existing params
    Object.keys(this.guiControllers).forEach((k) => {
      const destroyFunc = this.guiControllers[k];
      destroyFunc();
      this.gui.remove(k);
    });

    this.guiControllers = {};
    params.params.forEach((p: Param) => {
      const pair = this._createController(p);
      this.guiControllers[pair[0]] = pair[1];
    });
  }

  /**
   * Create a dat.GUI controller + cleanup-method for the given param
   * @param p (Param): the param for which to create a controller
   * @returns (array): A dat.Controller/cleanup-function pair.
   * The cleanup-function should be called when the controller
   * is expired to perform necessary internal cleanup.
   */
  _createController(p: Param): [dat.Controller, () => void] {
    const proxy = new Proxy(p);

    let c = null;

    if (p.opts[p.OPT_MIN] !== undefined && p.opts[p.OPT_MAX] !== undefined) {
      c = this.gui.add(proxy, 'value', p.opts[p.OPT_MIN], p.opts[p.OPT_MAX]);
    } else {
      c = this.gui.add(proxy, 'value');
    }

    c.name(p.path)
      // .listen() // this makes number controllers refuse typed input
      // we use manual updateDisplay (see below) instead.
      .onFinishChange((value: any) => {
        // console.log('onFinishChange: ', value);

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

    // whenever the param is updated, force a
    // (visual) update of the dat.GUI controller
    const subscription = p.valueChange.subscribe(() => {
      c.updateDisplay();
    });

    // method that will cleanup everything we just created
    const destroyFunc = (): void => {
      subscription.unsubscribe();
      proxy.destroy();
    };

    // return both the controller and the cleanup function
    return [c, destroyFunc];
  }
}
