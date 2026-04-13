import { AfterViewInit, Component, ElementRef, inject, OnDestroy, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import Globe from 'globe.gl';
import { take } from 'rxjs';
import { DataService, Item } from 'src/app/services/data.service';

type WonderMarker = Item & {
  latNum: number;
  lonNum: number;
};

@Component({
  selector: 'app-globe',
  imports: [RouterModule],
  templateUrl: './globe.html',
  styleUrl: './globe.scss'
})
export class GlobeComponent implements AfterViewInit, OnDestroy {
  private readonly dataService = inject(DataService);

  @ViewChild('globeContainer', { static: true })
  globeContainer!: ElementRef<HTMLDivElement>;

  selectedWonder: WonderMarker | null = null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private globe: any;

  ngAfterViewInit(): void {
    this.initGlobe();
    this.loadWonders();
  }

  ngOnDestroy(): void {
    this.globeContainer.nativeElement.innerHTML = ''; 
  }

  private initGlobe(): void {
    this.globe = new Globe(this.globeContainer.nativeElement)
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
      .htmlElementsData([])
      .htmlLat('latNum')
      .htmlLng('lonNum')
      .htmlElement((d: object) => this.createMarkerElement(d as WonderMarker));

    this.globe.pointOfView(
      { lat: 40, lng: 0, altitude: 1.5 },
      1000
    );
  }

   private loadWonders(): void {
    this.dataService.getWonders().pipe(take(1)).subscribe((wonders: Item[]) => {
      const validWonders: WonderMarker[] = wonders
        .filter((wonder) => wonder.lat && wonder.lon)
        .map((wonder) => ({
          ...wonder,
          latNum: Number(wonder.lat),
          lonNum: Number(wonder.lon),
        }))
        .filter(
          (wonder) =>
            !Number.isNaN(wonder.latNum) && !Number.isNaN(wonder.lonNum)
        );

      this.globe.htmlElementsData(validWonders);
    });
  }

  private createMarkerElement(wonder: WonderMarker): HTMLElement {
    const el = document.createElement('div');
    el.style.width = '30px';
    el.style.height = '30px';
    el.style.cursor = 'pointer';
    el.style.transform = 'translate(-50%, -100%)';
    el.style.pointerEvents = 'auto';
    el.title = wonder.name;

    el.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="${wonder.color || '#ff5722'}" viewBox="0 0 24 24">
        <path d="M12 2C8.14 2 5 5.14 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.86-3.14-7-7-7zm0 9.5
                c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5
                2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
    `;

    el.addEventListener('click', (event) => {
      event.stopPropagation();
      this.selectedWonder = wonder;

      this.globe.pointOfView(
        {
          lat: wonder.latNum,
          lng: wonder.lonNum,
          altitude: 0.5,
        },
        1200
      );
    });

    return el;
  }
}
