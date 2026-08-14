import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HelpModalComponent, HelpItem } from './help-modal.component';

describe('HelpModalComponent', () => {
  let component: HelpModalComponent;
  let fixture: ComponentFixture<HelpModalComponent>;

  const mockItems: HelpItem[] = [
    { title: 'Navigate', description: 'Click and drag to explore the 3D universe.' },
    { title: 'Select', description: 'Click an archetype to see details.' }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HelpModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(HelpModalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('items', mockItems);
    fixture.componentRef.setInput('title', 'How to Explore');
    fixture.componentRef.setInput('description', 'This is an interactive tool.');
    fixture.componentRef.setInput('footer', 'Have fun!');
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render title', () => {
    const title = fixture.nativeElement.querySelector('.help-modal__title');
    expect(title.textContent.trim()).toBe('How to Explore');
  });

  it('should render description', () => {
    const desc = fixture.nativeElement.querySelector('.help-modal__desc');
    expect(desc.textContent.trim()).toBe('This is an interactive tool.');
  });

  it('should render help items', () => {
    const items = fixture.nativeElement.querySelectorAll('.help-modal__item');
    expect(items.length).toBe(2);
  });

  it('should render footer', () => {
    const footer = fixture.nativeElement.querySelector('.help-modal__footer');
    expect(footer.textContent.trim()).toBe('Have fun!');
  });

  it('should emit close on overlay click', () => {
    const spy = vi.spyOn(component.close, 'emit');
    fixture.nativeElement.querySelector('.help-overlay').click();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit close on button click', () => {
    const spy = vi.spyOn(component.close, 'emit');
    fixture.nativeElement.querySelector('.help-modal__close').click();
    expect(spy).toHaveBeenCalled();
  });

  it('should not render when isOpen is false', () => {
    fixture.componentRef.setInput('isOpen', false);
    fixture.detectChanges();
    const overlay = fixture.nativeElement.querySelector('.help-overlay');
    expect(overlay).toBeFalsy();
  });

  it('should have dialog role', () => {
    const overlay = fixture.nativeElement.querySelector('.help-overlay');
    expect(overlay.getAttribute('role')).toBe('dialog');
  });
});
