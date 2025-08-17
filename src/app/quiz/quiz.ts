import { Component, OnInit } from '@angular/core';
import { DataService, Item } from '../services/data.service';
import { take } from 'rxjs';

interface QuizModel {
  code: string;
  title: string;
  color: string;
}

@Component({
  selector: 'app-quiz',
  imports: [],
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
      color: 'yellow'
    },
  ]
  data: Item[] = [];
  selectedQuiz: QuizModel | undefined | null;
  item: Item | undefined;
  options: (string | number)[] = [];
  loading = false;

  constructor(
    private dataService: DataService
  ) {}

  ngOnInit() {
    this.dataService.getData().pipe(take(1)).subscribe((res: Item[]) => this.data = res);
  }

  goNext() {
    this.generateQuiz(this.selectedQuiz?.code as keyof Item);
  }

  exit() {
    this.selectedQuiz = null;
  }

  onSelectQuiz(quiz: QuizModel): void {
    this.selectedQuiz = quiz;
    this.generateQuiz(this.selectedQuiz?.code as keyof Item);
  }

  generateQuiz(quizType: keyof Item) {
    this.loading = true;
    const itemIdx = this.generateRandomNum(this.data.length);
    this.item = this.data[itemIdx];
    this.options = this.generateOptions(this.item, quizType);
  }

  generateRandomNum(arrLength: number) {
    return Math.floor(Math.random() * arrLength);
  }

  generateOptions(item: Item, quizType: keyof Item): (string | number)[] {
    const options = [];
    options.push(item[quizType]);

    while (options.length < 5) {
      const idx = this.generateRandomNum(this.data.length);
      const item = this.data[idx];
      const option = item[quizType];
      if (!options.includes(option)) {
        options.push(option);
      }
    }

    return options;
  }

}
