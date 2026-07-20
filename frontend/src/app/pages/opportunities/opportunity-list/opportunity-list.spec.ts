import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpportunityList } from './opportunity-list';

describe('OpportunityList', () => {
  let component: OpportunityList;
  let fixture: ComponentFixture<OpportunityList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OpportunityList],
    }).compileComponents();

    fixture = TestBed.createComponent(OpportunityList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should allow create opportunity for admin and ngo roles', () => {
    component.userRole = 'Admin';
    component.updateCreateOpportunityVisibility();
    expect(component.canCreateOpportunity).toBeTrue();

    component.userRole = 'NGO';
    component.updateCreateOpportunityVisibility();
    expect(component.canCreateOpportunity).toBeTrue();
  });

  it('should deny create opportunity for user and volunteer roles', () => {
    component.userRole = 'User';
    component.updateCreateOpportunityVisibility();
    expect(component.canCreateOpportunity).toBeFalse();

    component.userRole = 'Volunteer';
    component.updateCreateOpportunityVisibility();
    expect(component.canCreateOpportunity).toBeFalse();
  });
});
