import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface LeaderboardScore {
  score: number;
  completedAt: string;
}

let nextLeaderboardPopupId = 0;

@Component({
  selector: 'app-leaderboard-popup',
  imports: [],
  templateUrl: './leaderboard-popup.component.html',
  styleUrl: './leaderboard-popup.component.scss',
})
export class LeaderboardPopupComponent {
  @Input() currentScore?: LeaderboardScore;
  @Input() scores: LeaderboardScore[] = [];
  @Input() heading = 'Score recorded';
  @Input() scoreLabel = 'Total score';
  @Input() scoresLabel = 'Top scores';
  @Input() dateTimeLabel = 'Date and time';
  @Input() actionLabel = 'Continue';
  @Input() emptyMessage = 'No scores recorded yet.';

  @Output() primaryAction = new EventEmitter<void>();

  readonly headingId = `leaderboard-popup-title-${nextLeaderboardPopupId++}`;

  formatScoreDate(completedAt: string): string {
    const date = new Date(completedAt);

    if (Number.isNaN(date.getTime())) return 'Unknown time';

    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  }
}
