import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlphabeticalComponent } from './alphabetical';

describe('AlphabeticalComponent', () => {
  let component: AlphabeticalComponent;
  let fixture: ComponentFixture<AlphabeticalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlphabeticalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AlphabeticalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
