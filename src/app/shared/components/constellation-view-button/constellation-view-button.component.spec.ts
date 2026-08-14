import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConstellationViewButtonComponent } from './constellation-view-button.component';

describe('ConstellationViewButtonComponent', () => {
  let component: ConstellationViewButtonComponent;
  let fixture: ComponentFixture<ConstellationViewButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConstellationViewButtonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConstellationViewButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit clicked event when clicked', () => {
    const spy = vi.spyOn(component.clicked, 'emit');
    const button = fixture.nativeElement.querySelector('button');
    button.click();
    expect(spy).toHaveBeenCalled();
  });

  it('should have proper aria label', () => {
    const button = fixture.nativeElement.querySelector('button');
    expect(button.getAttribute('aria-label')).toBe('View constellation');
  });
});
