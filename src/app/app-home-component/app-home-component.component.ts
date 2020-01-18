import { Component, OnInit, Input } from '@angular/core';


@Component({
  selector: 'app-app-home-component',
  templateUrl: './app-home-component.component.html',
  styleUrls: ['./app-home-component.component.scss']
})
export class AppHomeComponentComponent implements OnInit {
  @Input() onChange; // param change callback

  constructor() { }

  ngOnInit() {
  }

}
