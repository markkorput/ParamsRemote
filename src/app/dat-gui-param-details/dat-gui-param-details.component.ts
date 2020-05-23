import { Component, AfterViewInit, Input, ViewChild, ElementRef, EventEmitter } from '@angular/core';
import { Subscription } from 'rxjs';
import { TimeSeries, SmoothieChart } from 'smoothie';

import { Param } from '../remote-params.service';


@Component({
  selector: 'app-dat-gui-param-details',
  templateUrl: './dat-gui-param-details.component.html',
  styleUrls: ['./dat-gui-param-details.component.scss']
})
export class DatGuiParamDetailsComponent implements AfterViewInit {
  @Input() param: Param;
  @Input() interval = 100;
  
  @ViewChild('arrowEl') arrowEl: ElementRef;
  @ViewChild('previewImg') imgEl: ElementRef;
  @ViewChild('graphCanvas') graphCanvasEl: ElementRef;

  showMenu = false;
  showImage = true;
  showGraph = false;

  private graphInterval: any = undefined;
  private graphSeries: TimeSeries;
  private chart: SmoothieChart;

  constructor(
    public elementRef: ElementRef,
    // private ngZone: NgZone
  ) { }

  ngAfterViewInit() {
    this.param.valueChange.subscribe((data: string) => this._showImageData(data)); // todo: unsubsribe in destroyFunc

    if (this.hasGraph()) {
      this.graphSeries = new TimeSeries();

      this.chart = new SmoothieChart({responsive: true});
      this.chart.addTimeSeries(this.graphSeries, { strokeStyle: 'rgba(194, 24, 91)', lineWidth: 2 });
      this.chart.streamTo(this.graphCanvasEl.nativeElement, 500);

      if (this.showGraph) {
        this.graphStart();
      }
    }
  }

  _showImageData(data: string): void {
    if (this.imgEl && this.showImage) {
      this.imgEl.nativeElement.src = `data:image/jpeg;base64,${data.trim()}`;
    }
  }

  toggleMenu() {
    this.showMenu = !this.showMenu;
    return false;
  }

  toggleImage() {
    this.showImage = !this.showImage;
    if (this.showImage) {
      this._showImageData(this.param.getValue());
    }
  }

  hasGraph(): boolean {
    return this.param.type === 'i' || this.param.type === 'f' || this.param.type === 'b' || this.param.type === 'g';
  }

  toggleGraph() {
    this.showGraph = !this.showGraph;
    if (this.showGraph) {
      this.graphStart();
    } else {
      this.graphStop();
    }
  }

  graphStart(): void {
    this.graphStop();

    this.graphInterval = setInterval(() => {
      this.graphSeries.append(Date.now(), this.param.getValue());
    }, this.interval);
  }

  graphStop(): void {
    if (this.graphInterval) {
      clearInterval(this.graphInterval);
      this.graphInterval = null;
    }
  }
}
