import { DigitPopConfig, PublisherVerification, WalletBalance } from '../types';

export class ApiClient {
  private config: DigitPopConfig;
  private baseUrl: string;

  constructor(config: DigitPopConfig) {
    this.config = config;
    this.baseUrl = this.resolveBaseUrl();
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  private resolveBaseUrl(): string {
    if (this.config.apiUrl) {
      return this.config.apiUrl.replace(/\/+$/, '');
    }
    if (this.config.environment === 'staging') {
      return 'https://digitpop-server-staging.up.railway.app';
    }
    return 'https://digitpop-server-staging.up.railway.app'; // Default to verified staging cloud
  }

  /**
   * Fetch current credit and PopCoin balance for candidate/user
   */
  async getWalletBalance(userId?: string): Promise<WalletBalance> {
    const targetUser = userId || this.config.userId;
    try {
      const url = `${this.baseUrl}/api/engagement/user/${encodeURIComponent(targetUser)}`;
      const res = await fetch(url, {
        headers: {
          'X-DigitPop-Publisher-Key': this.config.publicKey,
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch wallet balance (HTTP ${res.status})`);
      }

      const data = await res.json();
      const credits = data.user?.earnedCredits ?? data.earnedCredits ?? 0;
      return {
        earnedCredits: credits,
        availableCredits: credits,
        attentionCredits: credits,
        popCoins: Math.floor(credits * 10),
        isCandidateAccount: true,
      };
    } catch (err: any) {
      console.warn('[DigitPop SDK] Failed to query wallet balance, returning fallback zero:', err.message);
      return {
        earnedCredits: 0,
        availableCredits: 0,
        attentionCredits: 0,
        popCoins: 0,
        isCandidateAccount: true,
      };
    }
  }

  /**
   * Auto-provision or grant attention credit to user
   */
  async grantAttentionReward(options: {
    userId: string;
    credits: number;
    videoId?: string;
  }): Promise<{ success: boolean; earnedCredits: number }> {
    const res = await fetch(`${this.baseUrl}/api/engagement/grant-credit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-DigitPop-Publisher-Key': this.config.publicKey,
      },
      body: JSON.stringify({
        userId: options.userId,
        userEmail: this.config.userMetadata?.email,
        candidateName: this.config.userMetadata?.fullName,
        credits: options.credits,
        publisherKey: this.config.publicKey,
        videoId: options.videoId,
        engagementType: 'VIDEO_WATCH',
        watchTimeSeconds: 30.0,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to grant credit (HTTP ${res.status})`);
    }

    const data = await res.json();
    return {
      success: true,
      earnedCredits: data.totalEarnedCredits ?? data.data?.earnedCredits ?? options.credits,
    };
  }

  /**
   * Redeem PopCoin tokens for an access pass
   */
  async redeemTokens(options: {
    userId: string;
    tokenAmount: number;
    assetId?: string;
  }): Promise<{ success: boolean; transactionId: string }> {
    const res = await fetch(`${this.baseUrl}/api/redemption/purchase-with-tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-DigitPop-Publisher-Key': this.config.publicKey,
      },
      body: JSON.stringify({
        userId: options.userId,
        tokenCost: options.tokenAmount,
        productId: options.assetId,
        deliveryEmail: this.config.userMetadata?.email,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to redeem tokens (HTTP ${res.status})`);
    }

    const data = await res.json();
    return {
      success: true,
      transactionId: data.redemption?.id || data.transactionId || `tx_redeem_${Date.now()}`,
    };
  }
}
