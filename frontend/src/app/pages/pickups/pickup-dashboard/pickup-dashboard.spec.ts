import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PickupDashboard } from './pickup-dashboard';

describe('PickupDashboard', () => {
  let component: PickupDashboard;
  let fixture: ComponentFixture<PickupDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PickupDashboard],
    }).compileComponents();

    fixture = TestBed.createComponent(PickupDashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
