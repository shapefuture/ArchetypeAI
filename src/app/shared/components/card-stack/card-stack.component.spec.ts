import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { CardStackComponent } from './card-stack.component';

describe('CardStackComponent', () => {
  let component: CardStackComponent;
  let fixture: ComponentFixture<CardStackComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardStackComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CardStackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render background layers', () => {
    const layers = fixture.nativeElement.querySelectorAll('.card-layer');
    expect(layers.length).toBe(2);
  });

  it('should render ribbons when provided', () => {
    fixture.componentRef.setInput('ribbons', ['#70a1d7', '#f4a261']);
    fixture.detectChanges();
    const ribbons = fixture.nativeElement.querySelectorAll('.card-stack__ribbon');
    expect(ribbons.length).toBe(2);
  });

  it('should not render ribbons section when empty', () => {
    fixture.componentRef.setInput('ribbons', []);
    fixture.detectChanges();
    const ribbonContainer = fixture.nativeElement.querySelector('.card-stack__ribbons');
    expect(ribbonContainer).toBeFalsy();
  });

  it('should show close button by default', () => {
    const btn = fixture.nativeElement.querySelector('.card-stack__close');
    expect(btn).toBeTruthy();
  });

  it('should hide close button when showClose is false', () => {
    fixture.componentRef.setInput('showClose', false);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('.card-stack__close');
    expect(btn).toBeFalsy();
  });

  it('should emit close event on button click', () => {
    const spy = vi.spyOn(component.close, 'emit');
    const btn = fixture.nativeElement.querySelector('.card-stack__close');
    btn.click();
    expect(spy).toHaveBeenCalled();
  });

  it('should project content', () => {
    // Create a host component to test content projection
    @Component({
      standalone: true,
      imports: [CardStackComponent],
      template: `<app-card-stack><p class="test-content">Hello</p></app-card-stack>`
    })
    class HostComponent {}

    const hostFixture = TestBed.createComponent(HostComponent);
    hostFixture.detectChanges();
    const content = hostFixture.nativeElement.querySelector('.test-content');
    expect(content).toBeTruthy();
    expect(content.textContent).toBe('Hello');
  });
});
