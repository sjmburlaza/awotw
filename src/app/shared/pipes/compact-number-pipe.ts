import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'compactNumber'
})
export class CompactNumberPipe implements PipeTransform {
  transform(value: number | string, fractionDigits: number = 1, locale: string = 'en-US'): string {
    if (value == null) return '';
    
    return new Intl.NumberFormat(locale, {
      notation: 'compact',
      maximumFractionDigits: fractionDigits
    }).format(Number(value));
  }
}
