import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DataService, Item } from 'src/app/services/data.service';
import { getThemeColors } from 'src/app/shared/theme-colors';

interface PuzzleTile {
  id: number;
  sourceIndex: number;
}

interface DifficultyOption {
  label: string;
  size: number;
}

@Component({
  selector: 'app-architecture-puzzle',
  imports: [FormsModule],
  templateUrl: './architecture-puzzle.html',
  styleUrl: './architecture-puzzle.scss',
})
export class ArchitecturePuzzleComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly dataService = inject(DataService);
  private readonly destroyRef = inject(DestroyRef);
  private imageLoadToken = 0;
  private imageElement?: HTMLImageElement;

  @ViewChild('puzzleCanvas') puzzleCanvas?: ElementRef<HTMLCanvasElement>;

  readonly minCustomSize = 6;
  readonly maxCustomSize = 120;
  readonly difficultyOptions: DifficultyOption[] = [
    { label: '8 x 8', size: 8 },
    { label: '16 x 16', size: 16 },
    { label: '32 x 32', size: 32 },
  ];

  wonders: Item[] = [];
  currentWonder?: Item;
  selectedWonderId?: number;
  selectedSize = 8;
  customSize = 24;
  isCustomDifficulty = false;
  tiles: PuzzleTile[] = [];
  selectedTileIndex: number | null = null;
  focusedTileIndex = 0;
  moves = 0;
  loading = true;
  imageLoading = false;
  errorMessage = '';
  imageErrorMessage = '';
  isRevealing = false;
  isComplete = false;

  get pieceCount(): number {
    return this.selectedSize * this.selectedSize;
  }

  get sizeLabel(): string {
    return `${this.selectedSize} x ${this.selectedSize}`;
  }

  get statusLabel(): string {
    if (this.isComplete) return 'Solved';
    if (this.isRevealing) return 'Preview';

    return 'Mixed';
  }

  get referenceImageAlt(): string {
    return this.currentWonder ? `Reference image for ${this.currentWonder.name}` : '';
  }

  get canvasAriaLabel(): string {
    const wonderName = this.currentWonder?.name ?? 'selected wonder';

    return `${this.sizeLabel} architecture puzzle for ${wonderName}`;
  }

  ngOnInit(): void {
    this.dataService
      .getWonders()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (wonders) => {
          this.wonders = wonders.filter((wonder) => !!wonder.imageURL);
          this.currentWonder = this.wonders[0];
          this.selectedWonderId = this.currentWonder?.id;
          this.errorMessage = this.wonders.length ? '' : 'No wonder images available.';
          this.loading = false;

          if (this.currentWonder) {
            this.restartPuzzle(true);
          }
        },
        error: () => {
          this.wonders = [];
          this.currentWonder = undefined;
          this.errorMessage = 'Unable to load architecture puzzle data.';
          this.loading = false;
        },
      });
  }

  ngAfterViewInit(): void {
    this.drawBoard();
  }

  ngOnDestroy(): void {
    this.imageLoadToken++;
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.drawBoard();
  }

  onWonderChange(wonderId: number | string): void {
    const nextId = Number(wonderId);
    const nextWonder = this.wonders.find((wonder) => wonder.id === nextId);

    if (!nextWonder) return;

    this.currentWonder = nextWonder;
    this.selectedWonderId = nextWonder.id;
    this.restartPuzzle(true);
  }

  setDifficulty(size: number): void {
    this.selectedSize = this.clampPuzzleSize(size);
    this.isCustomDifficulty = false;
    this.restartPuzzle(false);
  }

  applyCustomSize(): void {
    const nextSize = this.clampPuzzleSize(this.customSize);

    this.customSize = nextSize;
    this.selectedSize = nextSize;
    this.isCustomDifficulty = true;
    this.restartPuzzle(false);
  }

  shufflePieces(): void {
    this.tiles = this.createShuffledTiles(this.selectedSize);
    this.selectedTileIndex = null;
    this.focusedTileIndex = 0;
    this.moves = 0;
    this.isComplete = false;
    this.isRevealing = false;
    this.drawBoard();
  }

  chooseRandomWonder(): void {
    if (!this.wonders.length) return;

    if (this.wonders.length === 1) {
      this.onWonderChange(this.wonders[0].id);
      return;
    }

    let nextWonder = this.wonders[Math.floor(Math.random() * this.wonders.length)];

    while (nextWonder.id === this.currentWonder?.id) {
      nextWonder = this.wonders[Math.floor(Math.random() * this.wonders.length)];
    }

    this.onWonderChange(nextWonder.id);
  }

  toggleReveal(): void {
    this.isRevealing = !this.isRevealing;
    this.selectedTileIndex = null;
    this.drawBoard();
  }

  onCanvasPointerDown(event: PointerEvent): void {
    if (this.imageLoading || this.isRevealing || this.isComplete || !this.tiles.length) return;

    const tileIndex = this.getTileIndexFromPoint(event.clientX, event.clientY);

    if (tileIndex === null) return;

    event.preventDefault();
    this.focusedTileIndex = tileIndex;
    this.selectTile(tileIndex);
  }

  onCanvasKeyDown(event: KeyboardEvent): void {
    if (this.imageLoading || this.isRevealing || this.isComplete || !this.tiles.length) return;

    const previousFocus = this.focusedTileIndex;

    switch (event.key) {
      case 'ArrowUp':
        this.focusedTileIndex = Math.max(0, this.focusedTileIndex - this.selectedSize);
        break;
      case 'ArrowDown':
        this.focusedTileIndex = Math.min(
          this.tiles.length - 1,
          this.focusedTileIndex + this.selectedSize,
        );
        break;
      case 'ArrowLeft':
        this.focusedTileIndex = Math.max(0, this.focusedTileIndex - 1);
        break;
      case 'ArrowRight':
        this.focusedTileIndex = Math.min(this.tiles.length - 1, this.focusedTileIndex + 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.selectTile(this.focusedTileIndex);
        return;
      case 'Escape':
        event.preventDefault();
        this.selectedTileIndex = null;
        this.drawBoard();
        return;
      default:
        return;
    }

    if (previousFocus !== this.focusedTileIndex) {
      event.preventDefault();
      this.drawBoard();
    }
  }

  selectTile(tileIndex: number): void {
    if (tileIndex < 0 || tileIndex >= this.tiles.length) return;

    if (this.selectedTileIndex === null) {
      this.selectedTileIndex = tileIndex;
      this.drawBoard();
      return;
    }

    if (this.selectedTileIndex === tileIndex) {
      this.selectedTileIndex = null;
      this.drawBoard();
      return;
    }

    this.swapTiles(this.selectedTileIndex, tileIndex);
    this.selectedTileIndex = null;
    this.moves++;
    this.isComplete = this.isSolved();
    this.drawBoard();
  }

  isSolved(): boolean {
    return this.tiles.every((tile, index) => tile.sourceIndex === index);
  }

  clampPuzzleSize(value: number | string): number {
    const parsedValue = Number(value);
    const safeValue = Number.isFinite(parsedValue) ? Math.round(parsedValue) : this.minCustomSize;

    return Math.min(Math.max(safeValue, this.minCustomSize), this.maxCustomSize);
  }

  private restartPuzzle(shouldReloadImage: boolean): void {
    this.shufflePieces();

    if (shouldReloadImage) {
      this.loadCurrentImage();
    } else {
      this.drawBoard();
    }
  }

  private loadCurrentImage(): void {
    if (!this.currentWonder) return;

    const token = ++this.imageLoadToken;
    const image = new Image();

    this.imageLoading = true;
    this.imageErrorMessage = '';
    this.imageElement = undefined;
    image.decoding = 'async';

    image.onload = () => {
      if (token !== this.imageLoadToken) return;

      this.imageElement = image;
      this.imageLoading = false;
      this.drawBoard();
    };

    image.onerror = () => {
      if (token !== this.imageLoadToken) return;

      this.imageElement = undefined;
      this.imageLoading = false;
      this.imageErrorMessage = 'Image unavailable.';
      this.drawBoard();
    };

    image.src = this.currentWonder.imageURL;
  }

  private createShuffledTiles(size: number): PuzzleTile[] {
    const sourceIndices = Array.from({ length: size * size }, (_, index) => index);

    for (let index = sourceIndices.length - 1; index > 0; index--) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [sourceIndices[index], sourceIndices[swapIndex]] = [
        sourceIndices[swapIndex],
        sourceIndices[index],
      ];
    }

    if (sourceIndices.every((sourceIndex, index) => sourceIndex === index)) {
      [sourceIndices[0], sourceIndices[1]] = [sourceIndices[1], sourceIndices[0]];
    }

    return sourceIndices.map((sourceIndex, id) => ({ id, sourceIndex }));
  }

  private swapTiles(firstIndex: number, secondIndex: number): void {
    [this.tiles[firstIndex], this.tiles[secondIndex]] = [
      this.tiles[secondIndex],
      this.tiles[firstIndex],
    ];
  }

  private getTileIndexFromPoint(clientX: number, clientY: number): number | null {
    const canvas = this.puzzleCanvas?.nativeElement;

    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return null;

    const column = Math.min(
      this.selectedSize - 1,
      Math.floor((x / rect.width) * this.selectedSize),
    );
    const row = Math.min(this.selectedSize - 1, Math.floor((y / rect.height) * this.selectedSize));

    return row * this.selectedSize + column;
  }

  private drawBoard(): void {
    const canvas = this.puzzleCanvas?.nativeElement;
    const image = this.imageElement;

    if (!canvas || !image) return;

    const context = canvas.getContext('2d');

    if (!context) return;

    const rect = canvas.getBoundingClientRect();
    const canvasSize = Math.max(360, Math.round(rect.width || 720));
    const pixelRatio = window.devicePixelRatio || 1;

    canvas.width = Math.round(canvasSize * pixelRatio);
    canvas.height = Math.round(canvasSize * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.clearRect(0, 0, canvasSize, canvasSize);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = this.selectedSize > 64 ? 'low' : 'medium';

    if (this.isRevealing || this.isComplete) {
      this.drawFullImage(context, image, canvasSize);
    } else {
      this.drawTiles(context, image, canvasSize);
    }

    this.drawGrid(context, canvasSize);
    this.drawFocusStates(context, canvasSize);
  }

  private drawFullImage(
    context: CanvasRenderingContext2D,
    image: HTMLImageElement,
    canvasSize: number,
  ): void {
    const crop = this.getSquareCrop(image);

    context.drawImage(image, crop.x, crop.y, crop.size, crop.size, 0, 0, canvasSize, canvasSize);
  }

  private drawTiles(
    context: CanvasRenderingContext2D,
    image: HTMLImageElement,
    canvasSize: number,
  ): void {
    const crop = this.getSquareCrop(image);
    const sourceTileSize = crop.size / this.selectedSize;
    const targetTileSize = canvasSize / this.selectedSize;

    for (let index = 0; index < this.tiles.length; index++) {
      const tile = this.tiles[index];
      const sourceColumn = tile.sourceIndex % this.selectedSize;
      const sourceRow = Math.floor(tile.sourceIndex / this.selectedSize);
      const targetColumn = index % this.selectedSize;
      const targetRow = Math.floor(index / this.selectedSize);
      const targetX = Math.floor(targetColumn * targetTileSize);
      const targetY = Math.floor(targetRow * targetTileSize);
      const targetRight = Math.ceil((targetColumn + 1) * targetTileSize);
      const targetBottom = Math.ceil((targetRow + 1) * targetTileSize);

      context.drawImage(
        image,
        crop.x + sourceColumn * sourceTileSize,
        crop.y + sourceRow * sourceTileSize,
        sourceTileSize,
        sourceTileSize,
        targetX,
        targetY,
        targetRight - targetX,
        targetBottom - targetY,
      );
    }
  }

  private drawGrid(context: CanvasRenderingContext2D, canvasSize: number): void {
    const tileSize = canvasSize / this.selectedSize;
    const theme = getThemeColors();

    context.save();
    context.strokeStyle = theme.puzzleGridLine;
    context.lineWidth = this.selectedSize > 80 ? 0.35 : 0.55;

    for (let index = 1; index < this.selectedSize; index++) {
      const offset = index * tileSize;

      context.beginPath();
      context.moveTo(offset, 0);
      context.lineTo(offset, canvasSize);
      context.moveTo(0, offset);
      context.lineTo(canvasSize, offset);
      context.stroke();
    }

    context.restore();
  }

  private drawFocusStates(context: CanvasRenderingContext2D, canvasSize: number): void {
    if (!this.tiles.length || this.isRevealing || this.isComplete) return;

    const theme = getThemeColors();

    if (this.focusedTileIndex >= 0) {
      this.drawTileOutline(
        context,
        canvasSize,
        this.focusedTileIndex,
        theme.puzzleFocus,
        2,
        [6, 4],
      );
    }

    if (this.selectedTileIndex !== null) {
      this.drawTileOutline(context, canvasSize, this.selectedTileIndex, theme.selected, 3);
    }
  }

  private drawTileOutline(
    context: CanvasRenderingContext2D,
    canvasSize: number,
    tileIndex: number,
    color: string,
    lineWidth: number,
    dash: number[] = [],
  ): void {
    const tileSize = canvasSize / this.selectedSize;
    const column = tileIndex % this.selectedSize;
    const row = Math.floor(tileIndex / this.selectedSize);
    const inset = Math.max(1, lineWidth / 2);

    context.save();
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
    context.setLineDash(dash);
    context.strokeRect(
      column * tileSize + inset,
      row * tileSize + inset,
      tileSize - inset * 2,
      tileSize - inset * 2,
    );
    context.restore();
  }

  private getSquareCrop(image: HTMLImageElement): { x: number; y: number; size: number } {
    const naturalWidth = image.naturalWidth || image.width;
    const naturalHeight = image.naturalHeight || image.height;
    const size = Math.min(naturalWidth, naturalHeight);

    return {
      x: (naturalWidth - size) / 2,
      y: (naturalHeight - size) / 2,
      size,
    };
  }
}
