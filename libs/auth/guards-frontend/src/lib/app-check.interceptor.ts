import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AppCheck, getToken } from '@angular/fire/app-check';
import { from, switchMap, catchError, of } from 'rxjs';

export const appCheckInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.startsWith('https://api.github.com')) {
    return next(req);
  }

  if (!req.url.includes('/api')) {
    return next(req);
  }

  const appCheck = inject(AppCheck, { optional: true });

  if (!appCheck) {
    return next(req); 
  }

  return from(getToken(appCheck)).pipe(
    catchError((appCheckErr) => {
      /**
       * ISOLATED ERROR BOUNDARY: Catch errors strictly related to fetching 
       * the local Firebase App Check token asset, preventing it from accidentally 
       * intercepting and duplicating downstream HTTP network response errors.
       */
      console.error('Firebase App Check token generation failed:', appCheckErr);
      return of({ token: '' });
    }),
    switchMap((appCheckTokenResult) => {
      const token = appCheckTokenResult.token;

      const clonedReq = token
        ? req.clone({ headers: req.headers.set('X-Firebase-AppCheck', token) })
        : req;

      return next(clonedReq); 
    })
  );
};