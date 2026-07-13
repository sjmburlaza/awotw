import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeaderboardPopupComponent } from './leaderboard-popup.component';

describe('LeaderboardPopupComponent', () => {
  let component: LeaderboardPopupComponent;
  let fixture: ComponentFixture<LeaderboardPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeaderboardPopupComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LeaderboardPopupComponent);
    component = fixture.componentInstance;
    component.currentScore = {
      score: 5400,
      completedAt: '2026-07-10T10:00:00.000Z',
    };
    component.scores = [
      { score: 5400, completedAt: '2026-07-10T10:00:00.000Z' },
      { score: 4200, completedAt: '2026-07-09T10:00:00.000Z' },
    ];
    component.actionLabel = 'Play another round';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the current score and leaderboard rows', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h2')?.textContent?.trim()).toBe('Score recorded');
    expect(element.querySelector('.leaderboard-popup__current strong')?.textContent?.trim()).toBe(
      '5400',
    );
    expect(element.querySelectorAll('.leaderboard-popup__score-row')).toHaveLength(2);
  });

  it('emits when the primary action is clicked', () => {
    const emitSpy = jest.spyOn(component.primaryAction, 'emit');

    fixture.nativeElement.querySelector('.leaderboard-popup__action').click();

    expect(emitSpy).toHaveBeenCalledTimes(1);
  });

  it('renders an empty leaderboard without a current score', () => {
    component.currentScore = undefined;
    component.scores = [];
    component.heading = 'GeoGuesser leaderboard';
    component.emptyMessage = 'No recorded scores yet.';
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.leaderboard-popup__current')).toBeNull();
    expect(element.querySelector('h2')?.textContent?.trim()).toBe('GeoGuesser leaderboard');
    expect(element.querySelector('.leaderboard-popup__empty')?.textContent?.trim()).toBe(
      'No recorded scores yet.',
    );
  });
});
