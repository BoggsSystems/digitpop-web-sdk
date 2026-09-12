import { AccessGrantedEvent, OpenGatewayOptions } from '../types';
import type { DigitPopClient } from '../core/DigitPopClient';

export class GatewayModal {
  private client: DigitPopClient;
  private options: OpenGatewayOptions;
  private hostElement: HTMLElement | null = null;
  private shadowRoot: ShadowRoot | null = null;
  private currentStage: 'SELECTION' | 'WATCHING' | 'QUIZ' | 'SUCCESS' = 'SELECTION';
  private watchTimer: any = null;
  private watchProgress: number = 0;
  private durationSeconds: number = 30;
  private elapsedSeconds: number = 0;
  private isTabHidden: boolean = false;
  private challengeToken: string | null = null;
  private currentQuiz: any = null;
  private selectedQuizOption: number | null = null;
  private quizError: string | null = null;
  private rateLimitWarning: string | null = null;

  constructor(client: DigitPopClient, options: OpenGatewayOptions) {
    this.client = client;
    this.options = options;
  }

  public render(): void {
    if (typeof document === 'undefined') return;

    this.close(); // Clean up existing if any

    this.hostElement = document.createElement('div');
    this.hostElement.id = 'digitpop-gateway-root';
    this.shadowRoot = this.hostElement.attachShadow({ mode: 'open' });

    document.body.appendChild(this.hostElement);
    this.updateContent();

    // Attach Event Listeners
    window.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      this.close();
    }
    // Keyboard navigation in Quiz stage
    if (this.currentStage === 'QUIZ' && this.currentQuiz?.options) {
      const optionCount = this.currentQuiz.options.length;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        this.selectedQuizOption = this.selectedQuizOption === null ? 0 : (this.selectedQuizOption + 1) % optionCount;
        this.quizError = null;
        this.updateContent();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        this.selectedQuizOption = this.selectedQuizOption === null ? optionCount - 1 : (this.selectedQuizOption - 1 + optionCount) % optionCount;
        this.quizError = null;
        this.updateContent();
      } else if (e.key === 'Enter' && this.selectedQuizOption !== null) {
        e.preventDefault();
        this.submitQuizAnswer();
      }
    }
  };

  private handleVisibilityChange = () => {
    if (typeof document === 'undefined') return;
    this.isTabHidden = document.hidden;
    if (this.currentStage === 'WATCHING') {
      const statusElem = this.shadowRoot?.getElementById('watch-instruction');
      if (statusElem) {
        if (document.hidden) {
          statusElem.innerHTML = '<span style="color: #ef4444; font-weight: 600;">⚠️ Stream Paused:</span> Return to this tab to continue verifying proof of attention.';
        } else {
          statusElem.innerText = 'Please keep this tab focused to verify proof-of-attention credits.';
        }
      }
    }
  };

  public close(): void {
    if (this.watchTimer) {
      clearInterval(this.watchTimer);
      this.watchTimer = null;
    }
    window.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);

    if (this.hostElement && this.hostElement.parentNode) {
      this.hostElement.parentNode.removeChild(this.hostElement);
    }
    this.hostElement = null;
    this.shadowRoot = null;
    if (this.options.onClose) {
      this.options.onClose();
    }
  }

  private updateContent(): void {
    if (!this.shadowRoot) return;
    this.shadowRoot.innerHTML = `
      <style>
        ${this.getStyles()}
      </style>
      <div class="dp-backdrop" id="backdrop">
        <div class="dp-modal" role="dialog" aria-modal="true" aria-labelledby="dp-modal-title">
          <button class="dp-close" id="btn-close" aria-label="Close dialog">&times;</button>
          
          ${this.renderHeader()}
          ${this.renderBody()}
          ${this.renderFooter()}
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private renderHeader(): string {
    if (this.currentStage === 'QUIZ') {
      return `
        <div class="dp-header">
          <div class="dp-badge dp-badge-gold">
            <span class="dp-icon-shield">🛡️</span> Cost-Per-Comprehension Gate
          </div>
          <h2 class="dp-title" id="dp-modal-title">Verify Brand Takeaway</h2>
          <p class="dp-subtitle">Answer the sponsor comprehension check to unlock your candidate application pass.</p>
        </div>
      `;
    }

    if (this.currentStage === 'WATCHING') {
      return `
        <div class="dp-header">
          <div class="dp-badge dp-badge-cyan">
            <span class="dp-pulsing-dot-inline"></span> Proof of Elapsed Time Active
          </div>
          <h2 class="dp-title" id="dp-modal-title">Interactive Sponsor Experience</h2>
          <p class="dp-subtitle">Sponsored by Tier-1 Enterprise Brands to unlock full Opportunity OS tools</p>
        </div>
      `;
    }

    return `
      <div class="dp-header">
        <div class="dp-badge dp-badge-cyan">DigitPop Attention Clearinghouse</div>
        <h2 class="dp-title" id="dp-modal-title">${this.options.title || 'Unlock Full System Access'}</h2>
        <p class="dp-subtitle">Select how you want to unlock candidate opportunities & AI tools</p>
      </div>
    `;
  }

  private renderBody(): string {
    if (this.currentStage === 'WATCHING') {
      return this.renderWatchingStage();
    }
    if (this.currentStage === 'QUIZ') {
      return this.renderQuizStage();
    }
    if (this.currentStage === 'SUCCESS') {
      return this.renderSuccessStage();
    }

    return `
      ${this.rateLimitWarning ? `<div class="dp-alert-warning">${this.rateLimitWarning}</div>` : ''}
      <div class="dp-options-grid">
        <!-- Option 1: Direct Payment -->
        <div class="dp-card dp-card-payment" id="opt-payment">
          <div class="dp-card-tag">Instant Pass</div>
          <div class="dp-card-icon">💳</div>
          <h3 class="dp-card-title">1-Click Pass</h3>
          <div class="dp-card-price">$49.00<span class="dp-price-period">/mo</span></div>
          <p class="dp-card-desc">Zero ads. Immediate access to all vetted job applications and operator tools.</p>
          <button class="dp-button dp-btn-emerald" id="btn-buy-pass">Checkout with Card</button>
        </div>

        <!-- Option 2: Watch to Earn -->
        <div class="dp-card dp-card-watch dp-card-featured" id="opt-watch">
          <div class="dp-card-tag dp-tag-featured">Most Popular</div>
          <div class="dp-card-icon">📺</div>
          <h3 class="dp-card-title">Watch to Earn</h3>
          <div class="dp-card-price">100% Free<span class="dp-price-period">/ 30s Stream</span></div>
          <p class="dp-card-desc">Watch an interactive enterprise sponsor masterclass to earn instant credits & unlock access.</p>
          <button class="dp-button dp-btn-blue" id="btn-start-watch">Watch Clip & Verify (Free)</button>
        </div>

        <!-- Option 3: Token Redemption -->
        <div class="dp-card dp-card-token" id="opt-token">
          <div class="dp-card-tag">Token Vault</div>
          <div class="dp-card-icon">🪙</div>
          <h3 class="dp-card-title">PopCoin Vault</h3>
          <div class="dp-card-price">50 Tokens<span class="dp-price-period">/ Pass</span></div>
          <p class="dp-card-desc">Redeem earned PopCoin tokens from your DigitPop universal attention wallet.</p>
          <button class="dp-button dp-btn-purple" id="btn-redeem-tokens">Redeem Tokens</button>
        </div>
      </div>
    `;
  }

  private renderWatchingStage(): string {
    const remaining = Math.max(0, Math.ceil(this.durationSeconds - this.elapsedSeconds));
    return `
      <div class="dp-watch-container">
        <div class="dp-watch-header">
          <div class="dp-watch-meta">
            <span class="dp-stream-tag">LIVE STREAM</span>
            <span class="dp-sponsor-name">AWS Cloud & Graviton4</span>
          </div>
          <span class="dp-watch-counter" id="timer-label">${remaining}s remaining</span>
        </div>
        <div class="dp-video-screen">
          <div class="dp-video-top-bar">
            <div class="dp-video-status">
              <span class="dp-pulsing-dot"></span>
              <span>Proof-of-Elapsed-Time Monitored</span>
            </div>
            <div class="dp-video-cert">🔒 SOC2 Vetted Supply</div>
          </div>
          
          <div class="dp-sim-video">
            <div class="dp-brand-logo-pill">ENTERPRISE PARTNER SPONSOR</div>
            <div class="dp-ad-title">AWS Graviton4 Next-Generation Cloud Compute</div>
            <p class="dp-ad-tagline">Discover up to 40% better price-performance for cloud native architectures</p>
            
            <div class="dp-progress-bar-container">
              <div class="dp-progress-bar-fill" id="progress-bar" style="width: ${this.watchProgress}%;"></div>
            </div>
          </div>

          <div class="dp-video-bottom-bar">
            <span>Single-Stream Concurrency Active</span>
            <span>Zero-Skip Stream</span>
          </div>
        </div>
        <p class="dp-watch-instruction" id="watch-instruction">Please keep this tab focused to verify proof-of-attention credits.</p>
      </div>
    `;
  }

  private renderQuizStage(): string {
    const quiz = this.currentQuiz || {
      questionText: 'What is the primary benefit of AWS Graviton processors for cloud workloads?',
      options: [
        'Up to 40% better price-performance over comparable x86 processors',
        'Manual server patching required every week',
        'Higher energy consumption in data centers',
        'Incompatibility with Linux environments'
      ]
    };

    return `
      <div class="dp-quiz-container">
        ${this.quizError ? `<div class="dp-alert-error">${this.quizError}</div>` : ''}
        <div class="dp-quiz-card">
          <div class="dp-quiz-banner">
            <span>SPONSOR ATTENTION CHECK</span>
            <span>+20 GrowthCredits</span>
          </div>
          <h3 class="dp-quiz-question">${quiz.questionText}</h3>
          
          <div class="dp-quiz-options" role="radiogroup" aria-label="Quiz Options">
            ${quiz.options.map((opt: string, idx: number) => `
              <div 
                class="dp-quiz-option ${this.selectedQuizOption === idx ? 'dp-quiz-option-selected' : ''}" 
                data-index="${idx}"
                role="radio"
                tabindex="0"
                aria-checked="${this.selectedQuizOption === idx ? 'true' : 'false'}"
              >
                <span class="dp-quiz-bullet">${String.fromCharCode(65 + idx)}</span>
                <span class="dp-quiz-text">${opt}</span>
                <span class="dp-quiz-radio-indicator"></span>
              </div>
            `).join('')}
          </div>

          <button 
            class="dp-button dp-btn-emerald dp-btn-large" 
            id="btn-submit-quiz" 
            ${this.selectedQuizOption === null ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}
          >
            Verify Comprehension & Claim Credits
          </button>
        </div>
      </div>
    `;
  }

  private renderSuccessStage(): string {
    return `
      <div class="dp-success-container">
        <div class="dp-success-glow">
          <div class="dp-success-icon">🎉</div>
        </div>
        <h3 class="dp-success-title">Comprehension Verified!</h3>
        <p class="dp-success-desc">
          Your attention credits have been certified by the DigitPop clearinghouse and deposited into your Opportunity OS candidate account.
        </p>
        <div class="dp-success-reward-pill">
          <span class="dp-reward-val">+20</span> Opportunity OS Application Credits
        </div>
        <button class="dp-button dp-btn-emerald dp-btn-large" id="btn-success-continue">Continue to Opportunity OS</button>
      </div>
    `;
  }

  private renderFooter(): string {
    return `
      <div class="dp-footer">
        <span class="dp-footer-left">
          <span>Powered by </span>
          <strong style="color: #38bdf8;">DigitPop Proof-of-Attention Clearinghouse</strong>
        </span>
        <span class="dp-footer-right">
          <span>🔒 Vetted Corporate Consortium</span>
          <span>•</span>
          <span>Zero-Fraud SLA</span>
        </span>
      </div>
    `;
  }

  private bindEvents(): void {
    if (!this.shadowRoot) return;

    const backdrop = this.shadowRoot.getElementById('backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) this.close();
      });
    }

    const btnClose = this.shadowRoot.getElementById('btn-close');
    if (btnClose) {
      btnClose.addEventListener('click', () => this.close());
    }

    const btnBuy = this.shadowRoot.getElementById('btn-buy-pass');
    if (btnBuy) {
      btnBuy.addEventListener('click', () => {
        if (this.options.onDirectCheckout) {
          this.options.onDirectCheckout({ price: 49.0, productId: 'prod_opportunity_os_pro' });
        }
        this.close();
      });
    }

    const btnWatch = this.shadowRoot.getElementById('btn-start-watch');
    if (btnWatch) {
      btnWatch.addEventListener('click', () => this.startWatching());
    }

    const btnRedeem = this.shadowRoot.getElementById('btn-redeem-tokens');
    if (btnRedeem) {
      btnRedeem.addEventListener('click', () => this.handleTokenRedemption());
    }

    const btnSuccess = this.shadowRoot.getElementById('btn-success-continue');
    if (btnSuccess) {
      btnSuccess.addEventListener('click', () => this.close());
    }

    // Quiz Options Selection
    const optionCards = this.shadowRoot.querySelectorAll('.dp-quiz-option');
    optionCards.forEach((card) => {
      card.addEventListener('click', () => {
        const idx = parseInt(card.getAttribute('data-index') || '0', 10);
        this.selectedQuizOption = idx;
        this.quizError = null;
        this.updateContent();
      });
      card.addEventListener('keydown', (e: any) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          const idx = parseInt(card.getAttribute('data-index') || '0', 10);
          this.selectedQuizOption = idx;
          this.quizError = null;
          this.updateContent();
        }
      });
    });

    const btnSubmitQuiz = this.shadowRoot.getElementById('btn-submit-quiz');
    if (btnSubmitQuiz) {
      btnSubmitQuiz.addEventListener('click', () => this.submitQuizAnswer());
    }
  }

  private async startWatching(): Promise<void> {
    try {
      this.rateLimitWarning = null;
      this.client.ws.connect();

      // Initiate server PoET challenge
      const challenge = await this.client.startAttentionChallenge();
      this.challengeToken = challenge.challengeToken;
      this.currentQuiz = challenge.quiz;
      this.durationSeconds = challenge.durationSeconds || 15;
      this.elapsedSeconds = 0;
      this.watchProgress = 0;
      this.selectedQuizOption = null;
      this.quizError = null;

      this.currentStage = 'WATCHING';
      this.updateContent();

      this.runWatchTimer();
    } catch (err: any) {
      if (err.code === 'ACTIVE_ATTENTION_STREAM_IN_PROGRESS') {
        this.rateLimitWarning = `⚠️ Concurrency Lock: Active attention stream in progress (${err.remainingSeconds || 15}s remaining). Please finish it before opening another.`;
      } else {
        this.rateLimitWarning = `⚠️ ${err.message || 'Failed to initiate attention challenge.'}`;
      }
      this.updateContent();
    }
  }

  private runWatchTimer(): void {
    if (this.watchTimer) clearInterval(this.watchTimer);

    this.watchTimer = setInterval(() => {
      if (this.isTabHidden) {
        return; // Halt progress while blurred
      }

      this.elapsedSeconds += 0.5;
      this.watchProgress = Math.min(100, Math.round((this.elapsedSeconds / this.durationSeconds) * 100));

      if (this.shadowRoot) {
        const bar = this.shadowRoot.getElementById('progress-bar');
        if (bar) bar.style.width = `${this.watchProgress}%`;

        const timerLabel = this.shadowRoot.getElementById('timer-label');
        if (timerLabel) {
          const remaining = Math.max(0, Math.ceil(this.durationSeconds - this.elapsedSeconds));
          timerLabel.innerText = `${remaining}s remaining`;
        }
      }

      if (this.elapsedSeconds >= this.durationSeconds) {
        clearInterval(this.watchTimer);
        this.watchTimer = null;
        this.currentStage = 'QUIZ';
        this.updateContent();
      }
    }, 500);
  }

  private async submitQuizAnswer(): Promise<void> {
    if (this.selectedQuizOption === null || !this.challengeToken) return;

    try {
      const res = await this.client.verifyComprehension({
        challengeToken: this.challengeToken,
        selectedOptionIndex: this.selectedQuizOption,
        clientTelemetry: {
          tabHiddenCount: 0,
          elapsedSeconds: this.elapsedSeconds,
        },
      });

      if (res.verified) {
        if (this.options.onCreditEarned) {
          this.options.onCreditEarned({
            credits: res.creditsEarned,
            totalEarnedCredits: res.totalEarnedCredits,
            transactionId: `tx_poet_${Date.now()}`,
            timestamp: new Date().toISOString(),
          });
        }

        this.currentStage = 'SUCCESS';
        this.updateContent();

        if (this.options.onAccessGranted) {
          this.options.onAccessGranted({
            accessType: 'VIDEO_ENGAGEMENT',
            creditsEarned: res.creditsEarned,
            transactionId: `tx_access_${Date.now()}`,
            timestamp: new Date().toISOString(),
            userId: this.client.config.userId,
          });
        }
      }
    } catch (err: any) {
      this.quizError = err.message || 'Comprehension check failed.';
      this.updateContent();
    }
  }

  private async handleTokenRedemption(): Promise<void> {
    try {
      const res = await this.client.redeemTokens(50, this.options.assetId);
      this.currentStage = 'SUCCESS';
      this.updateContent();

      const event: AccessGrantedEvent = {
        accessType: 'TOKEN_REDEMPTION',
        tokensSpent: 50,
        transactionId: res.transactionId,
        timestamp: new Date().toISOString(),
        userId: this.client.config.userId,
      };

      if (this.options.onAccessGranted) {
        this.options.onAccessGranted(event);
      }
    } catch (err: any) {
      alert(`Redemption Notice: ${err.message || 'Insufficient PopCoin balance'}`);
    }
  }

  private getStyles(): string {
    return `
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }
      .dp-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(4, 8, 16, 0.88);
        backdrop-filter: blur(16px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
        padding: 20px;
      }
      .dp-modal {
        position: relative;
        background: linear-gradient(145deg, #0d1322, #070a12);
        border: 1px solid rgba(56, 189, 248, 0.18);
        border-radius: 24px;
        width: 100%;
        max-width: 840px;
        padding: 36px 40px;
        color: #f3f4f6;
        box-shadow: 0 30px 70px -15px rgba(0, 0, 0, 0.85), 0 0 50px -10px rgba(56, 189, 248, 0.12);
        animation: dp-fade-in 0.28s cubic-bezier(0.16, 1, 0.3, 1);
      }
      @keyframes dp-fade-in {
        from { opacity: 0; transform: scale(0.95) translateY(12px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
      }
      .dp-close {
        position: absolute;
        top: 20px;
        right: 24px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 50%;
        width: 32px;
        height: 32px;
        color: #9ca3af;
        font-size: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        line-height: 1;
        transition: all 0.15s ease;
      }
      .dp-close:hover {
        background: rgba(255, 255, 255, 0.15);
        color: #fff;
        transform: rotate(90deg);
      }
      .dp-header {
        text-align: center;
        margin-bottom: 28px;
      }
      .dp-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-weight: 700;
        padding: 5px 12px;
        border-radius: 9999px;
        margin-bottom: 10px;
      }
      .dp-badge-cyan {
        color: #38bdf8;
        background: rgba(56, 189, 248, 0.12);
        border: 1px solid rgba(56, 189, 248, 0.25);
      }
      .dp-badge-gold {
        color: #fbbf24;
        background: rgba(251, 191, 36, 0.12);
        border: 1px solid rgba(251, 191, 36, 0.25);
      }
      .dp-title {
        font-size: 26px;
        font-weight: 800;
        letter-spacing: -0.025em;
        color: #ffffff;
        margin-bottom: 8px;
      }
      .dp-subtitle {
        font-size: 14px;
        color: #94a3b8;
        max-width: 580px;
        margin: 0 auto;
        line-height: 1.5;
      }
      .dp-alert-warning {
        background: rgba(245, 158, 11, 0.12);
        border: 1px solid rgba(245, 158, 11, 0.3);
        color: #fbbf24;
        padding: 12px 16px;
        border-radius: 12px;
        font-size: 13px;
        margin-bottom: 20px;
      }
      .dp-alert-error {
        background: rgba(239, 68, 68, 0.12);
        border: 1px solid rgba(239, 68, 68, 0.3);
        color: #f87171;
        padding: 12px 16px;
        border-radius: 12px;
        font-size: 13px;
        margin-bottom: 20px;
      }
      .dp-options-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 18px;
        margin-bottom: 28px;
      }
      .dp-card {
        background: rgba(15, 23, 42, 0.65);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        padding: 24px;
        display: flex;
        flex-direction: column;
        position: relative;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .dp-card:hover {
        transform: translateY(-3px);
        border-color: rgba(56, 189, 248, 0.35);
        box-shadow: 0 12px 24px -6px rgba(0, 0, 0, 0.5);
      }
      .dp-card-featured {
        background: linear-gradient(180deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.8));
        border-color: rgba(56, 189, 248, 0.3);
      }
      .dp-card-tag {
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        color: #94a3b8;
        margin-bottom: 14px;
      }
      .dp-tag-featured {
        color: #38bdf8;
      }
      .dp-card-icon {
        font-size: 32px;
        margin-bottom: 12px;
      }
      .dp-card-title {
        font-size: 17px;
        font-weight: 700;
        color: #fff;
        margin-bottom: 8px;
      }
      .dp-card-price {
        font-size: 22px;
        font-weight: 800;
        color: #fff;
        margin-bottom: 10px;
      }
      .dp-price-period {
        font-size: 12px;
        font-weight: 500;
        color: #94a3b8;
        margin-left: 4px;
      }
      .dp-card-desc {
        font-size: 12px;
        color: #94a3b8;
        line-height: 1.5;
        margin-bottom: 20px;
        flex-grow: 1;
      }
      .dp-button {
        width: 100%;
        padding: 12px 18px;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        border: none;
        transition: all 0.15s ease;
      }
      .dp-btn-large {
        padding: 14px 20px;
        font-size: 14px;
      }
      .dp-button:hover:not(:disabled) {
        filter: brightness(1.12);
        transform: translateY(-1px);
      }
      .dp-btn-emerald {
        background: linear-gradient(90deg, #10b981, #059669);
        color: #fff;
        box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
      }
      .dp-btn-blue {
        background: linear-gradient(90deg, #2563eb, #38bdf8);
        color: #fff;
        box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
      }
      .dp-btn-purple {
        background: linear-gradient(90deg, #7c3aed, #9333ea);
        color: #fff;
      }
      .dp-watch-container {
        padding: 8px 12px;
        text-align: center;
      }
      .dp-watch-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 14px;
      }
      .dp-watch-meta {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .dp-stream-tag {
        font-size: 10px;
        font-weight: 800;
        color: #ef4444;
        background: rgba(239, 68, 68, 0.15);
        border: 1px solid rgba(239, 68, 68, 0.3);
        padding: 2px 8px;
        border-radius: 4px;
        letter-spacing: 0.05em;
      }
      .dp-sponsor-name {
        font-size: 13px;
        font-weight: 600;
        color: #e2e8f0;
      }
      .dp-watch-counter {
        font-size: 13px;
        font-weight: 700;
        color: #38bdf8;
      }
      .dp-video-screen {
        background: #02040a;
        border: 1px solid rgba(56, 189, 248, 0.2);
        border-radius: 16px;
        min-height: 260px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 20px;
        position: relative;
        overflow: hidden;
      }
      .dp-video-top-bar, .dp-video-bottom-bar {
        display: flex;
        justify-content: space-between;
        font-size: 11px;
        color: #64748b;
      }
      .dp-video-status {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #34d399;
        font-weight: 600;
      }
      .dp-pulsing-dot {
        width: 8px;
        height: 8px;
        background: #10b981;
        border-radius: 50%;
        box-shadow: 0 0 10px #10b981;
        animation: dp-pulse 1.5s infinite;
      }
      .dp-pulsing-dot-inline {
        display: inline-block;
        width: 6px;
        height: 6px;
        background: #38bdf8;
        border-radius: 50%;
        animation: dp-pulse 1.5s infinite;
      }
      @keyframes dp-pulse {
        0% { transform: scale(0.9); opacity: 0.6; }
        50% { transform: scale(1.3); opacity: 1; }
        100% { transform: scale(0.9); opacity: 0.6; }
      }
      .dp-brand-logo-pill {
        display: inline-block;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.08em;
        color: #94a3b8;
        background: rgba(255, 255, 255, 0.06);
        padding: 4px 10px;
        border-radius: 999px;
        margin-top: 16px;
      }
      .dp-ad-title {
        font-size: 20px;
        font-weight: 800;
        color: #ffffff;
        margin-top: 12px;
        margin-bottom: 6px;
        letter-spacing: -0.01em;
      }
      .dp-ad-tagline {
        font-size: 13px;
        color: #94a3b8;
        margin-bottom: 24px;
      }
      .dp-progress-bar-container {
        width: 100%;
        height: 8px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 999px;
        overflow: hidden;
      }
      .dp-progress-bar-fill {
        height: 100%;
        background: linear-gradient(90deg, #2563eb, #38bdf8, #10b981);
        transition: width 0.35s ease;
      }
      .dp-watch-instruction {
        margin-top: 14px;
        font-size: 13px;
        color: #64748b;
      }
      .dp-quiz-container {
        padding: 8px 12px 16px;
      }
      .dp-quiz-card {
        background: rgba(15, 23, 42, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 18px;
        padding: 28px;
      }
      .dp-quiz-banner {
        display: flex;
        justify-content: space-between;
        font-size: 11px;
        font-weight: 700;
        color: #fbbf24;
        margin-bottom: 14px;
        letter-spacing: 0.05em;
      }
      .dp-quiz-question {
        font-size: 17px;
        font-weight: 700;
        color: #fff;
        margin-bottom: 22px;
        line-height: 1.45;
      }
      .dp-quiz-options {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 24px;
      }
      .dp-quiz-option {
        display: flex;
        align-items: center;
        gap: 14px;
        background: rgba(30, 41, 59, 0.55);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        padding: 14px 18px;
        cursor: pointer;
        transition: all 0.18s ease;
      }
      .dp-quiz-option:hover {
        background: rgba(30, 41, 59, 0.85);
        border-color: rgba(56, 189, 248, 0.3);
      }
      .dp-quiz-option-selected {
        background: rgba(37, 99, 235, 0.22) !important;
        border-color: #38bdf8 !important;
        box-shadow: 0 0 16px -3px rgba(56, 189, 248, 0.35);
      }
      .dp-quiz-bullet {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.08);
        font-size: 12px;
        font-weight: 800;
        color: #cbd5e1;
      }
      .dp-quiz-option-selected .dp-quiz-bullet {
        background: #2563eb;
        color: #fff;
      }
      .dp-quiz-text {
        font-size: 13.5px;
        color: #e2e8f0;
        flex-grow: 1;
        line-height: 1.4;
      }
      .dp-quiz-radio-indicator {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        border: 2px solid rgba(255, 255, 255, 0.2);
        display: inline-block;
      }
      .dp-quiz-option-selected .dp-quiz-radio-indicator {
        border-color: #38bdf8;
        background: radial-gradient(circle, #38bdf8 45%, transparent 50%);
      }
      .dp-success-container {
        text-align: center;
        padding: 40px 20px;
      }
      .dp-success-glow {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 84px;
        height: 84px;
        border-radius: 50%;
        background: rgba(16, 185, 129, 0.12);
        border: 1px solid rgba(16, 185, 129, 0.3);
        margin-bottom: 18px;
        box-shadow: 0 0 30px rgba(16, 185, 129, 0.25);
      }
      .dp-success-icon {
        font-size: 40px;
      }
      .dp-success-title {
        font-size: 24px;
        font-weight: 800;
        color: #34d399;
        margin-bottom: 10px;
      }
      .dp-success-desc {
        font-size: 14px;
        color: #94a3b8;
        max-width: 480px;
        margin: 0 auto 24px;
        line-height: 1.5;
      }
      .dp-success-reward-pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: rgba(16, 185, 129, 0.1);
        border: 1px solid rgba(16, 185, 129, 0.25);
        color: #e2e8f0;
        font-size: 13px;
        font-weight: 600;
        padding: 8px 18px;
        border-radius: 999px;
        margin-bottom: 28px;
      }
      .dp-reward-val {
        color: #34d399;
        font-weight: 800;
      }
      .dp-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 11px;
        color: #64748b;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        padding-top: 20px;
      }
      .dp-footer-right {
        display: flex;
        gap: 8px;
      }
    `;
  }
}
