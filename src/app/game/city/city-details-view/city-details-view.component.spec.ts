import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CityDetailsViewComponent } from './city-details-view.component';

describe('CityDetailsViewComponent', () => {
  let component: CityDetailsViewComponent;
  let fixture: ComponentFixture<CityDetailsViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CityDetailsViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CityDetailsViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
