import {
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DataService, StyleRange } from 'src/app/services/data.service';

interface TimelineGameEntry extends StyleRange {
  originalIndex: number;
  currentStartYear: number;
}

interface DragState {
  originalIndex: number;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startIndex: number;
  startYear: number;
  rowPitch: number;
}

@Component({
  selector: 'app-recreate-timeline',
  imports: [],
  templateUrl: './recreate-timeline.component.html',
  styleUrl: './recreate-timeline.component.scss',
})
export class RecreateTimelineComponent implements OnInit {
  private readonly dataService = inject(DataService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly startToleranceYears = 50;

  @ViewChild('chartPlot') chartPlot?: ElementRef<HTMLDivElement>;

  styles: TimelineGameEntry[] = [];
  answerRows: TimelineGameEntry[] = [];
  tickValues: number[] = [];
  loading = true;
  errorMessage = '';
  hasSubmitted = false;
  hasRevealedAnswer = false;
  score = 0;
  private dragState: DragState | null = null;

  get maxScore(): number {
    return this.styles.length;
  }

  get minYear(): number {
    return this.styles.length ? Math.min(...this.styles.map((style) => style.startYear)) : -3100;
  }

  get maxYear(): number {
    return this.styles.length ? Math.max(...this.styles.map((style) => style.endYear)) : 2026;
  }

  ngOnInit(): void {
    this.dataService
      .getStylesTimeline()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (styles) => {
          this.styles = styles.map((style, originalIndex) => ({
            ...style,
            originalIndex,
            currentStartYear: style.startYear,
          }));
          this.tickValues = this.buildTickValues(this.minYear, this.maxYear);
          this.shuffleRows();
          this.errorMessage = this.styles.length ? '' : 'No timeline data available.';
          this.loading = false;
        },
        error: () => {
          this.styles = [];
          this.answerRows = [];
          this.tickValues = [];
          this.errorMessage = 'Unable to load timeline game data.';
          this.loading = false;
        },
      });
  }

  @HostListener('window:pointermove', ['$event'])
  onWindowPointerMove(event: PointerEvent): void {
    if (!this.dragState || event.pointerId !== this.dragState.pointerId) return;

    const plot = this.chartPlot?.nativeElement;
    const activeIndex = this.findActiveIndex();

    if (!plot || activeIndex < 0) return;

    event.preventDefault();

    const activeRow = this.answerRows[activeIndex];
    const yearSpan = this.maxYear - this.minYear;
    const deltaYears = (event.clientX - this.dragState.startClientX) * (yearSpan / plot.clientWidth);
    const maxStartYear = this.maxYear - this.getDuration(activeRow);
    const nextStartYear = this.snapYear(
      this.clamp(this.dragState.startYear + deltaYears, this.minYear, maxStartYear),
    );
    const rowDelta = Math.round(
      (event.clientY - this.dragState.startClientY) / this.dragState.rowPitch,
    );
    const targetIndex = this.clamp(
      this.dragState.startIndex + rowDelta,
      0,
      this.answerRows.length - 1,
    );

    activeRow.currentStartYear = nextStartYear;

    if (targetIndex !== activeIndex) {
      this.answerRows.splice(activeIndex, 1);
      this.answerRows.splice(targetIndex, 0, activeRow);
    }
  }

  @HostListener('window:pointerup', ['$event'])
  @HostListener('window:pointercancel', ['$event'])
  onWindowPointerEnd(event: PointerEvent): void {
    if (!this.dragState || event.pointerId !== this.dragState.pointerId) return;

    this.dragState = null;
  }

  onBarPointerDown(event: PointerEvent, row: TimelineGameEntry, index: number): void {
    if (event.button !== 0 || this.hasRevealedAnswer) return;

    const bar = event.currentTarget as HTMLElement;
    const rowElement = bar.closest('.timeline-row') as HTMLElement | null;

    event.preventDefault();
    bar.setPointerCapture(event.pointerId);
    this.dragState = {
      originalIndex: row.originalIndex,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startIndex: index,
      startYear: row.currentStartYear,
      rowPitch: rowElement ? this.getRowPitch(rowElement) : 28,
    };
    this.clearResult();
  }

  submitTimeline(): void {
    if (this.hasRevealedAnswer) return;

    this.score = this.calculateScore();
    this.hasSubmitted = true;
  }

  shuffleRows(): void {
    this.hasRevealedAnswer = false;
    this.answerRows = this.shuffle(
      this.styles.map((style) => ({ ...style, currentStartYear: this.minYear })),
    );

    if (this.answerRows.every((row, index) => row.originalIndex === index)) {
      this.answerRows.reverse();
    }

    this.clearResult();
  }

  revealTimeline(): void {
    this.dragState = null;
    this.score = this.calculateScore();
    this.hasSubmitted = true;
    this.hasRevealedAnswer = true;
  }

  isCorrect(row: TimelineGameEntry, index: number): boolean {
    return this.hasSubmitted && this.isCorrectPlacement(row, index);
  }

  isMisplaced(row: TimelineGameEntry, index: number): boolean {
    return this.hasSubmitted && !this.isCorrectPlacement(row, index);
  }

  isDragging(row: TimelineGameEntry): boolean {
    return this.dragState?.originalIndex === row.originalIndex;
  }

  getCurrentStartOffset(style: TimelineGameEntry): number {
    return this.toPercent(style.currentStartYear);
  }

  getCorrectRow(index: number): TimelineGameEntry {
    return this.styles[index];
  }

  getCorrectStartOffset(index: number): number {
    return this.toPercent(this.getCorrectRow(index).startYear);
  }

  getBarWidth(style: StyleRange): number {
    const span = this.maxYear - this.minYear;

    if (span <= 0) return 100;

    return ((style.endYear - style.startYear) / span) * 100;
  }

  getCorrectLabelOffset(index: number): number {
    const style = this.getCorrectRow(index);
    const startOffset = this.getCorrectStartOffset(index);
    const endOffset = startOffset + this.getBarWidth(style);

    if (this.shouldPlaceCorrectLabelBefore(index)) {
      return Math.max(0, startOffset - 1);
    }

    return Math.min(100, endOffset + 1);
  }

  getLabelOffset(style: TimelineGameEntry): number {
    const startOffset = this.getCurrentStartOffset(style);
    const endOffset = startOffset + this.getBarWidth(style);

    if (this.shouldPlaceLabelBefore(style)) {
      return Math.max(0, startOffset - 1);
    }

    return Math.min(100, endOffset + 1);
  }

  shouldPlaceCorrectLabelBefore(index: number): boolean {
    const style = this.getCorrectRow(index);
    const startOffset = this.getCorrectStartOffset(index);
    const endOffset = startOffset + this.getBarWidth(style);

    return startOffset > 18 && endOffset > 82;
  }

  shouldPlaceLabelBefore(style: TimelineGameEntry): boolean {
    const startOffset = this.getCurrentStartOffset(style);
    const endOffset = startOffset + this.getBarWidth(style);

    return startOffset > 18 && endOffset > 82;
  }

  getTickOffset(year: number): number {
    return this.toPercent(year);
  }

  formatYear(year: number): string {
    if (year < 0) return `${Math.abs(year)} BC`;

    return `${year} AD`;
  }

  getPlacementLabel(row: TimelineGameEntry): string {
    return `${row.label} style placed at ${this.formatYear(row.currentStartYear)}`;
  }

  private clearResult(): void {
    this.hasSubmitted = false;
    this.score = 0;
  }

  private calculateScore(): number {
    return this.answerRows.reduce(
      (total, row, index) => total + (this.isCorrectPlacement(row, index) ? 1 : 0),
      0,
    );
  }

  private isCorrectPlacement(row: TimelineGameEntry, index: number): boolean {
    return (
      row.originalIndex === index &&
      Math.abs(row.currentStartYear - row.startYear) <= this.startToleranceYears
    );
  }

  private findActiveIndex(): number {
    return this.answerRows.findIndex((row) => row.originalIndex === this.dragState?.originalIndex);
  }

  private getDuration(style: StyleRange): number {
    return style.endYear - style.startYear;
  }

  private getRowPitch(rowElement: HTMLElement): number {
    const rowTop = rowElement.getBoundingClientRect().top;
    const sibling = (rowElement.nextElementSibling ?? rowElement.previousElementSibling) as
      | HTMLElement
      | null;

    if (!sibling) return rowElement.getBoundingClientRect().height;

    return Math.abs(sibling.getBoundingClientRect().top - rowTop);
  }

  private snapYear(year: number): number {
    return Math.round(year / 10) * 10;
  }

  private toPercent(year: number): number {
    const span = this.maxYear - this.minYear;

    if (span <= 0) return 0;

    return ((year - this.minYear) / span) * 100;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  private shuffle(rows: TimelineGameEntry[]): TimelineGameEntry[] {
    for (let index = rows.length - 1; index > 0; index--) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [rows[index], rows[swapIndex]] = [rows[swapIndex], rows[index]];
    }

    return rows;
  }

  private buildTickValues(minYear: number, maxYear: number): number[] {
    const span = maxYear - minYear;
    let step = 100;

    if (span > 8000) step = 1000;
    else if (span > 4000) step = 500;
    else if (span > 2000) step = 250;
    else if (span > 1000) step = 100;
    else if (span > 500) step = 50;
    else step = 25;

    const start = Math.ceil(minYear / step) * step;
    const ticks: number[] = [];

    for (let year = start; year <= maxYear; year += step) {
      ticks.push(year);
    }

    return ticks;
  }
}
