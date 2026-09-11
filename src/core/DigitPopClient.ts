import {
  AccessGrantedEvent,
  DigitPopConfig,
  MonetizationOption,
  OpenGatewayOptions,
  WalletBalance,
} from '../types';
import { ApiClient } from './ApiClient';
import { WebSocketClient } from './WebSocketClient';
import { GatewayModal } from '../ui/GatewayModal';

export class DigitPopClient {
  public readonly config: DigitPopConfig;
  public readonly api: ApiClient;
  public readonly ws: WebSocketClient;
  private currentModal: GatewayModal | null = null;

  constructor(config: DigitPopConfig) {
    if (!config || !config.publicKey) {
      throw new Error('[DigitPop SDK] A valid publicKey (e.g. dp_pub_live_...) is required to initialize.');
    }
    if (!config.userId) {
      throw new Error('[DigitPop SDK] A valid userId representing the candidate/user is required.');
    }

    this.config = {
      environment: 'production',
      ...config,
    };

    this.api = new ApiClient(this.config);
    this.ws = new WebSocketClient(this.config);
  }

  /**
   * Fetch current wallet balance (earned credits, PopCoins)
   */
  async getWalletBalance(): Promise<WalletBalance> {
    return this.api.getWalletBalance(this.config.userId);
  }

  /**
   * Open the Unified Access & Monetization Gateway Modal
   */
  openGateway(options: OpenGatewayOptions = {}): GatewayModal {
    if (this.currentModal) {
      this.currentModal.close();
      this.currentModal = null;
    }

    const defaultOptions: MonetizationOption[] = [
      {
        type: 'DIRECT_PAYMENT',
        price: 49.0,
        productId: 'prod_opportunity_os_pro',
        label: '1-Click Instant Pass',
        description: 'Instant full access for 30 days without ads or interruptions.',
      },
      {
        type: 'VIDEO_ENGAGEMENT',
        requiredVideos: 2,
        creditsPerWatch: 10,
        label: 'Watch-to-Earn (Free)',
        description: 'Watch 2 sponsored partner clips to unlock instant credits.',
      },
      {
        type: 'TOKEN_REDEMPTION',
        tokensRequired: 50,
        label: 'Redeem PopCoin Tokens',
        description: 'Exchange accumulated attention tokens for free platform passes.',
      },
    ];

    const mergedOptions: OpenGatewayOptions = {
      monetizationOptions: options.monetizationOptions || defaultOptions,
      ...options,
      onClose: () => {
        this.currentModal = null;
        if (options.onClose) options.onClose();
      },
    };

    const modal = new GatewayModal(this, mergedOptions);
    modal.render();
    this.currentModal = modal;
    return modal;
  }

  /**
   * Close the active Gateway Modal if open
   */
  closeGateway(): void {
    if (this.currentModal) {
      this.currentModal.close();
      this.currentModal = null;
    }
  }

  /**
   * Directly grant attention reward credits to candidate
   */
  async grantAttentionReward(credits: number = 10, videoId?: string) {
    return this.api.grantAttentionReward({
      userId: this.config.userId,
      credits,
      videoId,
    });
  }

  /**
   * Directly redeem PopCoin tokens for an access pass
   */
  async redeemTokens(tokenAmount: number = 50, assetId?: string) {
    return this.api.redeemTokens({
      userId: this.config.userId,
      tokenAmount,
      assetId,
    });
  }

  /**
   * Cleanup SDK resources and open sockets
   */
  destroy(): void {
    this.closeGateway();
    this.ws.disconnect();
  }
}
