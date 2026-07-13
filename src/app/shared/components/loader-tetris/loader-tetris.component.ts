import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';

export const TETRIS_WELL_SIZE_CELLS = 8;
export const TETRIS_DROP_INTERVAL_MS = 320;
export const TETRIS_CLEAR_MS = 260;
export const TETRIS_RESTART_PAUSE_MS = 220;

const CELL_STEP = 22;
const TETRIS_COLORS = [
  'var(--app-category-5)',
  'var(--app-loader-dot-2)',
  'var(--app-loader-dot-5)',
  'var(--app-category-6)',
  'var(--app-loader-dot-4)',
  'var(--app-loader-dot-1)',
  'var(--app-loader-dot-3)',
] as const;

type TetrisCellInput = readonly [number, number];

export interface TetrisPiece {
  id: string;
  shape: string;
  x: number;
  y: number;
  cells: readonly TetrisCellInput[];
}

interface RenderCell {
  readonly left: number;
  readonly top: number;
}

interface RenderPiece extends TetrisPiece {
  readonly color: string;
  readonly left: number;
  readonly top: number;
  readonly spawnX: string;
  readonly spawnY: string;
  readonly renderCells: readonly RenderCell[];
}

export const TETRIS_PIECES: readonly TetrisPiece[] = [
  {
    id: 'p1',
    shape: 'T',
    x: 0,
    y: 6,
    cells: [
      [1, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ],
  },
  {
    id: 'p2',
    shape: 'T',
    x: 2,
    y: 6,
    cells: [
      [0, 0],
      [1, 0],
      [2, 0],
      [1, 1],
    ],
  },
  {
    id: 'p3',
    shape: 'L',
    x: 4,
    y: 6,
    cells: [
      [2, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ],
  },
  {
    id: 'p4',
    shape: 'L',
    x: 6,
    y: 5,
    cells: [
      [0, 0],
      [1, 0],
      [1, 1],
      [1, 2],
    ],
  },
  {
    id: 'p5',
    shape: 'L',
    x: 0,
    y: 5,
    cells: [
      [0, 0],
      [1, 0],
      [2, 0],
      [0, 1],
    ],
  },
  {
    id: 'p6',
    shape: 'J',
    x: 3,
    y: 5,
    cells: [
      [0, 0],
      [1, 0],
      [2, 0],
      [2, 1],
    ],
  },
  {
    id: 'p7',
    shape: 'L',
    x: 0,
    y: 3,
    cells: [
      [2, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ],
  },
  {
    id: 'p8',
    shape: 'J',
    x: 3,
    y: 2,
    cells: [
      [1, 0],
      [1, 1],
      [0, 2],
      [1, 2],
    ],
  },
  {
    id: 'p9',
    shape: 'J',
    x: 5,
    y: 3,
    cells: [
      [0, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ],
  },
  {
    id: 'p10',
    shape: 'S',
    x: 0,
    y: 2,
    cells: [
      [1, 0],
      [2, 0],
      [0, 1],
      [1, 1],
    ],
  },
  {
    id: 'p11',
    shape: 'J',
    x: 3,
    y: 1,
    cells: [
      [0, 0],
      [1, 0],
      [0, 1],
      [0, 2],
    ],
  },
  {
    id: 'p12',
    shape: 'L',
    x: 6,
    y: 1,
    cells: [
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 2],
    ],
  },
  {
    id: 'p13',
    shape: 'T',
    x: 0,
    y: 0,
    cells: [
      [0, 0],
      [0, 1],
      [1, 1],
      [0, 2],
    ],
  },
  {
    id: 'p14',
    shape: 'L',
    x: 4,
    y: 0,
    cells: [
      [0, 0],
      [1, 0],
      [1, 1],
      [1, 2],
    ],
  },
  {
    id: 'p15',
    shape: 'L',
    x: 6,
    y: 0,
    cells: [
      [0, 0],
      [1, 0],
      [1, 1],
      [1, 2],
    ],
  },
  {
    id: 'p16',
    shape: 'T',
    x: 1,
    y: 0,
    cells: [
      [0, 0],
      [1, 0],
      [2, 0],
      [1, 1],
    ],
  },
];

@Component({
  selector: 'app-loader-tetris',
  imports: [],
  templateUrl: './loader-tetris.component.html',
  styleUrl: './loader-tetris.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoaderTetrisComponent {
  private readonly destroyRef = inject(DestroyRef);
  private timer: ReturnType<typeof setTimeout> | undefined;
  private readonly activePieceCount = signal(1);

  readonly isClearing = signal(false);
  readonly pieces = TETRIS_PIECES.map(
    (piece, index): RenderPiece => ({
      ...piece,
      color: TETRIS_COLORS[index % TETRIS_COLORS.length],
      left: piece.x * CELL_STEP,
      top: piece.y * CELL_STEP,
      spawnX: `${(4 - piece.x) * CELL_STEP}px`,
      spawnY: `-${(piece.y + 5) * CELL_STEP}px`,
      renderCells: piece.cells.map(([x, y]) => ({
        left: x * CELL_STEP,
        top: y * CELL_STEP,
      })),
    }),
  );
  readonly visiblePieces = computed(() => this.pieces.slice(0, this.activePieceCount()));

  constructor() {
    this.scheduleDrop();
    this.destroyRef.onDestroy(() => this.clearTimer());
  }

  private scheduleDrop(): void {
    this.timer = setTimeout(() => {
      const nextCount = this.activePieceCount() + 1;

      if (nextCount <= this.pieces.length) {
        this.activePieceCount.set(nextCount);
        this.scheduleDrop();
        return;
      }

      this.isClearing.set(true);
      this.timer = setTimeout(() => {
        this.activePieceCount.set(0);
        this.isClearing.set(false);
        this.timer = setTimeout(() => {
          this.activePieceCount.set(1);
          this.scheduleDrop();
        }, TETRIS_RESTART_PAUSE_MS);
      }, TETRIS_CLEAR_MS);
    }, TETRIS_DROP_INTERVAL_MS);
  }

  private clearTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }
}
