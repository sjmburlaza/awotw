import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GlobalChoroplethComponent } from './global-choropleth';

describe('GlobalChoroplethComponent', () => {
  let component: GlobalChoroplethComponent;
  let fixture: ComponentFixture<GlobalChoroplethComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GlobalChoroplethComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GlobalChoroplethComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
