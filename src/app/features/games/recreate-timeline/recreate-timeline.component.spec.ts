import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { DataService, StyleRange } from 'src/app/services/data.service';

import { RecreateTimelineComponent } from './recreate-timeline.component';

const mockStyles: StyleRange[] = [
  {
    label: 'Ancient',
    startYear: -1000,
    endYear: -100,
    color: '#111111',
    description: 'Ancient style',
  },
  {
    label: 'Classical',
    startYear: -500,
    endYear: 500,
    color: '#222222',
    description: 'Classical style',
  },
  {
    label: 'Modern',
    startYear: 1900,
    endYear: 2026,
    color: '#333333',
    description: 'Modern style',
  },
];

describe('RecreateTimelineComponent', () => {
  let component: RecreateTimelineComponent;
  let fixture: ComponentFixture<RecreateTimelineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecreateTimelineComponent],
      providers: [
        {
          provide: DataService,
          useValue: {
            getStylesTimeline: () => of(mockStyles),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RecreateTimelineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('scores a completed timeline against the original order', () => {
    component.answerRows = component.styles.map((style) => ({
      ...style,
      currentStartYear: style.startYear,
    }));

    component.submitTimeline();

    expect(component.score).toBe(mockStyles.length);
    expect(component.hasSubmitted).toBe(true);
  });

  it('starts randomized rows at the beginning of the chart', () => {
    expect(component.answerRows).toHaveLength(mockStyles.length);
    expect(component.answerRows.every((row) => row.currentStartYear === component.minYear)).toBe(
      true,
    );
  });

  it('requires the right row and start year when scoring', () => {
    component.answerRows = component.styles.map((style) => ({
      ...style,
      currentStartYear: component.minYear,
    }));

    component.submitTimeline();

    expect(component.score).toBe(1);
  });

  it('keeps the user answer and disables checking after reveal until the game is shuffled again', () => {
    component.answerRows = component.styles.map((style) => ({
      ...style,
      currentStartYear: component.minYear,
    }));
    const revealedRows = component.answerRows.map((row) => ({
      label: row.label,
      currentStartYear: row.currentStartYear,
    }));

    component.revealTimeline();

    expect(component.hasRevealedAnswer).toBe(true);
    expect(component.score).toBe(1);
    expect(
      component.answerRows.map((row) => ({
        label: row.label,
        currentStartYear: row.currentStartYear,
      })),
    ).toEqual(revealedRows);

    component.score = 0;
    component.submitTimeline();

    expect(component.score).toBe(0);

    component.shuffleRows();

    expect(component.hasRevealedAnswer).toBe(false);
  });
});
