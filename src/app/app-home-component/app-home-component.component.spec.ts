import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AppHomeComponentComponent } from './app-home-component.component';

describe('AppHomeComponentComponent', () => {
  let component: AppHomeComponentComponent;
  let fixture: ComponentFixture<AppHomeComponentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AppHomeComponentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppHomeComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
