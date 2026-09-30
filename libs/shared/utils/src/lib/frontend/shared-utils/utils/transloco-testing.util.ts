import { TranslocoTestingModule } from '@ngneat/transloco';

// Load real translation files directly using Node require
import { enCommon, enShared, twShared, twCommon } from '@school-expense-ecosystem/shared/assets';

/**
 * Reusable Transloco testing provider with real translation data
 */
export function provideSharedTranslocoTesting(extraLangs?: {
    en?: Record<string, unknown>;
    tw?: Record<string, unknown>;
}) {
    return TranslocoTestingModule.forRoot({
        langs: {
            // Merge common and shared scopes to match production behavior
            en: { common: enCommon, shared: enShared, ...(extraLangs?.en) ?? {} },
            tw: { common: twCommon, shared: twShared, ...(extraLangs?.tw) ?? {} }
        },
        translocoConfig: {
            availableLangs: ['en', 'tw'],
            defaultLang: 'en',
        },
    });
}