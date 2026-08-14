import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ParticleCanvasComponent } from './particle-canvas.component';

describe('ParticleCanvasComponent', () => {
  let component: ParticleCanvasComponent;
  let fixture: ComponentFixture<ParticleCanvasComponent>;
  let wrapper: HTMLDivElement | null = null;
  let getContextSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    getContextSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => ({
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      globalAlpha: 1,
      fillStyle: '#000',
    } as unknown as CanvasRenderingContext2D));

    await TestBed.configureTestingModule({
      imports: [ParticleCanvasComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ParticleCanvasComponent);
    component = fixture.componentInstance;
    // Wrap in a positioned container so the canvas has dimensions
    wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    wrapper.style.width = '400px';
    wrapper.style.height = '300px';
    wrapper.appendChild(fixture.nativeElement);
    document.body.appendChild(wrapper);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture?.destroy();
    wrapper?.remove();
    wrapper = null;
    getContextSpy?.mockRestore();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render a canvas element', () => {
    const canvas = fixture.nativeElement.querySelector('canvas');
    expect(canvas).toBeTruthy();
    expect(canvas.classList.contains('particle-canvas')).toBe(true);
  });

  it('should have pointer-events none', () => {
    const canvas = fixture.nativeElement.querySelector('canvas');
    expect(getComputedStyle(canvas).pointerEvents).toBe('none');
  });

  it('should cancel animation on destroy', () => {
    const spy = vi.spyOn(window, 'cancelAnimationFrame');
    component.ngOnDestroy();
    expect(spy).toHaveBeenCalled();
  });
});
