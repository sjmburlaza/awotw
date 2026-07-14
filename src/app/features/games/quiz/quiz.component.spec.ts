import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { QuizComponent } from './quiz.component';

describe('QuizComponent', () => {
  let component: QuizComponent;
  let fixture: ComponentFixture<QuizComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuizComponent],
      providers: [{ provide: Router, useValue: { navigate: jest.fn() } }],
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
});
