import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreationProgressComponent } from './creation-progress.component';

describe('CreationProgressComponent', () => {
  let component: CreationProgressComponent;
  let fixture: ComponentFixture<CreationProgressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreationProgressComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CreationProgressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render crystal ball element', () => {
    const ball = fixture.nativeElement.querySelector('.crystal-ball');
    expect(ball).toBeTruthy();
  });

  it('should display default message', () => {
    const text = fixture.nativeElement.querySelector('.creation-text');
    expect(text.textContent.trim()).toBe('Analyzing your relational patterns...');
  });

  it('should display custom message', () => {
    fixture.componentRef.setInput('message', 'Creating your archetype...');
    fixture.detectChanges();
    const text = fixture.nativeElement.querySelector('.creation-text');
    expect(text.textContent.trim()).toBe('Creating your archetype...');
  });

  it('should have sparkle canvas', () => {
    const canvas = fixture.nativeElement.querySelector('.creation-sparkles');
    expect(canvas).toBeTruthy();
    expect(canvas.tagName).toBe('CANVAS');
  });
});
