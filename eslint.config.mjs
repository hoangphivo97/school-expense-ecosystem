import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: ['**/dist', '**/out-tsc'],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            // App (Shell, Remote) Rules
            {
              sourceTag: 'scope:app',
              onlyDependOnLibsWithTags: [
                'scope:auth',
                'scope:expenses',
                'scope:shared',
                'scope:finance',
                'scope:dashboard',
                'scope:admin'
              ],
            }, //Backend Rules
            {
              sourceTag: 'scope:backend',
              onlyDependOnLibsWithTags: [
                'scope:backend',
                'scope:auth',
                'scope:finance',
                'scope:shared',
                'scope:admin'
              ],
            },
            // Rulse for Domain Auth
            {
              sourceTag: 'scope:auth',
              onlyDependOnLibsWithTags: [
                'scope:auth',
                'scope:shared',
                'scope:features',
                'scope:data-access',
                'scope: data-access-backend',
              ],
            },
            // Rules Domain Expenses
            {
              sourceTag: 'scope:expenses',
              onlyDependOnLibsWithTags: ['scope:expenses', 'scope:shared'],
            },
            // Rules for Shared
            {
              sourceTag: 'scope:shared',
              onlyDependOnLibsWithTags: ['scope:shared'],
            },

            // Inbound Rules for Shared Libraries (UI, Data Access, Utils, Types, Constants)
            {
              sourceTag: 'type:ui',
              onlyDependOnLibsWithTags: [
                'type:ui',
                'type:shared-utils',
                'type:types',
                'type:constants',
                'type:data-access',
              ],
            },
            {
              sourceTag: 'type:data-access',
              onlyDependOnLibsWithTags: [
                'type:shared-utils',
                'type:types',
                'type:constants',
              ],
            },
            {
              sourceTag: 'type:shared-utils',
              onlyDependOnLibsWithTags: ['type:types', 'type:constants'],
            },
            {
              sourceTag: 'type:types',
              onlyDependOnLibsWithTags: ['type:types'],
            },
            {
              sourceTag: 'type:constants',
              onlyDependOnLibsWithTags: ['type:types'],
            },
            {
              sourceTag: 'scope:finance',
              onlyDependOnLibsWithTags: [
                'scope:finance',
                'scope:auth',
                'scope:shared',
              ],
            },
            {
              sourceTag: 'scope:admin',
              onlyDependOnLibsWithTags: [
                'scope:admin',
                'scope:shared', 
                'scope:auth',
              ],
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    // Override or add rules here
    rules: {},
  },
];
