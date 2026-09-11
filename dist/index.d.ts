import { D as DigitPopConfig, a as DigitPopClient } from './DigitPopClient-0kWT_Tmt.js';
export { A as AccessGrantedEvent, b as ApiClient, c as DigitPopTheme, d as DirectPaymentConfig, G as GatewayModal, M as MonetizationOption, e as MonetizationOptionType, O as OpenGatewayOptions, P as PublisherVerification, R as RewardCreditEvent, T as TokenRedemptionConfig, V as VideoEngagementConfig, W as WalletBalance, f as WebSocketClient } from './DigitPopClient-0kWT_Tmt.js';

/**
 * Convenient factory function to instantiate and initialize the DigitPop SDK
 */
declare function createDigitPop(config: DigitPopConfig): DigitPopClient;

export { DigitPopClient, DigitPopConfig, createDigitPop, DigitPopClient as default };
