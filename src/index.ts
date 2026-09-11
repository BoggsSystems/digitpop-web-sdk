import { DigitPopClient } from './core/DigitPopClient';
import { DigitPopConfig } from './types';

export { DigitPopClient } from './core/DigitPopClient';
export { ApiClient } from './core/ApiClient';
export { WebSocketClient } from './core/WebSocketClient';
export { GatewayModal } from './ui/GatewayModal';
export * from './types';

/**
 * Convenient factory function to instantiate and initialize the DigitPop SDK
 */
export function createDigitPop(config: DigitPopConfig): DigitPopClient {
  return new DigitPopClient(config);
}

// Attach to window for CDN script tag embeds
if (typeof window !== 'undefined') {
  (window as any).DigitPopSDK = {
    DigitPopClient,
    createDigitPop,
  };
}

export default DigitPopClient;
