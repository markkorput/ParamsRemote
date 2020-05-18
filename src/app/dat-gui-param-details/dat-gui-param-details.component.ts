import { Component, OnInit, AfterViewInit, Input, NgZone, ViewChild, ElementRef } from '@angular/core';
import { ChartPoint, ChartDataSets, ChartOptions } from 'chart.js';
import { Color, Label } from 'ng2-charts';

import { Param } from '../remote-params.service';

@Component({
  selector: 'app-dat-gui-param-details',
  templateUrl: './dat-gui-param-details.component.html',
  styleUrls: ['./dat-gui-param-details.component.scss']
})
export class DatGuiParamDetailsComponent implements AfterViewInit {
  @Input() param: Param;

  @ViewChild('arrowEl', {static: false}) arrowEl: ElementRef;
  @ViewChild('previewImg', {static: false}) imgEl: ElementRef;
  @ViewChild('menuEl', {static: true}) menuEl: ElementRef;

  showMenu = false;
  showImage = true;
  showGraph = true;

  graphData: ChartDataSets[] = [{ data: [] }];
  graphLabels: Label[] = [];
  graphOptions: (ChartOptions & { annotation?: any }) = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { xAxes: [{display: false, type: 'linear'}] },
  };
  graphColors: Color[] = [{
      borderColor: 'rgb(194,24,91)',
      // backgroundColor: 'rgb(104,0,51)',
  }];

  graphSize = 256;
  graphPrePopulate = false;
  graphContinuously = true;
  graphLastValue: number;
  private graphValueSubscription: any;
  private graphInterval: any = undefined;
  private graphContinuousPlaceholderCount = 0;

  constructor(
    public elementRef: ElementRef,
    // private ngZone: NgZone
  ) { }

  ngAfterViewInit() {
    this.param.valueChange.subscribe((data: string) => this._showImageData(data)); // todo: unsubsribe in destroyFunc

    if (this.showGraph) {
      this.graphStart();
    }
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
    if (this.showGraph) {
      this.graphStart();
    } else {
      this.graphStop();
    }
  }

  isGraphSupported(): boolean {
    return this.param.type === 'i' || this.param.type === 'f' || this.param.type === 'b' || this.param.type === 'g';
  }

  graphStart(): void {
    if (this.graphPrePopulate && this.graphData[0].data.length === 0) {
      this.graphData[0].data = new Array(this.graphSize);

      this.graphLabels = new Array(this.graphSize);
      for(let i = 0; i < this.graphSize; i++) {
        this.graphData[0].data[i] = 0;
        this.graphLabels[i] = '';
      }
    }

    this.graphValueSubscription = this.param.valueChange.subscribe((v: any) => this.graphAddValue(v, false)); //!this.graphContinuously));

    // if (this.graphContinuously) {
    //   this.graphInterval = setInterval(() => this.graphAddValue(this.graphLastValue, true /* now */), 100 /* 10x/s */);
    // }
  }

  graphStop(): void {
    this.graphValueSubscription.unsubscribe();
    if (this.graphInterval) {
      clearInterval(this.graphInterval);
    }
  }

  graphAddValue(value: number, placeholder: boolean): void {
    // if (!now) {
    //   this.graphLastValue = value;
    //   return;
    // }

    // if (placeholder) {
    //   console.log('placeholder: ', value);
    // }
    this.graphLastValue = value;

    const values: ChartPoint[] = this.graphData[0].data as ChartPoint[];

    const labels = this.graphLabels;

    const d = new Date();
    const x = d.getTime();
    const label = ''; // d.toLocaleString('nl', {});
    const data = {x, y: value} as ChartPoint;

    // simply update last timestamp if value still the same
    if (placeholder && values.length > 1 && values[values.length - 1].y === value && values[values.length - 2].y === value) {
      values[values.length - 1] = data;
      labels[values.length - 1] = label;
      return;
    }

    // add value
    values.push(data);
    labels.push(label);

    // remove oldest value if too many values
    if (values.length > this.graphSize) {
      // remove two, so the array doesn't stay the same length,
      // otherwise chartjs might nog pick up any changes (?)
      for(let i = 0; i < 2; i++) {
        values.shift();
        labels.shift();
      }
    }
  }
}
