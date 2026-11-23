export default {
  displayName: 'auth-features',
  preset: '../../../jest.preset.js',
  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$|@jsverse|@ngneat|flat)'],
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
  coverageDirectory: '../../../coverage/libs/auth/features',
  setupFilesAfterEnv: ['<rootDir>/../../../apps/mfe-shell-angular/setup-jest.ts'],
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  testPathIgnorePatterns: ['register-modal'],
};