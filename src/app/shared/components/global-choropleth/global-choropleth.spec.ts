import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GlobalChoropleth } from './global-choropleth';

describe('GlobalChoropleth', () => {
  let component: GlobalChoropleth;
  let fixture: ComponentFixture<GlobalChoropleth>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GlobalChoropleth]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GlobalChoropleth);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
