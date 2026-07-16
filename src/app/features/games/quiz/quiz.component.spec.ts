import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { DataService, Item, TallestBuilding } from 'src/app/services/data.service';

import { QuizComponent } from './quiz.component';

const mockWonder: Item = {
  id: 1,
  name: 'Wonder',
  yearBuilt: '2000',
  style: 'Modern',
  buildingType: 'Tower',
  location: 'City, Country',
  continent: 'Asia',
  descriptionURL: 'https://example.com/wonder',
  imageURL: 'https://example.com/wonder.jpg',
  codename: 'wonder',
  color: '#123456',
};

const mockTallestBuildings: TallestBuilding[] = Array.from({ length: 8 }, (_, index) => ({
  type: 'building',
  name: `Tower ${index + 1}`,
  city: `City ${index + 1}`,
  country: 'Country',
  height_m: String(800 - index * 50),
  year_completed: '2020',
  description: 'A tall building.',
  color: '#8b5cf6',
  image_url: `https://example.com/tower-${index + 1}.jpg`,
}));

describe('QuizComponent', () => {
  let component: QuizComponent;
  let fixture: ComponentFixture<QuizComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuizComponent],
      providers: [
        {
          provide: DataService,
          useValue: {
            getWonders: () => of([mockWonder]),
            getTallestBuildings: () => of(mockTallestBuildings),
          },
        },
        { provide: Router, useValue: { navigate: jest.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(QuizComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('returns to quiz home from an active quiz', () => {
    component.isDataLoading = false;
    component.selectedQuiz = component.quizzes[0];
    fixture.detectChanges();

    const backButton = fixture.nativeElement.querySelector(
      '.back-to-quiz-home',
    ) as HTMLButtonElement;

    backButton.click();

    expect(component.selectedQuiz).toBeNull();
  });

  it('does not show a separate exit button in quiz mode', () => {
    component.isDataLoading = false;
    component.selectedQuiz = component.quizzes[0];
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[aria-label="Exit quiz"]')).toBeNull();
  });

  it('includes the Which is tallest quiz mode', () => {
    expect(component.quizzes.map((quiz) => quiz.title)).toContain('Which is tallest?');
  });

  it('uses the dedicated fuchsia accent for the location quiz mode', () => {
    const locationQuiz = component.quizzes.find((quiz) => quiz.code === 'location');

    expect(locationQuiz?.color).toBe('var(--app-game-quiz-location)');
  });

  it('generates five unique-height building choices and selects the tallest answer', () => {
    const tallestQuiz = component.quizzes.find((quiz) => quiz.code === 'tallest');
    if (!tallestQuiz) throw new Error('Tallest quiz is missing');

    component.onSelectQuiz(tallestQuiz);

    const heights = component.tallestOptions.map((building) => Number(building.height_m));
    expect(component.tallestOptions).toHaveLength(5);
    expect(new Set(heights).size).toBe(5);
    expect(Number(component.correctTallestBuilding?.height_m)).toBe(Math.max(...heights));
    expect(component.correctAnswer).toBe(component.correctTallestBuilding?.name);
  });
});
