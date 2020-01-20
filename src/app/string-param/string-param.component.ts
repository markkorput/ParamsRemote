import { Component, OnInit, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-string-param',
  templateUrl: './string-param.component.html',
  styleUrls: ['./string-param.component.scss']
})

export class StringParamComponent implements OnInit {
  @Input() path: string;
  @Input() value: string;
  @Input() liveUpdate = false;
  @Output() valueChange = new EventEmitter<string>();

  constructor() {
   }

  ngOnInit() {
  }

  onInput(value) {
    if (this.liveUpdate) {
      this.onChange(value);
    }
  }

  onChange(val) {
    this.value = val;
    this.valueChange.emit(this.value);
  }
}
