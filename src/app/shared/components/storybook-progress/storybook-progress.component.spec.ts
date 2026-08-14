import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StorybookProgressComponent } from './storybook-progress.component';

describe('StorybookProgressComponent', () => {
  let component: StorybookProgressComponent;
  let fixture: ComponentFixture<StorybookProgressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StorybookProgressComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(StorybookProgressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set progress fill width', () => {
    fixture.componentRef.setInput('progress', 75);
    fixture.detectChanges();
    const fill = fixture.nativeElement.querySelector('.progress-fill');
    expect(fill.style.width).toBe('75%');
  });

  it('should show section label when provided', () => {
    fixture.componentRef.setInput('sectionLabel', 'Agency Spectrum');
    fixture.componentRef.setInput('sectionIcon', '⚡');
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('.progress-section-text');
    expect(label.textContent.trim()).toBe('Agency Spectrum');
  });

  it('should not show section when not provided', () => {
    fixture.detectChanges();
    const section = fixture.nativeElement.querySelector('.progress-section');
    expect(section).toBeFalsy();
  });

  it('should have progressbar role', () => {
    const bar = fixture.nativeElement.querySelector('.progress-bar');
    expect(bar.getAttribute('role')).toBe('progressbar');
  });

  it('should have aria-valuenow', () => {
    fixture.componentRef.setInput('progress', 50);
    fixture.detectChanges();
    const bar = fixture.nativeElement.querySelector('.progress-bar');
    expect(bar.getAttribute('aria-valuenow')).toBe('50');
  });

  it('should show percentage label when showLabel is true', () => {
    fixture.componentRef.setInput('showLabel', true);
    fixture.componentRef.setInput('progress', 50);
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('.progress-label');
    expect(label).toBeTruthy();
    expect(label.textContent.trim()).toContain('50');
  });
});
