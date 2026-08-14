import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SearchBoxComponent } from './search-box.component';

describe('SearchBoxComponent', () => {
  let component: SearchBoxComponent;
  let fixture: ComponentFixture<SearchBoxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchBoxComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SearchBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display placeholder', () => {
    fixture.componentRef.setInput('placeholder', 'Search archetypes...');

    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input');
    expect(input.placeholder).toBe('Search archetypes...');
  });

  it('should emit searchChange on input', () => {
    const spy = vi.spyOn(component.searchChange, 'emit');
    const input = fixture.nativeElement.querySelector('input');
    input.value = 'Sovereign';
    input.dispatchEvent(new Event('input'));
    expect(spy).toHaveBeenCalledWith('Sovereign');
    expect(component.value).toBe('Sovereign');
  });

  it('should show clear button when value is not empty', () => {
    fixture.componentRef.setInput('value', 'test');

    fixture.detectChanges();
    const clear = fixture.nativeElement.querySelector('.search-box__clear');
    expect(clear).toBeTruthy();
  });

  it('should hide clear button when value is empty', () => {
    fixture.componentRef.setInput('value', '');

    fixture.detectChanges();
    const clear = fixture.nativeElement.querySelector('.search-box__clear');
    expect(clear).toBeFalsy();
  });

  it('should clear value on clear button click', () => {
    fixture.componentRef.setInput('value', 'test');

    fixture.detectChanges();
    const spy = vi.spyOn(component.searchChange, 'emit');
    fixture.nativeElement.querySelector('.search-box__clear').click();
    expect(component.value).toBe('');
    expect(spy).toHaveBeenCalledWith('');
  });
});
