import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { FullUniverseButtonComponent } from './full-universe-button.component';

describe('FullUniverseButtonComponent', () => {
  let component: FullUniverseButtonComponent;
  let fixture: ComponentFixture<FullUniverseButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FullUniverseButtonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FullUniverseButtonComponent);
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

  it('should display content', () => {
    @Component({
      standalone: true,
      imports: [FullUniverseButtonComponent],
      template: `<app-full-universe-button>View Full Universe</app-full-universe-button>`
    })
    class HostComponent {}

    const hostFixture = TestBed.createComponent(HostComponent);
    hostFixture.detectChanges();
    const button = hostFixture.nativeElement.querySelector('button');
    expect(button.textContent).toContain('View Full Universe');
  });

  it('should have proper aria label', () => {
    const button = fixture.nativeElement.querySelector('button');
    expect(button.getAttribute('aria-label')).toBe('View full universe');
  });
});
