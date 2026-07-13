import { HighlightPipe } from './highlight.pipe';

describe('HighlightPipe', () => {
  it('create an instance', () => {
    const pipe = new HighlightPipe();
    expect(pipe).toBeTruthy();
  });

  it('wraps case-insensitive matches in mark tags', () => {
    const pipe = new HighlightPipe();

    expect(pipe.transform('Great Wall of China', 'wall')).toBe('Great <mark>Wall</mark> of China');
  });

  it('returns the original value for blank search text', () => {
    const pipe = new HighlightPipe();

    expect(pipe.transform('Colosseum', '   ')).toBe('Colosseum');
  });

  it('escapes regex characters in the search text', () => {
    const pipe = new HighlightPipe();

    expect(pipe.transform('Temple (A) and Temple A', '(A)')).toBe(
      'Temple <mark>(A)</mark> and Temple A',
    );
  });
});
