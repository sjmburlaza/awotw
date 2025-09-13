import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Grouping } from './grouping';

describe('Grouping', () => {
  let component: Grouping;
  let fixture: ComponentFixture<Grouping>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Grouping],
    }).compileComponents();

    fixture = TestBed.createComponent(Grouping);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
