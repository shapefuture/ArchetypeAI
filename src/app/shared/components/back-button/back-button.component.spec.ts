import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BackButtonComponent } from './back-button.component';

describe('BackButtonComponent', () => {
  let component: BackButtonComponent;
  let fixture: ComponentFixture<BackButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BackButtonComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(BackButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display label text', () => {
    fixture.componentRef.setInput('label', 'Go Back');
    fixture.detectChanges();
    const text = fixture.nativeElement.querySelector('.back-btn__text');
    expect(text.textContent.trim()).toBe('Go Back');
  });

  it('should emit clicked on click', () => {
    const spy = vi.spyOn(component.clicked, 'emit');
    fixture.nativeElement.querySelector('button').click();
    expect(spy).toHaveBeenCalled();
  });

  it('should have aria-label', () => {
    fixture.componentRef.setInput('label', 'Return');
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button');
    expect(btn.getAttribute('aria-label')).toBe('Return');
  });
});
