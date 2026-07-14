import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoaderService } from 'src/app/services/loader.service';
import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let loaderService: LoaderService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    loaderService = TestBed.inject(LoaderService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('does not render until loading has finished', () => {
    expect(fixture.nativeElement.querySelector('header')).toBeNull();

    loaderService.setLoading(false);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('header')).toBeTruthy();
  });
});
