import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { forkJoin, take } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DataService, Item, TallestBuilding } from 'src/app/services/data.service';
import { COLOR_VARS, cssVar } from 'src/app/shared/theme-colors';
import { LoaderTetrisComponent } from 'src/app/shared/components/loader-tetris/loader-tetris.component';
import { QuizHomeComponent, QuizModel } from './quiz-home/quiz-home.component';

@Component({
  selector: 'app-quiz',
  imports: [FormsModule, CommonModule, LoaderTetrisComponent, QuizHomeComponent],
  templateUrl: './quiz.component.html',
  styleUrl: './quiz.component.scss',
})
export class QuizComponent implements OnInit, OnDestroy {
  private readonly dataService = inject(DataService);
  private readonly loadedImageUrls = new Set<string>();
  private imageLoadToken = 0;

  quizzes = [
    {
      code: 'name',
      title: 'What is the name?',
      kicker: 'Visual recall',
      description: 'Identify the wonder from its image and lock in the landmark name.',
      detail: 'Names',
      color: cssVar(COLOR_VARS.category7),
      icon: 'bi-card-image',
    },
    {
      code: 'location',
      title: 'Where is it located?',
      kicker: 'Place memory',
      description: 'Match each wonder to the place that shaped its story.',
      detail: 'Locations',
      color: cssVar(COLOR_VARS.category2),
      icon: 'bi-geo-alt',
    },
    {
      code: 'style',
      title: 'What is the style?',
      kicker: 'Style read',
      description: 'Spot the architectural language behind each monument.',
      detail: 'Styles',
      color: cssVar(COLOR_VARS.category1),
      icon: 'bi-columns-gap',
    },
    {
      code: 'yearBuilt',
      title: 'When was it built?',
      kicker: 'Timeline sense',
      description: 'Choose the year that belongs to the structure in view.',
      detail: 'Dates',
      color: cssVar(COLOR_VARS.category4),
      icon: 'bi-calendar3',
    },
    {
      code: 'buildingType',
      title: 'What is the use?',
      kicker: 'Program check',
      description: 'Recognize the original or defining purpose of each wonder.',
      detail: 'Uses',
      color: cssVar(COLOR_VARS.category5),
      icon: 'bi-building',
    },
    {
      code: 'tallest',
      title: 'Which is tallest?',
      kicker: 'Skyline showdown',
      description: 'Compare five landmark towers and choose the one that reaches the highest.',
      detail: 'Heights',
      color: cssVar(COLOR_VARS.category6),
      icon: 'bi-arrows-vertical',
    },
  ];
  data: Item[] = [];
  tallestBuildings: TallestBuilding[] = [];
  tallestOptions: TallestBuilding[] = [];
  correctTallestBuilding: TallestBuilding | undefined;
  failedTallestImages = new Set<string>();
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
    forkJoin({
      wonders: this.dataService.getWonders(),
      tallestBuildings: this.dataService.getTallestBuildings(),
    })
      .pipe(take(1))
      .subscribe({
        next: ({ wonders, tallestBuildings }) => {
          this.data = wonders;
          this.tallestBuildings = tallestBuildings.filter(
            (building) =>
              !!building.image_url &&
              Number.isFinite(Number(building.height_m)) &&
              Number(building.height_m) > 0,
          );
          this.dataLoadError =
            wonders.length && this.tallestBuildings.length >= 5 ? '' : 'No quiz data available.';
          this.isDataLoading = false;
        },
        error: () => {
          this.data = [];
          this.tallestBuildings = [];
          this.dataLoadError = 'Unable to load quiz data.';
          this.isDataLoading = false;
        },
      });
  }

  ngOnDestroy(): void {
    this.imageLoadToken++;
  }

  onSelectQuiz(quiz: QuizModel): void {
    const hasQuizData =
      quiz.code === 'tallest' ? this.tallestBuildings.length >= 5 : !!this.data.length;
    if (!hasQuizData) return;

    this.currentCount = 0;
    this.currentScore = 0;
    this.resetQuestionState();
    this.selectedQuiz = quiz;

    if (quiz.code === 'tallest') {
      this.generateTallestQuiz();
    } else {
      this.generateQuiz(quiz.code as keyof Item);
    }
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
    const token = ++this.imageLoadToken;
    const itemIdx = this.generateRandomNum(this.data.length);
    const nextItem = this.data[itemIdx];
    this.pendingItem = nextItem;
    this.options = this.generateOptions(nextItem, quizType);

    if (this.loadedImageUrls.has(nextItem.imageURL)) {
      this.showPendingItem();
      return;
    }

    this.preloadQuestionImage(nextItem, token);
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

  shuffleArray<T>(arr: T[]): T[] {
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

    if (this.selectedQuiz?.code === 'tallest') {
      this.generateTallestQuiz();
    } else {
      this.generateQuiz(this.selectedQuiz?.code as keyof Item);
    }
  }

  exit(): void {
    this.imageLoadToken++;
    this.selectedQuiz = null;
    this.item = undefined;
    this.pendingItem = undefined;
    this.options = [];
    this.tallestOptions = [];
    this.correctTallestBuilding = undefined;
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
    if (!this.pendingItem) {
      this.loading = false;
      return;
    }

    this.item = this.pendingItem;
    this.pendingItem = undefined;
    this.loading = false;
  }

  generateTallestQuiz(): void {
    const uniqueHeightBuildings = Array.from(
      new Map(
        this.tallestBuildings.map((building) => [Number(building.height_m), building]),
      ).values(),
    );

    if (uniqueHeightBuildings.length < 5) {
      this.tallestOptions = [];
      this.options = [];
      this.loading = false;
      this.dataLoadError = 'Not enough unique building heights are available.';
      return;
    }

    this.loading = true;
    this.item = undefined;
    this.pendingItem = undefined;
    this.tallestOptions = this.shuffleArray(uniqueHeightBuildings).slice(0, 5);
    this.correctTallestBuilding = this.tallestOptions.reduce((tallest, building) =>
      Number(building.height_m) > Number(tallest.height_m) ? building : tallest,
    );
    this.options = this.tallestOptions.map((building) => building.name);
    this.correctAnswer = this.correctTallestBuilding.name;
    this.loading = false;
  }

  formatBuildingHeight(height: string): string {
    return `${Number(height).toLocaleString(undefined, { maximumFractionDigits: 1 })} m`;
  }

  onTallestImageError(building: TallestBuilding): void {
    this.failedTallestImages.add(building.name);
  }

  private preloadQuestionImage(item: Item, token: number): void {
    const image = new Image();

    image.decoding = 'async';
    image.fetchPriority = 'high';

    image.onload = () => {
      if (token !== this.imageLoadToken) return;

      this.loadedImageUrls.add(item.imageURL);
      this.showPendingItem();
    };

    image.onerror = () => {
      if (token !== this.imageLoadToken) return;

      this.showPendingItem();
    };

    image.src = item.imageURL;
  }
}
