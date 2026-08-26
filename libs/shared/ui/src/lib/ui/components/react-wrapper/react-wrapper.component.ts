import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  inject,
  effect,
} from '@angular/core';
import {
  loadRemote,
} from '@module-federation/enhanced/runtime';
import * as React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { ReactComponentType } from '@school-expense-ecosystem/shared/types';

import { DarkModeService } from '@school-expense-ecosystem/shared/data-access';
import { NgZone } from '@angular/core';
import { DarkModeToggleProps } from '@school-expense-ecosystem/shared/types'

@Component({
  selector: 'lib-react-wrapper',
  standalone: true,
  templateUrl: './react-wrapper.component.html',
  styleUrls: ['./react-wrapper.component.css'],
})
export class ReactWrapperComponent implements AfterViewInit, OnDestroy {
  protected readonly themeService = inject(DarkModeService);
  private readonly ngZone = inject(NgZone);

  @ViewChild('reactContainer', { static: true }) containerRef!: ElementRef;
  private root!: Root;
  private ReactComp!: React.ComponentType<DarkModeToggleProps>;

  constructor() {
    effect(() => {
      const isDark = this.themeService.isDarkMode()

      if (this.root && this.ReactComp) {
        this.renderReact(isDark)
      }
    })
  }

  async ngAfterViewInit() {
    try {
      const m = await loadRemote<ReactComponentType>(
        'mfe_remote_react/DarkModeToggle',
      );

      if (m && m.MuiDarkModeToggle) {
        this.ReactComp = m.MuiDarkModeToggle
        this.root = createRoot(this.containerRef.nativeElement);

        this.renderReact(this.themeService.isDarkMode())
      } else {
        console.error(
          'Remote module return null or there are no default export',
        );
      }
    } catch (error) {
      console.error('error load React remote:', error);
    }
  }

  private renderReact(isDark: boolean) {
    this.root.render(
      React.createElement(this.ReactComp, {
        isDark: isDark,
        onThemeChange: (newDarkVal: boolean) => {
          this.ngZone.run(() => {
            this.themeService.setDarkMode(newDarkVal);
          });
        },
      })
    );
  }

  ngOnDestroy() {
    if (this.root) {
      this.root.unmount();
    }
  }
}