import { Component, Input } from '@angular/core';
import { CompactNumberPipe } from '../../pipes/compact-number-pipe';
import { FadeInOnScrollDirective } from '../../directives/fade-in-on-scroll.directive';
import { SlideInOnScrollDirective } from '../../directives/slide-in-on-scroll.directive';
import { MostVisited, TallestBuilding } from 'src/app/services/data.service';

type GalleryConfig =
  | {
      category: 'tallest';
      data: TallestBuilding[];
    }
  | {
      category: 'mostVisited';
      data: MostVisited[];
    };

@Component({
  selector: 'app-gallery',
  imports: [CompactNumberPipe, FadeInOnScrollDirective, SlideInOnScrollDirective],
  templateUrl: './gallery.html',
  styleUrl: './gallery.scss',
})
export class GalleryComponent {
  @Input({ required: true }) config!: GalleryConfig;
}
