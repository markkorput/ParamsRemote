import { Component, OnInit, AfterViewInit, Input, NgZone, ViewChild, ViewChildren, QueryList, ElementRef, ɵɵsetComponentScope } from '@angular/core';
import { Observable } from 'rxjs';
import { ChartDataSets, ChartOptions } from 'chart.js';
import { Color, Label } from 'ng2-charts';

import { RemoteParamsService, Client, Params, Param } from '../remote-params.service';
import * as dat from 'dat.gui';

/**
 * Create a proxy object (with a `value` property and a `destroy` method)
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
  selector: 'app-param-sub',
  template: `
    <li #myLi class="sub shown">
      <a #arrowEl class="opts" href="#" (click)="toggleMenu()"><span></span></a>

      <mat-toolbar #menuEl class="menu" *ngIf="showMenu">
        <mat-icon *ngIf="param.type==='g'"
          class="icon"
          (click)="toggleImage()"
          aria-hidden="false"
          aria-label="Image"
          title="Toggle Image">photo</mat-icon>

        <mat-icon *ngIf="isGraphSupported()"
          class="icon"
          (click)="toggleGraph()"
          aria-hidden="false"
          aria-label="Graph"
          title="Toggle Graph">insert_chart_outlined</mat-icon>
      </mat-toolbar>

      <img #previewImg *ngIf="showImage && param.type==='g'" src="" [alt]="param.path" [title]="param.path+' preview'" />

      <div #graph *ngIf="showGraph" class="graph">
        <canvas baseChart width="400" height="400"
          [datasets]="lineChartData"
          [labels]="lineChartLabels"
          [options]="lineChartOptions"
          [colors]="lineChartColors"
          [legend]="lineChartLegend"
          [chartType]="lineChartType"
          [plugins]="lineChartPlugins">
  </canvas>
      </div>
    </li>
  `
})
export class ParamSubComponent implements AfterViewInit {
  @Input() param: Param;

  @ViewChild('myLi', {static: true}) liEl: ElementRef;
  @ViewChild('arrowEl', {static: false}) arrowEl: ElementRef;
  @ViewChild('previewImg', {static: false}) imgEl: ElementRef;
  @ViewChild('menuEl', {static: true}) menuEl: ElementRef;

  showMenu = false;
  showImage = true;
  showGraph = false;


  public lineChartData: ChartDataSets[] = [
    { data: [65, 59, 80, 81, 56, 55, 40], label: 'Series A' },
  ];
  public lineChartLabels: Label[] = ['January', 'February', 'March', 'April', 'May', 'June', 'July'];
  public lineChartOptions: (ChartOptions & { annotation?: any }) = {
    responsive: true,
  };
  public lineChartColors: Color[] = [
    {
      borderColor: 'black',
      backgroundColor: 'rgba(255,0,0,0.3)',
    },
  ];
  public lineChartLegend = true;
  public lineChartType = 'line';
  public lineChartPlugins = [];



  constructor(
    private ngZone: NgZone
  ) { }

  ngAfterViewInit() {
    this.param.valueChange.subscribe((data: string) => this._showImageData(data)); // todo: unsubsribe in destroyFunc
  }

  _showImageData(data: string): void {
    if (this.imgEl && this.showImage) {
      this.imgEl.nativeElement.src = `data:image/jpeg;base64,${data.trim()}`;
    }
  }

  toggleMenu() {
    this.showMenu = !this.showMenu;
  }

  toggleImage() {
    this.showImage = !this.showImage;
    if (this.showImage) {
      this._showImageData(this.param.getValue());
    }
  }

  toggleGraph() {
    this.showGraph = !this.showGraph;
  }

  isGraphSupported(): boolean {
    return this.param.type === 'i' || this.param.type === 'f' || this.param.type === 'b' || this.param.type === 'g';
  }
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
  @ViewChildren(ParamSubComponent) subs: QueryList<ParamSubComponent>;

  params: Observable<Param[]>;
  gui: dat.GUI = undefined;
  guiControllers: {string?: dat.Controller[]};
  guiDestructors = {};
  client: Client = undefined;

  constructor(
    private remoteParamsService: RemoteParamsService
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

    this.params.subscribe(params => this._initParams(params));
  }

  ngAfterViewInit() {
    // remove close button
    const closeButtonEl = this.gui.domElement.querySelector('.close-button');
    closeButtonEl.parentNode.removeChild(closeButtonEl);
    // append to our wrapper element
    this.guiContainer.nativeElement.appendChild(this.gui.domElement);
    this.gui.domElement.className += ' gui';
    this.subs.changes.subscribe(ob => this._repositionSubs(this.subs));
  }

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

    // method that will cleanup everything we just created
    const destroyFunc = (): void => {
      subscription.unsubscribe();
      proxy.destroy();
      folder.remove(c);
    };

    // return both the controller and the cleanup function
    return [c, destroyFunc];
  }

  /**
   * Move view-elements of `subcomps` into the dat.GUI controllers container
   * @param subcomps (QueryList<ParamSubComponent>): querylist of rendered components
   *  whose view-elements will be displaced.
   */
  _repositionSubs(subcomps: QueryList<ParamSubComponent>): void {
    // the imgcomps are dynamically rendered _below_ the dat.GUI container,
    // we'll move each of these into the dat.GUI container, right below,
    // the <li> of the corresponding param controller (if found)
    subcomps.forEach((comp) => {
      // find the controller that corresponds to this component's param
      const ctrl = this.guiControllers[comp.param.path];

      if (!ctrl) {
        return;
      }

      // move the <li> element to right after the controller's <li>
      ctrl.domElement.parentNode.parentNode.after(comp.liEl.nativeElement);

      // move the <a> arrow element into the controller's propert name container
      ctrl.domElement.parentNode.querySelector('.property-name').appendChild(comp.arrowEl.nativeElement);
    });
  }
}
