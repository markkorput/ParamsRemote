import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DatGuiParamsComponent } from './dat-gui-params.component';

describe('DatGuiParamsComponent', () => {
  let component: DatGuiParamsComponent;
  let fixture: ComponentFixture<DatGuiParamsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DatGuiParamsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DatGuiParamsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
