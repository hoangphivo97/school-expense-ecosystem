import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter, withEnabledBlockingInitialNavigation } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideFirebaseApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { firebaseConfig } from './environments/environment';
import { provideStore } from '@ngrx/store';
import { initializeApp } from 'firebase/app';
import { appCheckInterceptor, authInterceptor } from '@school-expense-ecosystem/auth/guards';
import { MatDialogModule } from '@angular/material/dialog';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { environment } from './environments/environment';
import { API_BASE_URL, HTTP_ERROR_DELEGATE } from '@school-expense-ecosystem/shared/tokens';
import { ErrorModalService } from '@school-expense-ecosystem/shared/ui';
import { DialogError } from '@school-expense-ecosystem/shared/types';
import { provideAppCheck, initializeAppCheck, ReCaptchaV3Provider } from '@angular/fire/app-check';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: API_BASE_URL, useValue: environment.apiUrl },
    {
      provide: HTTP_ERROR_DELEGATE,
      useFactory: (errorModalService: ErrorModalService) => {
        return (dialogData: DialogError) => errorModalService.openCustomErrorModal(dialogData);
      },
      deps: [ErrorModalService]
    },
    provideFirebaseApp(() => initializeApp(firebaseConfig)),

    provideAppCheck(() => {
      // if (!environment.production) {
      //   (globalThis as any).FIREBASE_APPCHECK_DEBUG_TOKEN = '';
      // }
      
      const provider = new ReCaptchaV3Provider(environment.recaptchaSiteKey);
      return initializeAppCheck(undefined, {
        provider,
        isTokenAutoRefreshEnabled: true
      });
    }),

    provideAnimationsAsync(),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    importProvidersFrom(MatDialogModule),
    provideHttpClient(
      withInterceptors([authInterceptor, appCheckInterceptor])),
    provideStore(),
    provideRouter(routes, withEnabledBlockingInitialNavigation()),
  ],
};
