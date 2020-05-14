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
    // console.log('updating proxy with: ', newv, typeof(newv), newValue, typeof(newValue));
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
  @Input() liveUpdates: false;

  @ViewChild('guiContainer', {static: false}) guiContainer: ElementRef;
  gui: dat.GUI = undefined;
  guiDestructors = {};
  client: Client = undefined;

  constructor(
    private remoteParamsService: RemoteParamsService,
    private ngZone: NgZone
  ) { }

  ngOnInit() {
    this.gui = new dat.GUI({autoPlace: false, hideable: false, width: 'auto'});

    this.remoteParamsService.getClient(this.sessionId).subscribe((c) => {
      this.client = c;

      this.client.params.schemaChange.subscribe(() => {
        this._initParams(this.client.params.params);
      });

      this._initParams(this.client.params.params);
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

  // ngOnChanges(changes: SimpleChanges) {
  // }

  /**
   * Creates dat.GUI controllers for the given group of parameters.
   * @param params (Param[]): list of params for which to create controllers
   */
  _initParams(params: Param[]): void {
    // remove existing params
    Object.keys(this.guiDestructors).forEach((k) => {
      const destroyFunc = this.guiDestructors[k];
      destroyFunc();
    });

    if (params.length === 0) {
      // create single trigerable 'loading...' item
      const forceReload = () => { console.log('Loading...'); this.client.output.requestSchema(); };
      const factory = function() { this.loading = () => forceReload(); };
      const loadingController = this.gui.add(new factory(), 'loading').name('loading...');
      this.guiDestructors[loadingController] = () => { this.gui.remove(loadingController); };
      return;
    }

    // create root folder
    this.guiDestructors = {};
    const rootFolder = this.gui.addFolder('params');
    this.guiDestructors[rootFolder] = () => { this.gui.removeFolder(rootFolder); };
    rootFolder.open();

    // this object will hold all folder
    const folders = {'': rootFolder};

    // the method fetches/creates folder
    const getFolder = (path: string): any => {
      if (folders[path] === undefined) {
        const parts = path.split('/');
        const iterPaths = [];
        parts.forEach(part => {
          const parentPath = iterPaths.join('/');
          iterPaths.push(part);
          const iterPath = iterPaths.join('/');
          if (folders[iterPath] === undefined) {
            const f = folders[parentPath].addFolder(part);
            f.open();
            folders[iterPath] = f;

            this.guiDestructors[f] = () => folders[parentPath].removeFolder(f);
          }
        });
      }

      return folders[path];
    };

    // create controllers for all params
    params.forEach((p: Param) => {
      const parts = p.path.split('/');
      const name = parts.pop();
      const folderPath = parts.join('/');

      const folder = getFolder(folderPath);


      const pair = this._createController(p, folder);
      this.guiDestructors[pair[0]] = pair[1];
    });
  }

  /**
   * Create a dat.GUI controller + cleanup-method for the given param
   * @param p (Param): the param for which to create a controller
   * @param folder (dat.gui.GUI): dat.GUI folder to which the controller should be added
   * @returns (array): A dat.Controller/cleanup-function pair.
   * The cleanup-function should be called when the controller
   * is expired to perform necessary internal cleanup.
   */
  _createController(p: Param, folder: dat.gui.GUI): [dat.Controller, () => void] {
    const proxy = new Proxy(p);

    let c = null;

    if (p.opts[p.OPT_MIN] !== undefined && p.opts[p.OPT_MAX] !== undefined) {
      c = folder.add(proxy, 'value', p.opts[p.OPT_MIN], p.opts[p.OPT_MAX]);
    } else {
      c = folder.add(proxy, 'value');
    }

    const changeCallback = (value: any) => {
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
    };

    c = c.name(p.path.split('/').pop());

    // .listen() // this makes number controllers refuse typed input
    c.onFinishChange(changeCallback);

    c.onChange((v) => {
      if (this.liveUpdates) {
        changeCallback(v);
      }
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
      folder.remove(c);
    };

    // insert options menu 
    const menuel = document.createElement('li');
    menuel.className = 'menu';

    // insert down arrow link next to controler name
    const el = document.createElement('a');
    el.appendChild(document.createElement('span'));
    el.className = 'opts';
    el.href = '#';
    el.onclick = (evt) => {
      if (menuel.className.indexOf(' shown') === -1) {
        menuel.className += ' shown';
      } else {
        menuel.className = menuel.className.replace(' shown', '');
      }

      evt.stopPropagation();
      return false;
    };

    c.domElement.parentNode.parentNode.after(menuel);
    c.domElement.parentNode.querySelector('.property-name').appendChild(el);

    // window.ccc = c;
    // return both the controller and the cleanup function
    return [c, destroyFunc];
  }
}
