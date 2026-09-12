type MonetizationOptionType = 'DIRECT_PAYMENT' | 'VIDEO_ENGAGEMENT' | 'TOKEN_REDEMPTION';
interface DirectPaymentConfig {
    type: 'DIRECT_PAYMENT';
    price: number;
    productId?: string;
    label?: string;
    description?: string;
}
interface VideoEngagementConfig {
    type: 'VIDEO_ENGAGEMENT';
    requiredVideos: number;
    creditsPerWatch: number;
    label?: string;
    description?: string;
}
interface TokenRedemptionConfig {
    type: 'TOKEN_REDEMPTION';
    tokensRequired: number;
    label?: string;
    description?: string;
}
type MonetizationOption = DirectPaymentConfig | VideoEngagementConfig | TokenRedemptionConfig;
interface DigitPopTheme {
    primaryColor?: string;
    accentColor?: string;
    darkMode?: boolean;
    fontFamily?: string;
}
interface DigitPopConfig {
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
interface AccessGrantedEvent {
    accessType: MonetizationOptionType;
    creditsEarned?: number;
    tokensSpent?: number;
    transactionId: string;
    timestamp: string;
    userId: string;
}
interface RewardCreditEvent {
    credits: number;
    totalEarnedCredits: number;
    transactionId: string;
    timestamp: string;
}
interface OpenGatewayOptions {
    assetId?: string;
    title?: string;
    monetizationOptions?: MonetizationOption[];
    onAccessGranted?: (event: AccessGrantedEvent) => void;
    onCreditEarned?: (reward: RewardCreditEvent) => void;
    onDirectCheckout?: (checkout: {
        price: number;
        productId?: string;
    }) => void;
    onClose?: () => void;
    onError?: (error: Error) => void;
}
interface WalletBalance {
    earnedCredits: number;
    availableCredits: number;
    attentionCredits: number;
    popCoins: number;
    isCandidateAccount: boolean;
}
interface PublisherVerification {
    id: string;
    appName: string;
    status: 'ACTIVE' | 'INACTIVE';
    cpmShareRate: number;
}
interface AttentionChallengeQuiz {
    id: string;
    questionText: string;
    options: string[];
    bonusTokens: number;
}
interface AttentionChallengeStartResponse {
    success: boolean;
    challengeToken: string;
    durationSeconds: number;
    startedAt: number;
    quiz: AttentionChallengeQuiz;
    code?: string;
    message?: string;
    remainingSeconds?: number;
}
interface AttentionChallengeVerifyResponse {
    success: boolean;
    verified: boolean;
    creditsEarned: number;
    totalEarnedCredits: number;
    durationVerifiedSeconds: number;
    publisherEarningsNetUsd: number;
    message: string;
    code?: string;
}

declare class ApiClient {
    private config;
    private baseUrl;
    constructor(config: DigitPopConfig);
    getBaseUrl(): string;
    private resolveBaseUrl;
    /**
     * Fetch current credit and PopCoin balance for candidate/user
     */
    getWalletBalance(userId?: string): Promise<WalletBalance>;
    /**
     * Auto-provision or grant attention credit to user
     */
    grantAttentionReward(options: {
        userId: string;
        credits: number;
        videoId?: string;
    }): Promise<{
        success: boolean;
        earnedCredits: number;
    }>;
    /**
     * Redeem PopCoin tokens for an access pass
     */
    redeemTokens(options: {
        userId: string;
        tokenAmount: number;
        assetId?: string;
    }): Promise<{
        success: boolean;
        transactionId: string;
    }>;
    /**
     * Initiate a server-signed Proof of Elapsed Time (PoET) Attention Challenge
     */
    startAttentionChallenge(durationSeconds?: number): Promise<any>;
    /**
     * Submit Proof of Elapsed Time & Brand Comprehension Answer for verified reward
     */
    verifyComprehension(options: {
        challengeToken: string;
        selectedOptionIndex: number;
        clientTelemetry?: any;
    }): Promise<any>;
}

type WebSocketListener = (data: any) => void;
declare class WebSocketClient {
    private config;
    private ws;
    private listeners;
    private isConnecting;
    private reconnectTimer;
    constructor(config: DigitPopConfig);
    private resolveWsUrl;
    /**
     * Connect to DigitPop WebSocket Stream Gateway
     */
    connect(): void;
    send(data: any): void;
    subscribe(listener: WebSocketListener): () => void;
    private notifyListeners;
    disconnect(): void;
}

declare class GatewayModal {
    private client;
    private options;
    private hostElement;
    private shadowRoot;
    private currentStage;
    private watchTimer;
    private watchProgress;
    private durationSeconds;
    private elapsedSeconds;
    private isTabHidden;
    private challengeToken;
    private currentQuiz;
    private selectedQuizOption;
    private quizError;
    private rateLimitWarning;
    constructor(client: DigitPopClient, options: OpenGatewayOptions);
    render(): void;
    private handleKeyDown;
    private handleVisibilityChange;
    close(): void;
    private updateContent;
    private renderHeader;
    private renderBody;
    private renderWatchingStage;
    private renderQuizStage;
    private renderSuccessStage;
    private renderFooter;
    private bindEvents;
    private startWatching;
    private runWatchTimer;
    private submitQuizAnswer;
    private handleTokenRedemption;
    private getStyles;
}

declare class DigitPopClient {
    readonly config: DigitPopConfig;
    readonly api: ApiClient;
    readonly ws: WebSocketClient;
    private currentModal;
    constructor(config: DigitPopConfig);
    /**
     * Fetch current wallet balance (earned credits, PopCoins)
     */
    getWalletBalance(): Promise<WalletBalance>;
    /**
     * Open the Unified Access & Monetization Gateway Modal
     */
    openGateway(options?: OpenGatewayOptions): GatewayModal;
    /**
     * Close the active Gateway Modal if open
     */
    closeGateway(): void;
    /**
     * Directly grant attention reward credits to candidate
     */
    grantAttentionReward(credits?: number, videoId?: string): Promise<{
        success: boolean;
        earnedCredits: number;
    }>;
    /**
     * Directly redeem PopCoin tokens for an access pass
     */
    redeemTokens(tokenAmount?: number, assetId?: string): Promise<{
        success: boolean;
        transactionId: string;
    }>;
    /**
     * Start a Proof of Elapsed Time (PoET) Attention Challenge
     */
    startAttentionChallenge(durationSeconds?: number): Promise<any>;
    /**
     * Verify Brand Comprehension & Proof of Elapsed Time
     */
    verifyComprehension(options: {
        challengeToken: string;
        selectedOptionIndex: number;
        clientTelemetry?: any;
    }): Promise<any>;
    /**
     * Cleanup SDK resources and open sockets
     */
    destroy(): void;
}

export { type AccessGrantedEvent as A, type DigitPopConfig as D, GatewayModal as G, type MonetizationOption as M, type OpenGatewayOptions as O, type PublisherVerification as P, type RewardCreditEvent as R, type TokenRedemptionConfig as T, type VideoEngagementConfig as V, type WalletBalance as W, DigitPopClient as a, ApiClient as b, type AttentionChallengeQuiz as c, type AttentionChallengeStartResponse as d, type AttentionChallengeVerifyResponse as e, type DigitPopTheme as f, type DirectPaymentConfig as g, type MonetizationOptionType as h, WebSocketClient as i };
