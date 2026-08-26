import { DOCUMENT } from '@angular/common';
import { effect, inject, Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DarkModeService {
  isDarkMode = signal(false);
  private readonly _document = inject(DOCUMENT)

  constructor() {
    effect(() => {
      if (this.isDarkMode()) {
        this._document.body.classList.add('dark-mode');
      } else {
        this._document.body.classList.remove('dark-mode');
      }
    })
  }

  setDarkMode(isDark: boolean) {
    this.isDarkMode.set(isDark);
    // console.log('Angular received theme change:', isDark);
    // console.log('Current document state:', this._document.body.classList.contains('dark-mode'));
  }

}