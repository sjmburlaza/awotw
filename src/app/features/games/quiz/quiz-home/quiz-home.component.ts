import { Component, EventEmitter, Input, Output } from '@angular/core';

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
  @Input() quizzes: QuizModel[] = [];
  @Output() quizSelect = new EventEmitter<QuizModel>();

  onSelectQuiz(quiz: QuizModel): void {
    this.quizSelect.emit(quiz);
  }
}
