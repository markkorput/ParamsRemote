import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DatGuiParamDetailsComponent } from './dat-gui-param-details.component';

describe('DatGuiParamDetailsComponent', () => {
  let component: DatGuiParamDetailsComponent;
  let fixture: ComponentFixture<DatGuiParamDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DatGuiParamDetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DatGuiParamDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should create', () => {
    expect(component).toBeTruthy();
  });
});
