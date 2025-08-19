import { Component, OnInit } from '@angular/core';
import { DataService, Item } from '../services/data.service';
import { take } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { CommonModule } from '@angular/common';

interface QuizModel {
  code: string;
  title: string;
  color: string;
}

@Component({
  selector: 'app-quiz',
  imports: [FormsModule, CommonModule],
  templateUrl: './quiz.html',
  styleUrl: './quiz.scss'
})
export class Quiz implements OnInit {
  quizzes = [
    {
      code: 'name',
      title: 'What is the name?',
      color: 'red'
    },
    {
      code: 'location',
      title: 'Where is it located?',
      color: 'green'
    },
    {
      code: 'style',
      title: 'What is the style?',
      color: 'blue'
    },
  ]
  data: Item[] = [];
  selectedQuiz: QuizModel | undefined | null;
  item: Item | undefined;
  options: (string | number)[] = [];
  loading = false;
  correctAnswer = '';
  selectedOption = '';
  hasSeenAnswer = false;
  currentScore = 0;
  currentCount = 0;
  disableSeeAnswerBtn = true;


  constructor(
    private dataService: DataService
  ) {}

  ngOnInit() {
    this.dataService.getData().pipe(take(1)).subscribe((res: Item[]) => this.data = res);
  }

  onSelectQuiz(quiz: QuizModel): void {
    this.selectedQuiz = quiz;
    this.generateQuiz(this.selectedQuiz?.code as keyof Item);
  }

  generateQuiz(quizType: keyof Item): void {
    this.loading = true;
    const itemIdx = this.generateRandomNum(this.data.length);
    this.item = this.data[itemIdx];
    this.options = this.generateOptions(this.item, quizType);
  }

  generateRandomNum(arrLength: number): number {
    return Math.floor(Math.random() * arrLength);
  }

  generateOptions(item: Item, quizType: keyof Item): string[] {
    const options = [] as string[];
    this.correctAnswer = item[quizType] as string;
    options.push(this.correctAnswer);

    while (options.length < 5) {
      const idx = this.generateRandomNum(this.data.length);
      const item = this.data[idx];
      const option = item[quizType] as string;
      if (!options.includes(option)) {
        options.push(option);
      }
    }

    const shuffledOptions = this.shuffleArray([...options])

    return shuffledOptions;
  }

  shuffleArray(arr: string[]): string[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  onSelectOption(): void {
    this.disableSeeAnswerBtn = false;
  }

  seeAnswer(): void {
    this.hasSeenAnswer = true;
    if (this.selectedOption === this.correctAnswer) {
      this.currentScore++;
    }
    this.disableSeeAnswerBtn = true;
    this.currentCount++;
  }

  goNext(): void {
    this.selectedOption = '';
    this.generateQuiz(this.selectedQuiz?.code as keyof Item);
    this.hasSeenAnswer = false;
  }

  exit(): void {
    this.selectedQuiz = null;
    this.currentCount = 0;
    this.currentScore = 0;
  }

}
