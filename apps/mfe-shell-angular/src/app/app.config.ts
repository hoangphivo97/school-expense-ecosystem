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
import { authInterceptor } from '@school-expense-ecosystem/auth/data-access';
import { MatDialogModule } from '@angular/material/dialog';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { environment } from './environments/environment';
import { API_BASE_URL, HTTP_ERROR_DELEGATE } from '@school-expense-ecosystem/shared/tokens';
import { ErrorModalService } from '@school-expense-ecosystem/shared/ui';
import { DialogError } from '@school-expense-ecosystem/shared/types';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: API_BASE_URL, useValue: environment.apiUrl },
    {
      provide: HTTP_ERROR_DELEGATE,
      useFactory: (errorModalService: ErrorModalService) => {
        // Trả về một hàm khớp cấu trúc với Token yêu cầu
        return (dialogData: DialogError) => errorModalService.openCustomErrorModal(dialogData);
      },
      deps: [ErrorModalService] // Tiêm con service UI xịn vào đây để làm việc thực tế
    },
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
