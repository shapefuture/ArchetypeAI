import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';

import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-search-box',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="search-container">
      <input
        #searchInput
        type="text"
        [placeholder]="placeholder"
        [value]="value"
        (input)="onInput($event)"
        class="search-input"
      />
      @if (value) {
        <button (click)="clear()" class="search-box__clear">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </button>
      }
    </div>
  `,
  styles: [`
    .search-container {
      display: flex;
      align-items: center;
      width: 100%;
      height: 100%;
      padding: 0 16px;
    }
    .search-input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      font-family: var(--font-serif);
      font-size: 16px;
      font-weight: 700;
      color: var(--ink-main);
      width: 100%;
    }
    .search-input::placeholder {
      color: var(--ink-light);
      font-style: italic;
      font-weight: 500;
    }
    .search-box__clear {
      color: var(--ink-light);
      width: 20px;
      height: 20px;
      border: none;
      background: transparent;
      cursor: pointer;
      padding: 0;
      margin-left: 8px;
      transition: color 0.2s;
    }
    .search-box__clear:hover {
      color: var(--ink-main);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchBoxComponent {
  @Input() placeholder = 'Search...';
  @Input() value = '';
  @Output() searchChange = new EventEmitter<string>();

  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.value = input.value;
    this.searchChange.emit(this.value);
  }

  clear(): void {
    this.value = '';
    this.searchChange.emit('');
  }
}
