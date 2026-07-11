import { Component, OnInit, inject } from '@angular/core';
import { take } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DataService, Item } from 'src/app/services/data.service';

interface QuizModel {
  code: string;
  title: string;
  color: string;
}

@Component({
  selector: 'app-quiz',
  imports: [FormsModule, CommonModule],
  templateUrl: './quiz.html',
  styleUrl: './quiz.scss',
})
export class QuizComponent implements OnInit {
  private readonly dataService = inject(DataService);

  quizzes = [
    {
      code: 'name',
      title: 'What is the name?',
      color: 'red',
    },
    {
      code: 'location',
      title: 'Where is it located?',
      color: 'green',
    },
    {
      code: 'style',
      title: 'What is the style?',
      color: 'blue',
    },
    {
      code: 'yearBuilt',
      title: 'When was it built?',
      color: 'orange',
    },
    {
      code: 'buildingType',
      title: 'What is the use?',
      color: 'violet',
    },
  ];
  data: Item[] = [];
  selectedQuiz: QuizModel | undefined | null;
  item: Item | undefined;
  pendingItem: Item | undefined;
  options: (string | number)[] = [];
  loading = false;
  correctAnswer = '';
  selectedOption = '';
  hasSeenAnswer = false;
  currentScore = 0;
  currentCount = 0;
  disableSeeAnswerBtn = true;
  isDataLoading = true;
  dataLoadError = '';

  ngOnInit() {
    this.dataService
      .getWonders()
      .pipe(take(1))
      .subscribe({
        next: (res: Item[]) => {
          this.data = res;
          this.dataLoadError = res.length ? '' : 'No quiz data available.';
          this.isDataLoading = false;
        },
        error: () => {
          this.data = [];
          this.dataLoadError = 'Unable to load quiz data.';
          this.isDataLoading = false;
        },
      });
  }

  onSelectQuiz(quiz: QuizModel): void {
    if (!this.data.length) return;

    this.currentCount = 0;
    this.currentScore = 0;
    this.resetQuestionState();
    this.selectedQuiz = quiz;
    this.generateQuiz(this.selectedQuiz?.code as keyof Item);
  }

  generateQuiz(quizType: keyof Item): void {
    if (!this.data.length) {
      this.loading = false;
      this.dataLoadError = 'No quiz data available.';
      return;
    }

    this.loading = true;
    this.item = undefined;
    this.pendingItem = undefined;
    this.options = [];
    const itemIdx = this.generateRandomNum(this.data.length);
    const nextItem = this.data[itemIdx];
    this.pendingItem = nextItem;
    this.options = this.generateOptions(nextItem, quizType);
  }

  generateRandomNum(arrLength: number): number {
    return Math.floor(Math.random() * arrLength);
  }

  generateOptions(item: Item, quizType: keyof Item): string[] {
    const correctAnswer = String(item[quizType] ?? '');
    const options = [correctAnswer];
    const optionPool = Array.from(
      new Set(
        this.data
          .map((dataItem) => String(dataItem[quizType] ?? ''))
          .filter((option) => option && option !== correctAnswer),
      ),
    );

    this.correctAnswer = correctAnswer;

    while (options.length < 5 && optionPool.length) {
      const idx = this.generateRandomNum(optionPool.length);
      const [option] = optionPool.splice(idx, 1);
      options.push(option);
    }

    const shuffledOptions = this.shuffleArray([...options]);

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
    this.resetQuestionState();
    this.generateQuiz(this.selectedQuiz?.code as keyof Item);
  }

  exit(): void {
    this.selectedQuiz = null;
    this.item = undefined;
    this.pendingItem = undefined;
    this.options = [];
    this.loading = false;
    this.currentCount = 0;
    this.currentScore = 0;
    this.resetQuestionState();
  }

  private resetQuestionState(): void {
    this.selectedOption = '';
    this.hasSeenAnswer = false;
    this.disableSeeAnswerBtn = true;
  }

  showPendingItem(): void {
    this.item = this.pendingItem;
    this.pendingItem = undefined;
    this.loading = false;
  }
}
