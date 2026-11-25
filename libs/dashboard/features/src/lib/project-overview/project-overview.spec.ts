import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { ChangelogService, ProjectLedgerService } from '@school-expense-ecosystem/dashboard/data-access';
import { AuthSignalStore } from '@school-expense-ecosystem/shared/data-access';
import { provideSharedTranslocoTesting } from '@school-expense-ecosystem/shared/test-utils-frontend';
import { UserBase } from '@school-expense-ecosystem/shared/types';
import {
  HeaderComponent,
  LanguageSwitcherComponent,
  ReactWrapperComponent,
} from '@school-expense-ecosystem/shared/ui';
import { ProjectOverview } from './project-overview';

@Component({ selector: 'lib-header', standalone: true, template: '' })
class StubHeaderComponent {}

@Component({ selector: 'lib-react-wrapper', standalone: true, template: '' })
class StubReactWrapperComponent {}

@Component({ selector: 'lib-language-switcher', standalone: true, template: '' })
class StubLanguageSwitcherComponent {}

describe('ProjectOverview', () => {
  let component: ProjectOverview;
  let fixture: ComponentFixture<ProjectOverview>;

  let mockUserSignal: WritableSignal<UserBase | null>;
  let mockChangelogService: { getChangelog: jest.Mock };
  let mockLedgerService: { getLedgerTimelines: jest.Mock };

  beforeEach(async () => {
    mockUserSignal = signal<UserBase | null>(null);

    mockChangelogService = {
      getChangelog: jest.fn(() =>
        of('## [1.0.0] (2026-11-25)\n### Features\n* **auth:** initial release')
      ),
    };

    mockLedgerService = {
      getLedgerTimelines: jest.fn(() =>
        of({
          history: [],
          roadmap: [],
        })
      ),
    };

    await TestBed.configureTestingModule({
      imports: [
        ProjectOverview,
        provideSharedTranslocoTesting({
          en: { overview: {} },
          tw: { overview: {} },
        }),
      ],
      providers: [
        provideRouter([]),
        { provide: ChangelogService, useValue: mockChangelogService },
        { provide: ProjectLedgerService, useValue: mockLedgerService },
        { provide: AuthSignalStore, useValue: { user: mockUserSignal } },
      ],
    })
      .overrideComponent(ProjectOverview, {
        remove: {
          imports: [HeaderComponent, ReactWrapperComponent, LanguageSwitcherComponent],
        },
        add: {
          imports: [StubHeaderComponent, StubReactWrapperComponent, StubLanguageSwitcherComponent],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ProjectOverview);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and parse changelog releases from ChangelogService', () => {
    expect(component).toBeTruthy();
    expect(component.isAuthenticated()).toBe(false);
    expect(component.parsedReleases()).toHaveLength(1);
    expect(component.parsedReleases()[0].version).toBe('1.0.0');
  });

  it('should navigate to /auth when navigateToLogin is triggered', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);

    component.navigateToLogin();

    expect(navigateSpy).toHaveBeenCalledWith(['/auth']);
  });

  it('should switch between public topbar and authenticated header based on auth state', () => {
  const compiled = fixture.nativeElement as HTMLElement;
  expect(compiled.querySelector('.public-showcase-topbar')).toBeTruthy();
  expect(compiled.querySelector('lib-header')).toBeNull();

  mockUserSignal.set({ uid: 'user-01', fullName: 'Lin Wei-Ting' } as UserBase);
  fixture.detectChanges();

  expect(compiled.querySelector('.public-showcase-topbar')).toBeNull();
  expect(compiled.querySelector('lib-header')).toBeTruthy();
});
});