import { ModuleFederationConfig } from '@nx/module-federation';

const config: ModuleFederationConfig = {
  name: 'mfe-shell-angular',
  remotes: [
    ['mfe-remote-react', 'http://localhost:5000/remoteEntry.js'], // Khai báo trực tiếp tại đây
  ],
  shared: (libraryName, defaultConfig) => {
     // Loại trừ các thư viện UI/Features khỏi việc bị tự động share
     if (libraryName.startsWith('@school-expense-ecosystem/')) {
         return false; 
     }
     return defaultConfig;
  }
};

export default config;
