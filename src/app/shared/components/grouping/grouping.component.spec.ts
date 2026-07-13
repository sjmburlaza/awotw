import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupingComponent } from './grouping.component';

describe('GroupingComponent', () => {
  let component: GroupingComponent;
  let fixture: ComponentFixture<GroupingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GroupingComponent);
    component = fixture.componentInstance;
    component.groups = [];
    component.title = 'Test groups';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
