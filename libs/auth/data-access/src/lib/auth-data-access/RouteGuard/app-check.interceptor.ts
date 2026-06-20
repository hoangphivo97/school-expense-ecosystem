import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AppCheck, getToken } from '@angular/fire/app-check';
import { from, switchMap, catchError } from 'rxjs';

export const appCheckInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.includes('/api')) {
    return next(req);
  }

  const appCheck = inject(AppCheck, { optional: true });

  if (!appCheck) {
    return next(req); 
  }

  return from(getToken(appCheck)).pipe(
    switchMap((appCheckTokenResult) => {
      const token = appCheckTokenResult.token;

      const clonedReq = req.clone({
        headers: req.headers.set('X-Firebase-AppCheck', token),
      });

      return next(clonedReq);
    }),
    catchError((err) => {
      console.error('App Check Interceptor Error:', err);
      return next(req); 
    })
  );
};