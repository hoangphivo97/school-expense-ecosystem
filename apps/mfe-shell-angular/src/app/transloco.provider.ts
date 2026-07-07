import { EnvironmentProviders, makeEnvironmentProviders, isDevMode } from '@angular/core';
import { provideTransloco } from '@ngneat/transloco';
import { TranslocoHttpLoader } from './transloco-loader';

export function provideTranslocoConfig(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideTransloco({
      config: {
        availableLangs: ['en', 'zh-TW'],
        defaultLang: 'en',
        // Forces templates to re-render dynamically across view bounds upon runtime language changes
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader
    })
  ]);
}