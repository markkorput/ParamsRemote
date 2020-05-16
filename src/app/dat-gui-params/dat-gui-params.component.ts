import { Component, OnInit, AfterViewInit, Input, NgZone, ViewChild, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { Observable } from 'rxjs';
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

  this.apply = (val) => {
    if (isVoid) {
      return;
    }

    if (p.type === 'g') { // image
      this.value = `${(val || '').length} bytes`;
      return;
    }

    this.value = val;
  };

  if (isVoid) { // image
    this.value = () => {};
  } else {
    this.apply(p.getValue());
  }

  // console.log('this value:', this.value, typeof(this.value));
  const subscription = isVoid ? null : p.valueChange.subscribe((newValue: any) => this.apply(newValue));

  this.destroy = () => {
    if (subscription) {
      subscription.unsubscribe();
    }
  };
}

@Component({
  selector: 'app-param-img',
  template: `
    <li #myLi class="image shown _io_"><img [src]="src" [alt]="path" [title]="path+' preview'" /></li>
  `
})
export class ParamImgComponent {
  @Input() path: string;
  @Input() src: string;

  @ViewChild('myLi', {static: true}) liEl: ElementRef;
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
  @ViewChildren(ParamImgComponent) imgContainers: QueryList<ParamImgComponent>;

  params: Observable<Param[]>;
  imageParams: Observable<Param[]>;
  gui: dat.GUI = undefined;
  guiControllers: {string?: dat.Controller[]};
  guiDestructors = {};
  client: Client = undefined;

  constructor(
    private remoteParamsService: RemoteParamsService,
    private ngZone: NgZone
  ) { }

  ngOnInit() {
    this.gui = new dat.GUI({autoPlace: false, hideable: false, width: 'auto'});

    this.params = new Observable<Param[]>(observer => {
      this.remoteParamsService.getClient(this.sessionId).subscribe((c) => {
        this.client = c;
        observer.next(this.client.params.params);
        // whenever the params schema changes, update our params observable
        this.client.params.schemaChange.subscribe(() =>
          observer.next(this.client.params.params));
      });
    });

    this.imageParams = new Observable<Param[]>(observer =>
      this.params.subscribe(params => {
        // update imageParams
        observer.next(params.filter(p => p.type === 'g'));
        // update controllers
        this._initParams(params);
      }));
  }

  ngAfterViewInit() {
    // remove close button
    const closeButtonEl = this.gui.domElement.querySelector('.close-button');
    closeButtonEl.parentNode.removeChild(closeButtonEl);
    // append to our wrapper element
    this.guiContainer.nativeElement.appendChild(this.gui.domElement);
    this.gui.domElement.className += ' gui';

    this.imgContainers.changes.subscribe(ob => this._repositionImages(this.imgContainers));
  }

  // ngOnChanges(changes: SimpleChanges) {
  // }

  /**
   * Creates dat.GUI controllers for the given group of parameters.
   * @param params (Param[]): list of params for which to create controllers
   */
  _initParams(params: Param[]): void {
    // if (this.guiDestructors === undefined) return; // another _initParams is currently running

    // remove existing params
    console.log('Removing existing params');
    Object.keys(this.guiDestructors).forEach((k) => {
      const destroyFunc = this.guiDestructors[k];
      destroyFunc();
    });

    // this.guiDestructors = undefined;

    if (params.length === 0) {
      // create single trigerable 'loading...' item
      const forceReload = () => { console.log('Loading...'); this.client.output.requestSchema(); };
      const factory = function() { this.loading = () => forceReload(); };
      const loadingController = this.gui.add(new factory(), 'loading').name('loading...');
      this.guiDestructors[loadingController] = () => { this.gui.remove(loadingController); };
      return;
    }

    // create gui root folder
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
    this.guiControllers = {};
    params.forEach((p: Param) => {
      const parts = p.path.split('/');
      const name = parts.pop();
      const folderPath = parts.join('/');
      const folder = getFolder(folderPath);

      const pair = this._createController(p, folder);
      this.guiControllers[p.path] = pair[0];
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
      } else if (p.type === 'i') {
        if (isNaN(value)) {
          proxy.value = 0;
          return;
        }

        this.client.output.sendValue(p.path, Math.floor(value));
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

    // insert options menu
    const menuel = document.createElement('li');
    menuel.className = 'menu';
    c.domElement.parentNode.parentNode.after(menuel);

    let imageLi;
    let imageSub;
    if (p.type === 'g') {
      imageLi = document.createElement('li');
      imageLi.className = 'image shown';
      menuel.after(imageLi);

      const imgel = document.createElement('img');
      imageLi.appendChild(imgel);

      const applyImage = (data) => {
        // console.log('TODO: apply image');
        imgel.src = `data:image/jpeg;base64,${data.trim()}`;
      };

      imageSub = p.valueChange.subscribe(applyImage); // todo: unsubsribe in destroyFunc
    }

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

    c.domElement.parentNode.querySelector('.property-name').appendChild(el);

    // method that will cleanup everything we just created
    const destroyFunc = (): void => {
      subscription.unsubscribe();
      proxy.destroy();
      folder.remove(c);

      menuel.remove();
      el.remove();

      if (imageSub) {
        imageSub.unsubscribe();
      }

      if (imageLi) {
        imageLi.remove();
      }
    };

    // return both the controller and the cleanup function
    return [c, destroyFunc];
  }

  _repositionImages(imgcomps: QueryList<ParamImgComponent>): void {
    // the imgels are dynamically rendered _below_ the dat.GUI container,
    // we'll move each of these into the dat.GUI container, right below,
    // the <li> of the corresponding param controller (if found)
    imgcomps.forEach((imgcomp) => {
      const ctrl = this.guiControllers[imgcomp.path];
      //console.log('relocating: ', imgcomp.liEl);
      if (ctrl) {
        ctrl.domElement.parentNode.parentNode.after(imgcomp.liEl.nativeElement);
      }
    });
  }


}
