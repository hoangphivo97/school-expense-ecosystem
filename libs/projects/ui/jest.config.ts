export default {
  displayName: 'projects-ui',
  preset: '../../../jest.preset.js',
  coverageDirectory: '../../../coverage/libs/projects/ui',
  transform: {
    '^.+\\.(ts|mjs|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
      },
    ],
  },
  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$|@ngneat|flat)'],
  moduleFileExtensions: ['ts', 'js', 'html', 'mjs'],
  setupFilesAfterEnv: ['<rootDir>/../../../apps/mfe-shell-angular/setup-jest.ts'],
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
};
