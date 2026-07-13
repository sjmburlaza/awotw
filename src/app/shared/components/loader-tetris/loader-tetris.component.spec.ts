import { ComponentFixture, TestBed } from '@angular/core/testing';

import {
  LoaderTetrisComponent,
  TETRIS_CLEAR_MS,
  TETRIS_DROP_INTERVAL_MS,
  TETRIS_PIECES,
  TETRIS_RESTART_PAUSE_MS,
  TETRIS_WELL_SIZE_CELLS,
} from './loader-tetris.component';

describe('LoaderTetrisComponent', () => {
  let component: LoaderTetrisComponent;
  let fixture: ComponentFixture<LoaderTetrisComponent>;

  beforeEach(async () => {
    jest.useFakeTimers();

    await TestBed.configureTestingModule({
      imports: [LoaderTetrisComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LoaderTetrisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    jest.useRealTimers();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fill the entire well before restarting', () => {
    const occupiedCells = new Set<string>();

    TETRIS_PIECES.forEach((piece) => {
      expect(piece.cells).toHaveLength(4);

      piece.cells.forEach(([x, y]) => {
        const column = piece.x + x;
        const row = piece.y + y;

        expect(column).toBeGreaterThanOrEqual(0);
        expect(column).toBeLessThan(TETRIS_WELL_SIZE_CELLS);
        expect(row).toBeGreaterThanOrEqual(0);
        expect(row).toBeLessThan(TETRIS_WELL_SIZE_CELLS);
        occupiedCells.add(`${column},${row}`);
      });
    });

    expect(TETRIS_WELL_SIZE_CELLS).toBe(8);
    expect(TETRIS_PIECES).toHaveLength(16);
    expect(occupiedCells.size).toBe(TETRIS_WELL_SIZE_CELLS * TETRIS_WELL_SIZE_CELLS);

    for (let column = 0; column < TETRIS_WELL_SIZE_CELLS; column += 1) {
      expect(occupiedCells.has(`${column},0`)).toBe(true);
    }
  });

  it('should keep the filled well in place while clearing', () => {
    const queryPieces = () =>
      fixture.nativeElement.querySelectorAll('.loader-tetris__piece') as NodeListOf<HTMLElement>;

    expect(queryPieces()).toHaveLength(1);

    jest.advanceTimersByTime(TETRIS_DROP_INTERVAL_MS * (TETRIS_PIECES.length - 1));
    fixture.detectChanges();

    expect(queryPieces()).toHaveLength(TETRIS_PIECES.length);
    expect(queryPieces()[0].classList.contains('loader-tetris__piece--clearing')).toBe(false);

    jest.advanceTimersByTime(TETRIS_DROP_INTERVAL_MS);
    fixture.detectChanges();

    expect(queryPieces()).toHaveLength(TETRIS_PIECES.length);
    expect(queryPieces()[0].classList.contains('loader-tetris__piece--clearing')).toBe(true);

    jest.advanceTimersByTime(TETRIS_CLEAR_MS);
    fixture.detectChanges();

    expect(queryPieces()).toHaveLength(0);

    jest.advanceTimersByTime(TETRIS_RESTART_PAUSE_MS);
    fixture.detectChanges();

    expect(queryPieces()).toHaveLength(1);
  });
});
