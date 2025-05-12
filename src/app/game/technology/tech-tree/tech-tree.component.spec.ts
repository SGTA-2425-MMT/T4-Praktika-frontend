import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TechTreeComponent } from './tech-tree.component';

describe('TechTreeComponent', () => {
  let component: TechTreeComponent;
  let fixture: ComponentFixture<TechTreeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TechTreeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TechTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
