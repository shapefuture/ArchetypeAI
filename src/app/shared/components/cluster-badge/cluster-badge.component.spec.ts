import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClusterBadgeComponent } from './cluster-badge.component';

describe('ClusterBadgeComponent', () => {
  let component: ClusterBadgeComponent;
  let fixture: ComponentFixture<ClusterBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClusterBadgeComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ClusterBadgeComponent);
    component = fixture.componentInstance;
    component.id = 'gift_archetypes';
    component.label = 'Gifts';
    component.icon = '💎';
    component.color = '#38B000';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render label', () => {
    const label = fixture.nativeElement.querySelector('.cluster-badge__label');
    expect(label.textContent.trim()).toBe('Gifts');
  });

  it('should render icon', () => {
    const icon = fixture.nativeElement.querySelector('.cluster-badge__icon');
    expect(icon.textContent.trim()).toBe('💎');
  });

  it('should apply active class', () => {
    fixture.componentRef.setInput('active', true);
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.cluster-badge');
    expect(badge.classList.contains('active')).toBe(true);
  });

  it('should emit toggle on toggle button click', () => {
    const spy = vi.spyOn(component.toggle, 'emit');
    fixture.nativeElement.querySelector('.cluster-badge__toggle').click();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit view with id on view button click', () => {
    const spy = vi.spyOn(component.view, 'emit');
    fixture.nativeElement.querySelector('.cluster-badge__view').click();
    expect(spy).toHaveBeenCalledWith('gift_archetypes');
  });

  it('should have aria-pressed on toggle button', () => {
    const btn = fixture.nativeElement.querySelector('.cluster-badge__toggle');
    expect(btn.getAttribute('aria-pressed')).toBe('false');
  });
});
