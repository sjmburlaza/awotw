import { CompactNumberPipe } from './compact-number.pipe';

describe('CompactNumberPipe', () => {
  it('create an instance', () => {
    const pipe = new CompactNumberPipe();
    expect(pipe).toBeTruthy();
  });

  it('formats numbers using compact notation', () => {
    const pipe = new CompactNumberPipe();

    expect(pipe.transform(1250000)).toBe('1.3M');
  });

  it('accepts numeric strings and custom fraction digits', () => {
    const pipe = new CompactNumberPipe();

    expect(pipe.transform('1250000', 2)).toBe('1.25M');
  });

  it('returns an empty string for nullish input', () => {
    const pipe = new CompactNumberPipe();

    expect(pipe.transform(null as unknown as number)).toBe('');
  });
});
