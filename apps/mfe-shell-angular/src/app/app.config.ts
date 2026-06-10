import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter, withEnabledBlockingInitialNavigation } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideFirebaseApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { firebaseConfig } from './environment/environment';
import { provideStore } from '@ngrx/store';
import { initializeApp } from 'firebase/app';
import { authInterceptor } from '@school-expense-ecosystem/auth/data-access';
import { MatDialogModule } from '@angular/material/dialog';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

export const appConfig: ApplicationConfig = {
  providers: [
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAnimationsAsync(),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    importProvidersFrom(MatDialogModule),
    provideHttpClient(
      withInterceptors([authInterceptor])),
    provideStore(),
    provideRouter(routes, withEnabledBlockingInitialNavigation()),
  ],
};
