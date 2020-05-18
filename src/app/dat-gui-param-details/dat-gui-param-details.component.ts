import { Component, OnInit, AfterViewInit, Input, NgZone, ViewChild, ElementRef } from '@angular/core';
import { ChartDataSets, ChartOptions } from 'chart.js';
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
    public elementRef: ElementRef,
    // private ngZone: NgZone
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
    console.log('showGr:', this.showGraph);
  }

  isGraphSupported(): boolean {
    return this.param.type === 'i' || this.param.type === 'f' || this.param.type === 'b' || this.param.type === 'g';
  }
}
