import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Alphabetical } from './alphabetical';

describe('Alphabetical', () => {
  let component: Alphabetical;
  let fixture: ComponentFixture<Alphabetical>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Alphabetical]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Alphabetical);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
