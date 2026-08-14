import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaperButtonComponent } from './paper-button.component';

describe('PaperButtonComponent', () => {
  let component: PaperButtonComponent;
  let fixture: ComponentFixture<PaperButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaperButtonComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PaperButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should apply primary variant class', () => {
    component.variant = 'primary';
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button');
    expect(btn.classList.contains('paper-btn--primary')).toBe(true);
  });

  it('should apply accent variant class', () => {
    fixture.componentRef.setInput('variant', 'accent');
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button');
    expect(btn.classList.contains('paper-btn--accent')).toBe(true);
  });

  it('should apply size class', () => {
    fixture.componentRef.setInput('size', 'lg');
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button');
    expect(btn.classList.contains('paper-btn--lg')).toBe(true);
  });

  it('should show icon when provided', () => {
    fixture.componentRef.setInput('icon', '⚡');
    fixture.detectChanges();
    const icon = fixture.nativeElement.querySelector('.paper-btn__icon');
    expect(icon).toBeTruthy();
    expect(icon.textContent.trim()).toBe('⚡');
  });

  it('should not show icon when not provided', () => {
    fixture.detectChanges();
    const icon = fixture.nativeElement.querySelector('.paper-btn__icon');
    expect(icon).toBeFalsy();
  });

  it('should be disabled when disabled is true', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button');
    expect(btn.disabled).toBe(true);
  });

  it('should emit clicked event when not disabled', () => {
    const spy = vi.spyOn(component.clicked, 'emit');
    const btn = fixture.nativeElement.querySelector('button');
    btn.click();
    expect(spy).toHaveBeenCalled();
  });

  it('should NOT emit clicked event when disabled', () => {
    component.disabled = true;
    fixture.detectChanges();
    const spy = vi.spyOn(component.clicked, 'emit');
    const btn = fixture.nativeElement.querySelector('button');
    btn.click();
    expect(spy).not.toHaveBeenCalled();
  });

  it('should apply sketchy class', () => {
    fixture.componentRef.setInput('sketchy', true);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button');
    expect(btn.classList.contains('paper-btn--sketchy')).toBe(true);
  });

  it('should set aria-label', () => {
    fixture.componentRef.setInput('ariaLabel', 'Test button');
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button');
    expect(btn.getAttribute('aria-label')).toBe('Test button');
  });
});
