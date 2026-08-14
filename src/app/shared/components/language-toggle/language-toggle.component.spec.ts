import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LanguageToggleComponent } from './language-toggle.component';

describe('LanguageToggleComponent', () => {
  let component: LanguageToggleComponent;
  let fixture: ComponentFixture<LanguageToggleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LanguageToggleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LanguageToggleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display current language', () => {
    fixture.componentRef.setInput('currentLanguage', 'en');
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('.language-toggle__label');
    expect(label.textContent).toBe('en');
  });

  it('should display Russian language', () => {
    fixture.componentRef.setInput('currentLanguage', 'ru');
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('.language-toggle__label');
    expect(label.textContent).toBe('ru');
  });

  it('should emit clicked event when clicked', () => {
    const spy = vi.spyOn(component.clicked, 'emit');
    const button = fixture.nativeElement.querySelector('button');
    button.click();
    expect(spy).toHaveBeenCalled();
  });

  it('should have proper aria label', () => {
    const button = fixture.nativeElement.querySelector('button');
    expect(button.getAttribute('aria-label')).toBe('Toggle language');
  });
});
