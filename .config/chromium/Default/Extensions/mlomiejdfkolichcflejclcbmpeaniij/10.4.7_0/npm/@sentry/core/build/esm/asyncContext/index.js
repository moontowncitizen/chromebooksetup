import { getSentryCarrier } from '../carrier.js';
import { getStackAsyncContextStrategy } from './stackStrategy.js';

/**
 * Get the current async context strategy.
 * If none has been setup, the default will be used.
 */
function getAsyncContextStrategy(carrier) {
  const sentry = getSentryCarrier(carrier);

  if (sentry.acs) {
    return sentry.acs;
  }

  // Otherwise, use the default one (stack)
  return getStackAsyncContextStrategy();
}

export { getAsyncContextStrategy };
