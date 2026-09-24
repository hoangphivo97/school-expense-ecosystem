export default {
  displayName: 'projects-features',
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
  coverageDirectory: '../../../coverage/libs/projects/features',
  setupFilesAfterEnv: ['<rootDir>/../../../apps/mfe-shell-angular/setup-jest.ts'],
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
};