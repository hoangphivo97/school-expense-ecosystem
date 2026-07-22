import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderComponent } from './header.component';
import { provideSharedTranslocoTesting } from '@school-expense-ecosystem/shared/utils-frontend';

import { Router, NavigationEnd } from '@angular/router';
import { ReplaySubject } from 'rxjs';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let routerEvents$: ReplaySubject<any>;
  let mockRouter: any;

  beforeEach(async () => {
    routerEvents$ = new ReplaySubject<any>(1);
    mockRouter = {
      events: routerEvents$.asObservable(),
      url: '/dashboard'
    };

    await TestBed.configureTestingModule({
      imports: [HeaderComponent, provideSharedTranslocoTesting()],
      providers: [
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return fallback title when URL does not match any registered routes', () => {
    // Simulate initial value setting with an unregistered path
    mockRouter.url = '/unknown-path';
    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;

    expect(component.pageTitle()).toBe('header.fallback');
  });

  it('should update pageTitle dynamically when a NavigationEnd event occurs', () => {
    fixture.detectChanges();
    
    // Simulate user navigating to a route (ensure the key exists in your ROUTE_HEADER_TITLE_REGISTRY)
    routerEvents$.next(new NavigationEnd(1, '/dashboard', '/dashboard'));
    fixture.detectChanges();

    expect(component.pageTitle()).toBe('header.titles./dashboard');
  });

  it('should prioritize longer sub-routes over short root segments due to descending length sorting', () => {
    fixture.detectChanges();

    // If registry has both '/admin' and '/admin/settings', the longer one must take precedence
    routerEvents$.next(new NavigationEnd(1, '/admin/settings', '/admin/settings'));
    fixture.detectChanges();

    expect(component.pageTitle()).toBe('header.titles./admin/settings');
  });
});