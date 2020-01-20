import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StringParamComponent } from './string-param.component';

describe('StringParamComponent', () => {
  let component: StringParamComponent;
  let fixture: ComponentFixture<StringParamComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StringParamComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StringParamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
