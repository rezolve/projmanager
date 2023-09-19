import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeliverlistComponent } from './deliverlist.component';

describe('DeliverListComponent', () => {
  let component: DeliverlistComponent;
  let fixture: ComponentFixture<DeliverlistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DeliverlistComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DeliverlistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
