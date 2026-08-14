import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BlobCharacterComponent } from './blob-character.component';

describe('BlobCharacterComponent', () => {
  let component: BlobCharacterComponent;
  let fixture: ComponentFixture<BlobCharacterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BlobCharacterComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(BlobCharacterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render an SVG', () => {
    const svg = fixture.nativeElement.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('should apply size class', () => {
    fixture.componentRef.setInput('size', 'lg');
    fixture.detectChanges();
    const wrapper = fixture.nativeElement.querySelector('.blob-wrapper');
    expect(wrapper.classList.contains('blob--lg')).toBe(true);
  });

  it('should update mouth for happy mood', () => {
    fixture.componentRef.setInput('mood', 'happy');
    fixture.detectChanges();
    expect(component.mouthFill).toBe('var(--ink-main)');
  });

  it('should update mouth for sad mood', () => {
    fixture.componentRef.setInput('mood', 'sad');
    fixture.detectChanges();
    expect(component.mouthFill).toBe('none');
  });

  it('should apply bounce animation for excited mood', () => {
    fixture.componentRef.setInput('mood', 'excited');
    fixture.componentRef.setInput('animate', true);
    fixture.detectChanges();
    const wrapper = fixture.nativeElement.querySelector('.blob-wrapper');
    expect(wrapper.classList.contains('blob--bounce')).toBe(true);
  });

  it('should apply tilt animation for thinking mood', () => {
    fixture.componentRef.setInput('mood', 'thinking');
    fixture.componentRef.setInput('animate', true);
    fixture.detectChanges();
    const wrapper = fixture.nativeElement.querySelector('.blob-wrapper');
    expect(wrapper.classList.contains('blob--tilt')).toBe(true);
  });

  it('should set aria-label from name input', () => {
    fixture.componentRef.setInput('name', 'The Sovereign');
    fixture.detectChanges();
    const svg = fixture.nativeElement.querySelector('svg');
    expect(svg.getAttribute('aria-label')).toBe('The Sovereign');
  });

  it('should use default color when not specified', () => {
    fixture.detectChanges();
    const body = fixture.nativeElement.querySelector('path[fill]');
    expect(body.getAttribute('fill')).toBe('#4a3e35');
  });
});
