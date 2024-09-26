import { Scope } from './scope.js';
import { getGlobalSingleton } from '../../../utils/build/esm/worldwide.js';

/** Get the default current scope. */
function getDefaultCurrentScope() {
  return getGlobalSingleton('defaultCurrentScope', () => new Scope());
}

/** Get the default isolation scope. */
function getDefaultIsolationScope() {
  return getGlobalSingleton('defaultIsolationScope', () => new Scope());
}

export { getDefaultCurrentScope, getDefaultIsolationScope };
