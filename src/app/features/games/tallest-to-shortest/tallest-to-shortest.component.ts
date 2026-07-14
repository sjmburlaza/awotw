import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { DataService, TallestBuilding } from 'src/app/services/data.service';
import { URL_PATH } from 'src/app/shared/constants/routes.const';

@Component({
  selector: 'app-tallest-to-shortest',
  imports: [],
  templateUrl: './tallest-to-shortest.component.html',
  styleUrl: './tallest-to-shortest.component.scss',
})
export class TallestToShortestComponent implements OnInit {
  private readonly dataService = inject(DataService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly roundSize = 21;

  allBuildings: TallestBuilding[] = [];
  buildings: TallestBuilding[] = [];
  correctOrder: TallestBuilding[] = [];
  failedImages = new Set<string>();
  selectedIndex: number | null = null;
  dragSourceIndex: number | null = null;
  dragOverIndex: number | null = null;
  loading = true;
  errorMessage = '';
  hasSubmitted = false;
  hasRevealedAnswer = false;
  score = 0;

  get maxScore(): number {
    return this.buildings.length;
  }

  ngOnInit(): void {
    this.dataService
      .getTallestBuildings()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (buildings) => {
          this.allBuildings = buildings.filter(
            (building) =>
              !!building.image_url &&
              Number.isFinite(Number(building.height_m)) &&
              Number(building.height_m) > 0,
          );

          if (this.allBuildings.length < this.roundSize) {
            this.errorMessage = `At least ${this.roundSize} building images are needed to play.`;
          } else {
            this.startNewRound();
          }

          this.loading = false;
        },
        error: () => {
          this.allBuildings = [];
          this.buildings = [];
          this.correctOrder = [];
          this.errorMessage = 'Unable to load the tallest buildings game data.';
          this.loading = false;
        },
      });
  }

  startNewRound(): void {
    const round = this.shuffle(this.allBuildings).slice(0, this.roundSize);

    this.correctOrder = [...round].sort(
      (a, b) => Number(b.height_m) - Number(a.height_m),
    );
    this.buildings = this.shuffle(round);

    if (this.isFullyCorrect()) {
      [this.buildings[0], this.buildings[this.buildings.length - 1]] = [
        this.buildings[this.buildings.length - 1],
        this.buildings[0],
      ];
    }

    this.hasRevealedAnswer = false;
    this.clearResult();
  }

  submitOrder(): void {
    if (this.hasRevealedAnswer) return;

    this.score = this.calculateScore();
    this.hasSubmitted = true;
    this.selectedIndex = null;
  }

  revealAnswer(): void {
    this.score = this.calculateScore();
    this.hasSubmitted = true;
    this.hasRevealedAnswer = true;
    this.buildings = [...this.correctOrder];
    this.selectedIndex = null;
    this.clearDragState();
  }

  onCardClick(index: number): void {
    if (this.hasRevealedAnswer) return;

    if (this.selectedIndex === null) {
      this.selectedIndex = index;
      return;
    }

    if (this.selectedIndex === index) {
      this.selectedIndex = null;
      return;
    }

    this.reorder(this.selectedIndex, index);
    this.selectedIndex = null;
  }

  onCardKeydown(event: KeyboardEvent, index: number): void {
    if (this.hasRevealedAnswer) return;

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onCardClick(index);
      return;
    }

    let targetIndex = index;

    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') targetIndex = index - 1;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') targetIndex = index + 1;
    if (event.key === 'Home') targetIndex = 0;
    if (event.key === 'End') targetIndex = this.buildings.length - 1;

    targetIndex = Math.max(0, Math.min(targetIndex, this.buildings.length - 1));
    if (targetIndex === index) return;

    event.preventDefault();
    this.reorder(index, targetIndex);
    this.selectedIndex = targetIndex;
  }

  onDragStart(event: DragEvent, index: number): void {
    if (this.hasRevealedAnswer) {
      event.preventDefault();
      return;
    }

    this.dragSourceIndex = index;
    this.selectedIndex = null;
    event.dataTransfer?.setData('text/plain', String(index));
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }

  onDragOver(event: DragEvent, index: number): void {
    if (this.dragSourceIndex === null || this.hasRevealedAnswer) return;

    event.preventDefault();
    this.dragOverIndex = index;
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  }

  onDrop(event: DragEvent, index: number): void {
    if (this.dragSourceIndex === null || this.hasRevealedAnswer) return;

    event.preventDefault();
    this.reorder(this.dragSourceIndex, index);
    this.clearDragState();
  }

  onDragEnd(): void {
    this.clearDragState();
  }

  onImageError(building: TallestBuilding): void {
    this.failedImages.add(building.name);
  }

  isCorrect(index: number): boolean {
    return this.hasSubmitted && this.isCorrectAt(index);
  }

  isMisplaced(index: number): boolean {
    return this.hasSubmitted && !this.isCorrectAt(index);
  }

  formatHeight(height: string): string {
    return `${Number(height).toLocaleString(undefined, { maximumFractionDigits: 1 })} m`;
  }

  getCardAriaLabel(building: TallestBuilding, index: number): string {
    const height = this.hasSubmitted ? `, ${this.formatHeight(building.height_m)}` : '';
    const selection = this.selectedIndex === index ? ', selected' : '';

    return `Position ${index + 1} of ${this.buildings.length}: ${building.name}${height}${selection}`;
  }

  goToGamesHome(): void {
    this.router.navigate([URL_PATH.GAMES]);
  }

  private reorder(fromIndex: number, toIndex: number): void {
    if (fromIndex === toIndex) return;

    const [building] = this.buildings.splice(fromIndex, 1);
    this.buildings.splice(toIndex, 0, building);
    this.clearResult();
  }

  private clearResult(): void {
    this.hasSubmitted = false;
    this.score = 0;
    this.selectedIndex = null;
  }

  private clearDragState(): void {
    this.dragSourceIndex = null;
    this.dragOverIndex = null;
  }

  private calculateScore(): number {
    return this.buildings.reduce(
      (total, _building, index) => total + (this.isCorrectAt(index) ? 1 : 0),
      0,
    );
  }

  private isFullyCorrect(): boolean {
    return this.buildings.length > 0 && this.calculateScore() === this.buildings.length;
  }

  private isCorrectAt(index: number): boolean {
    return Number(this.buildings[index]?.height_m) === Number(this.correctOrder[index]?.height_m);
  }

  private shuffle<T>(items: T[]): T[] {
    const shuffled = [...items];

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
    }

    return shuffled;
  }
}
