import { registerRemotes } from '@module-federation/enhanced/runtime';
import { environment } from './app/environments/environment';

import('./bootstrap').catch((err) => console.error(err));

registerRemotes([
  {
    name: 'mfe_remote_react',
    entry: environment.reactRemoteURL,
  },
]);