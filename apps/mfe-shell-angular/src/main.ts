import { registerRemotes } from '@module-federation/enhanced/runtime';
import { environment } from './app/environments/environment';

// Chỉ cần dòng này, Nx/Webpack sẽ tự đọc config ở Bước 1 và nạp remote trước khi bootstrap
import('./bootstrap').catch((err) => console.error(err));

registerRemotes([
  {
    name: 'mfe_remote_react',
    entry: environment.reactRemoteURL,
  },
]);