import { D as DigitPopConfig, a as DigitPopClient } from './DigitPopClient-DIASkMHd.mjs';
export { A as AccessGrantedEvent, b as ApiClient, c as AttentionChallengeQuiz, d as AttentionChallengeStartResponse, e as AttentionChallengeVerifyResponse, f as DigitPopTheme, g as DirectPaymentConfig, G as GatewayModal, M as MonetizationOption, h as MonetizationOptionType, O as OpenGatewayOptions, P as PublisherVerification, R as RewardCreditEvent, T as TokenRedemptionConfig, V as VideoEngagementConfig, W as WalletBalance, i as WebSocketClient } from './DigitPopClient-DIASkMHd.mjs';

/**
 * Convenient factory function to instantiate and initialize the DigitPop SDK
 */
declare function createDigitPop(config: DigitPopConfig): DigitPopClient;

export { DigitPopClient, DigitPopConfig, createDigitPop, DigitPopClient as default };
