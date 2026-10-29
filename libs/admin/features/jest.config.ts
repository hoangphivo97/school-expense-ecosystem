export default {
  displayName: 'admin-features',
  preset: '../../../jest.preset.js',
  setupFilesAfterEnv: ['<rootDir>/../../../apps/mfe-shell-angular/setup-jest.ts'],
  transform: {
    '^.+\\.(ts|mjs|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
      },
    ],
  },
  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$|@angular|@jsverse)'],
  moduleFileExtensions: ['ts', 'js', 'html', 'mjs'],
  coverageDirectory: '../../../coverage/libs/admin/features',
};