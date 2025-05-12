import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CityManagementComponent } from './city-management.component';

describe('CityManagementComponent', () => {
  let component: CityManagementComponent;
  let fixture: ComponentFixture<CityManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CityManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CityManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
