import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjlistComponent } from './projlist.component';

describe('ProjlistComponent', () => {
  let component: ProjlistComponent;
  let fixture: ComponentFixture<ProjlistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProjlistComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjlistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
