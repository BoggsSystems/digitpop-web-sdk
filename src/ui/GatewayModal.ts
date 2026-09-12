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
  };

  private handleVisibilityChange = () => {
    if (typeof document === 'undefined') return;
    this.isTabHidden = document.hidden;
    if (this.currentStage === 'WATCHING') {
      const statusElem = this.shadowRoot?.getElementById('watch-instruction');
      if (statusElem) {
        if (document.hidden) {
          statusElem.innerText = '⚠️ Attention paused: Return to this tab to continue verifying stream.';
          statusElem.style.color = '#f87171';
        } else {
          statusElem.innerText = 'Please keep this window active to verify proof of attention.';
          statusElem.style.color = '#94a3b8';
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
        <div class="dp-modal" role="dialog" aria-modal="true">
          <button class="dp-close" id="btn-close" aria-label="Close modal">&times;</button>
          
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
          <div class="dp-badge" style="color: #fbbf24; background: rgba(251, 191, 36, 0.12); border-color: rgba(251, 191, 36, 0.25);">
            Brand Comprehension Verification
          </div>
          <h2 class="dp-title">Verify Your Attention Takeaway</h2>
          <p class="dp-subtitle">Answer the sponsor comprehension check to unlock candidate application credits.</p>
        </div>
      `;
    }

    return `
      <div class="dp-header">
        <div class="dp-badge">DigitPop Attention Gateway</div>
        <h2 class="dp-title">${this.options.title || 'Unlock Full System Access'}</h2>
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
        <div class="dp-card dp-card-watch" id="opt-watch">
          <div class="dp-card-tag dp-tag-featured">Most Popular</div>
          <div class="dp-card-icon">📺</div>
          <h3 class="dp-card-title">Watch to Earn</h3>
          <div class="dp-card-price">100% Free<span class="dp-price-period">/ 30s Stream</span></div>
          <p class="dp-card-desc">Watch an interactive enterprise sponsor clip to earn instant credits & unlock access.</p>
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
          <span class="dp-watch-status">Playing Sponsored Stream (Proof of Elapsed Time Active)</span>
          <span class="dp-watch-counter" id="timer-label">${remaining}s remaining</span>
        </div>
        <div class="dp-video-screen">
          <div class="dp-video-overlay">
            <div class="dp-pulsing-dot"></div>
            <span>Proof of Attention Verified by DigitPop PoET Engine</span>
          </div>
          <div class="dp-sim-video">
            <div class="dp-brand-watermark">ENTERPRISE SPONSOR</div>
            <div class="dp-ad-title">DigitPop High-Fidelity Experience</div>
            <div class="dp-progress-bar-container">
              <div class="dp-progress-bar-fill" id="progress-bar" style="width: ${this.watchProgress}%;"></div>
            </div>
          </div>
        </div>
        <p class="dp-watch-instruction" id="watch-instruction">Please keep this window active to verify proof of attention.</p>
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
          <h3 class="dp-quiz-question">${quiz.questionText}</h3>
          <div class="dp-quiz-options">
            ${quiz.options.map((opt: string, idx: number) => `
              <label class="dp-quiz-option ${this.selectedQuizOption === idx ? 'dp-quiz-option-selected' : ''}" data-index="${idx}">
                <input type="radio" name="quiz-answer" value="${idx}" ${this.selectedQuizOption === idx ? 'checked' : ''} style="display: none;" />
                <span class="dp-quiz-bullet">${String.fromCharCode(65 + idx)}</span>
                <span class="dp-quiz-text">${opt}</span>
              </label>
            `).join('')}
          </div>
          <button class="dp-button dp-btn-emerald" id="btn-submit-quiz" ${this.selectedQuizOption === null ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
            Verify Comprehension & Claim Credits
          </button>
        </div>
      </div>
    `;
  }

  private renderSuccessStage(): string {
    return `
      <div class="dp-success-container">
        <div class="dp-success-icon">🎉</div>
        <h3 class="dp-success-title">Attention & Comprehension Verified!</h3>
        <p class="dp-success-desc">Your candidate attention credits have been verified by the DigitPop clearinghouse and applied to Opportunity OS.</p>
        <button class="dp-button dp-btn-emerald" id="btn-success-continue">Continue to Application</button>
      </div>
    `;
  }

  private renderFooter(): string {
    return `
      <div class="dp-footer">
        <span>Powered by <strong style="color: #60a5fa;">DigitPop Proof-of-Attention Clearinghouse</strong></span>
        <span>Corporate Vetted Supply Network</span>
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

    // Quiz Options Click
    const optionCards = this.shadowRoot.querySelectorAll('.dp-quiz-option');
    optionCards.forEach((card) => {
      card.addEventListener('click', () => {
        const idx = parseInt(card.getAttribute('data-index') || '0', 10);
        this.selectedQuizOption = idx;
        this.quizError = null;
        this.updateContent();
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
      // Connect WebSocket stream
      this.client.ws.connect();

      // Initiate PoET challenge on server
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
        this.rateLimitWarning = `⚠️ Concurrency Lock: Active attention stream in progress (${err.remainingSeconds || 15}s remaining). Please finish it before starting another.`;
      } else {
        this.rateLimitWarning = `⚠️ ${err.message || 'Failed to initiate attention challenge.'}`;
      }
      this.updateContent();
    }
  }

  private runWatchTimer(): void {
    if (this.watchTimer) clearInterval(this.watchTimer);

    this.watchTimer = setInterval(() => {
      // If user switched tabs, halt progress
      if (this.isTabHidden) {
        return;
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
        // Transition to brand comprehension quiz
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
        background: rgba(2, 6, 23, 0.85);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
        padding: 16px;
      }
      .dp-modal {
        position: relative;
        background: #090d16;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 20px;
        width: 100%;
        max-width: 820px;
        padding: 32px;
        color: #f3f4f6;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
        animation: dp-fade-in 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      }
      @keyframes dp-fade-in {
        from { opacity: 0; transform: scale(0.96) translateY(10px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
      }
      .dp-close {
        position: absolute;
        top: 18px;
        right: 20px;
        background: none;
        border: none;
        color: #9ca3af;
        font-size: 28px;
        cursor: pointer;
        line-height: 1;
        transition: color 0.15s;
      }
      .dp-close:hover {
        color: #fff;
      }
      .dp-header {
        text-align: center;
        margin-bottom: 28px;
      }
      .dp-badge {
        display: inline-block;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-weight: 700;
        color: #38bdf8;
        background: rgba(56, 189, 248, 0.12);
        border: 1px solid rgba(56, 189, 248, 0.25);
        padding: 4px 10px;
        border-radius: 9999px;
        margin-bottom: 8px;
      }
      .dp-title {
        font-size: 24px;
        font-weight: 700;
        letter-spacing: -0.02em;
        color: #fff;
        margin-bottom: 6px;
      }
      .dp-subtitle {
        font-size: 14px;
        color: #94a3b8;
      }
      .dp-alert-warning {
        background: rgba(245, 158, 11, 0.15);
        border: 1px solid rgba(245, 158, 11, 0.3);
        color: #fbbf24;
        padding: 10px 14px;
        border-radius: 8px;
        font-size: 13px;
        margin-bottom: 16px;
      }
      .dp-alert-error {
        background: rgba(239, 68, 68, 0.15);
        border: 1px solid rgba(239, 68, 68, 0.3);
        color: #f87171;
        padding: 10px 14px;
        border-radius: 8px;
        font-size: 13px;
        margin-bottom: 16px;
      }
      .dp-options-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 16px;
        margin-bottom: 24px;
      }
      .dp-card {
        background: rgba(15, 23, 42, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 14px;
        padding: 20px;
        display: flex;
        flex-direction: column;
        position: relative;
        transition: transform 0.2s, border-color 0.2s;
      }
      .dp-card:hover {
        transform: translateY(-2px);
        border-color: rgba(255, 255, 255, 0.2);
      }
      .dp-card-tag {
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        color: #94a3b8;
        margin-bottom: 12px;
      }
      .dp-tag-featured {
        color: #60a5fa;
      }
      .dp-card-icon {
        font-size: 32px;
        margin-bottom: 8px;
      }
      .dp-card-title {
        font-size: 16px;
        font-weight: 600;
        color: #fff;
        margin-bottom: 6px;
      }
      .dp-card-price {
        font-size: 20px;
        font-weight: 800;
        color: #fff;
        margin-bottom: 8px;
      }
      .dp-price-period {
        font-size: 12px;
        font-weight: 400;
        color: #94a3b8;
        margin-left: 4px;
      }
      .dp-card-desc {
        font-size: 12px;
        color: #94a3b8;
        line-height: 1.5;
        margin-bottom: 16px;
        flex-grow: 1;
      }
      .dp-button {
        width: 100%;
        padding: 10px 14px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        border: none;
        transition: filter 0.15s;
      }
      .dp-button:hover {
        filter: brightness(1.1);
      }
      .dp-btn-emerald {
        background: #10b981;
        color: #fff;
      }
      .dp-btn-blue {
        background: #2563eb;
        color: #fff;
      }
      .dp-btn-purple {
        background: #7c3aed;
        color: #fff;
      }
      .dp-watch-container {
        padding: 16px;
        text-align: center;
      }
      .dp-watch-header {
        display: flex;
        justify-content: space-between;
        font-size: 13px;
        font-weight: 600;
        color: #94a3b8;
        margin-bottom: 12px;
      }
      .dp-video-screen {
        background: #020617;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        height: 240px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 16px;
        position: relative;
        overflow: hidden;
      }
      .dp-video-overlay {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 11px;
        color: #34d399;
      }
      .dp-pulsing-dot {
        width: 8px;
        height: 8px;
        background: #10b981;
        border-radius: 50%;
        box-shadow: 0 0 8px #10b981;
        animation: dp-pulse 1.5s infinite;
      }
      @keyframes dp-pulse {
        0% { transform: scale(0.9); opacity: 0.7; }
        50% { transform: scale(1.3); opacity: 1; }
        100% { transform: scale(0.9); opacity: 0.7; }
      }
      .dp-brand-watermark {
        font-size: 11px;
        color: #64748b;
        letter-spacing: 0.05em;
        font-weight: 700;
      }
      .dp-ad-title {
        font-size: 18px;
        font-weight: 700;
        color: #fff;
        margin-top: 24px;
        margin-bottom: 24px;
      }
      .dp-progress-bar-container {
        width: 100%;
        height: 6px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 999px;
        overflow: hidden;
      }
      .dp-progress-bar-fill {
        height: 100%;
        background: linear-gradient(90deg, #2563eb, #38bdf8);
        transition: width 0.4s ease;
      }
      .dp-watch-instruction {
        margin-top: 12px;
        font-size: 12px;
        color: #64748b;
      }
      .dp-quiz-container {
        padding: 8px 16px 20px;
      }
      .dp-quiz-card {
        background: rgba(15, 23, 42, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 14px;
        padding: 24px;
      }
      .dp-quiz-question {
        font-size: 16px;
        font-weight: 600;
        color: #fff;
        margin-bottom: 18px;
        line-height: 1.4;
      }
      .dp-quiz-options {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-bottom: 20px;
      }
      .dp-quiz-option {
        display: flex;
        align-items: center;
        gap: 12px;
        background: rgba(30, 41, 59, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 10px;
        padding: 12px 16px;
        cursor: pointer;
        transition: border-color 0.15s, background 0.15s;
      }
      .dp-quiz-option:hover {
        background: rgba(30, 41, 59, 0.8);
        border-color: rgba(255, 255, 255, 0.2);
      }
      .dp-quiz-option-selected {
        background: rgba(37, 99, 235, 0.2) !important;
        border-color: #3b82f6 !important;
      }
      .dp-quiz-bullet {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.1);
        font-size: 12px;
        font-weight: 700;
        color: #cbd5e1;
      }
      .dp-quiz-option-selected .dp-quiz-bullet {
        background: #2563eb;
        color: #fff;
      }
      .dp-quiz-text {
        font-size: 13px;
        color: #e2e8f0;
      }
      .dp-success-container {
        text-align: center;
        padding: 32px 16px;
      }
      .dp-success-icon {
        font-size: 48px;
        margin-bottom: 12px;
      }
      .dp-success-title {
        font-size: 20px;
        font-weight: 700;
        color: #34d399;
        margin-bottom: 8px;
      }
      .dp-success-desc {
        font-size: 13px;
        color: #94a3b8;
        margin-bottom: 20px;
      }
      .dp-footer {
        display: flex;
        justify-content: space-between;
        font-size: 11px;
        color: #64748b;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
        padding-top: 16px;
      }
    `;
  }
}
