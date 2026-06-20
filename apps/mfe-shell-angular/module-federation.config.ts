import { ModuleFederationConfig } from '@nx/module-federation';

const isProd = process.env['NX_TASK_TARGET_CONFIGURATION'] === 'production';

const config: ModuleFederationConfig = {
  name: 'mfe-shell-angular',
  remotes: [
    [
      'mfe-remote-react',
      isProd
        ? 'https://expense-tracker-remote-react.web.app/remoteEntry.js'
        : 'http://localhost:5000/remoteEntry.js'
    ],
  ],
  shared: (libraryName, defaultConfig) => {
    if (libraryName.startsWith('@school-expense-ecosystem/')) {
      return false;
    }

    if (libraryName === 'firebase' || libraryName.startsWith('firebase/')) {
      return {
        ...defaultConfig,
        singleton: true,
        strictVersion: true,
        requiredVersion: '^10.14.1',
        version: '10.14.1'
      };
    }

    return defaultConfig;
  }
};

export default config;
