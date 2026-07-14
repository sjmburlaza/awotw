import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Router } from '@angular/router';
import { URL_PATH } from 'src/app/shared/constants/routes.const';

export interface QuizModel {
  code: string;
  title: string;
  kicker: string;
  description: string;
  detail: string;
  color: string;
  icon: string;
}

@Component({
  selector: 'app-quiz-home',
  imports: [],
  templateUrl: './quiz-home.component.html',
  styleUrl: './quiz-home.component.scss',
})
export class QuizHomeComponent {
  private readonly router = inject(Router);

  @Input() quizzes: QuizModel[] = [];
  @Output() quizSelect = new EventEmitter<QuizModel>();

  onSelectQuiz(quiz: QuizModel): void {
    this.quizSelect.emit(quiz);
  }

  goToGamesHome(): void {
    this.router.navigate([URL_PATH.GAMES]);
  }
}
