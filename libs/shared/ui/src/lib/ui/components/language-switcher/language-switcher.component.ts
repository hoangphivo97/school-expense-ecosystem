import { Component, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoService } from '@ngneat/transloco';
import { MatMenuModule } from '@angular/material/menu';
import { NgClass } from "../../../../../../../../node_modules/@angular/common/types/_common_module-chunk";
import { MatRipple } from "@angular/material/core";

interface LanguageOption {
  readonly code: string;
  readonly label: string;
  readonly flagIcon?: string;
}

@Component({
  selector: 'lib-language-switcher',
  imports: [MatButtonModule, MatMenuModule, MatIconModule, NgClass, MatRipple],
  templateUrl: './language-switcher.component.html',
  styleUrl: './language-switcher.component.scss',
})
export class LanguageSwitcherComponent {
  private readonly translocoService = inject(TranslocoService);
  readonly collapsed = input(false);

  /**
   * Centralized data-driven array. 
   * To add a new language in the future, simply append a new object here.
   */
  protected readonly languages: LanguageOption[] = [
    { code: 'en', label: 'English (US)' },
    { code: 'zh-TW', label: '繁體中文 (台灣)' }
  ];

  /**
   * Signal-backed state manager to track the active application locale.
   */
  protected readonly currentLang = signal<string>(this.translocoService.getActiveLang());

  /**
   * Computes the display label of the active language from the option collection.
   */
  protected get currentLanguageLabel(): string {
    const activeOpt = this.languages.find(lang => lang.code === this.currentLang());
    return activeOpt ? activeOpt.label : 'Language';
  }

  /**
   * Dispatches language mutations downstream to all runtime Transloco bindings.
   */
  protected onLanguageSelected(langCode: string): void {
    if (this.currentLang() === langCode) return;

    this.translocoService.setActiveLang(langCode);
    this.currentLang.set(langCode);
  }

  protected get currentLanguageAbbreviation(): string {
    const code = this.currentLang();
    return code === 'zh-TW' ? 'TW' : code.substring(0, 2).toUpperCase();
  }
}
