export default {
  displayName: 'auth-data-access',
  preset: '../../../jest.preset.js',
  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$|@ngneat|flat)'],
  transform: {
    '^.+\\.(ts|mjs|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js', 'html', 'mjs'],
    coverageDirectory: '../../../coverage/libs/auth/data-access',
  setupFilesAfterEnv: ['<rootDir>/../../../apps/mfe-shell-angular/setup-jest.ts'],
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
};