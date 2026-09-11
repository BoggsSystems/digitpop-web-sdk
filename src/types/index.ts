export type MonetizationOptionType = 'DIRECT_PAYMENT' | 'VIDEO_ENGAGEMENT' | 'TOKEN_REDEMPTION';

export interface DirectPaymentConfig {
  type: 'DIRECT_PAYMENT';
  price: number;
  productId?: string;
  label?: string;
  description?: string;
}

export interface VideoEngagementConfig {
  type: 'VIDEO_ENGAGEMENT';
  requiredVideos: number;
  creditsPerWatch: number;
  label?: string;
  description?: string;
}

export interface TokenRedemptionConfig {
  type: 'TOKEN_REDEMPTION';
  tokensRequired: number;
  label?: string;
  description?: string;
}

export type MonetizationOption = DirectPaymentConfig | VideoEngagementConfig | TokenRedemptionConfig;

export interface DigitPopTheme {
  primaryColor?: string;
  accentColor?: string;
  darkMode?: boolean;
  fontFamily?: string;
}

export interface DigitPopConfig {
  /**
   * Publisher Public Key from DigitPop Publisher Portal (e.g. dp_pub_live_9cc2ef63ae224a66)
   */
  publicKey: string;

  /**
   * Unique identifier of the candidate or end-user
   */
  userId: string;

  /**
   * Targeting environment: 'staging' or 'production' (default: 'production')
   */
  environment?: 'staging' | 'production';

  /**
   * Optional custom backend REST API URL override
   */
  apiUrl?: string;

  /**
   * Optional custom backend WebSocket URL override
   */
  wsUrl?: string;

  /**
   * Optional user metadata for auto-provisioning
   */
  userMetadata?: {
    email?: string;
    fullName?: string;
    [key: string]: any;
  };

  /**
   * Visual theme customizations
   */
  theme?: DigitPopTheme;
}

export interface AccessGrantedEvent {
  accessType: MonetizationOptionType;
  creditsEarned?: number;
  tokensSpent?: number;
  transactionId: string;
  timestamp: string;
  userId: string;
}

export interface RewardCreditEvent {
  credits: number;
  totalEarnedCredits: number;
  transactionId: string;
  timestamp: string;
}

export interface OpenGatewayOptions {
  assetId?: string;
  title?: string;
  monetizationOptions?: MonetizationOption[];
  onAccessGranted?: (event: AccessGrantedEvent) => void;
  onCreditEarned?: (reward: RewardCreditEvent) => void;
  onDirectCheckout?: (checkout: { price: number; productId?: string }) => void;
  onClose?: () => void;
  onError?: (error: Error) => void;
}

export interface WalletBalance {
  earnedCredits: number;
  availableCredits: number;
  attentionCredits: number;
  popCoins: number;
  isCandidateAccount: boolean;
}

export interface PublisherVerification {
  id: string;
  appName: string;
  status: 'ACTIVE' | 'INACTIVE';
  cpmShareRate: number;
}
