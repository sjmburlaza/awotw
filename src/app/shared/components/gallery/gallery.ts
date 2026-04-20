import { Component, Input } from '@angular/core';
import { CompactNumberPipe } from '../../pipes/compact-number-pipe';
import { FadeInOnScrollDirective } from '../../directives/fade-in-on-scroll.directive';
import { SlideInOnScrollDirective } from '../../directives/slide-in-on-scroll.directive';

@Component({
  selector: 'app-gallery',
  imports: [CompactNumberPipe, FadeInOnScrollDirective, SlideInOnScrollDirective],
  templateUrl: './gallery.html',
  styleUrl: './gallery.scss',
})
export class GalleryComponent {
  @Input() data: any;
  @Input() category = '';
}
