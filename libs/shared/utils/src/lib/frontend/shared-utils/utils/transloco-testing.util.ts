import { TranslocoTestingModule } from '@ngneat/transloco';

// Load real translation files directly using Node require
import { enCommon, enShared, twShared, twCommon } from '@school-expense-ecosystem/shared/assets';

/**
 * Reusable Transloco testing provider with real translation data
 */
export function provideSharedTranslocoTesting() {
    return TranslocoTestingModule.forRoot({
        langs: {
            // Merge common and shared scopes to match production behavior
            en: { common: enCommon, shared: enShared },
            tw: { common: twCommon, shared: twShared }
        },
        translocoConfig: {
            availableLangs: ['en'],
            defaultLang: 'en',
        },
    });
}