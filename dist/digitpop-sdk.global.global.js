"use strict";var DigitPopSDK=(()=>{var u=Object.defineProperty;var m=Object.getOwnPropertyDescriptor;var v=Object.getOwnPropertyNames;var y=Object.prototype.hasOwnProperty;var x=(s,e)=>{for(var t in e)u(s,t,{get:e[t],enumerable:!0})},w=(s,e,t,i)=>{if(e&&typeof e=="object"||typeof e=="function")for(let n of v(e))!y.call(s,n)&&n!==t&&u(s,n,{get:()=>e[n],enumerable:!(i=m(e,n))||i.enumerable});return s};var C=s=>w(u({},"__esModule",{value:!0}),s);var S={};x(S,{ApiClient:()=>d,DigitPopClient:()=>r,GatewayModal:()=>c,WebSocketClient:()=>p,createDigitPop:()=>b,default:()=>k});var d=class{constructor(e){this.config=e,this.baseUrl=this.resolveBaseUrl()}getBaseUrl(){return this.baseUrl}resolveBaseUrl(){return this.config.apiUrl?this.config.apiUrl.replace(/\/+$/,""):(this.config.environment==="staging","https://digitpop-server-staging.up.railway.app")}async getWalletBalance(e){let t=e||this.config.userId;try{let i=`${this.baseUrl}/api/engagement/user/${encodeURIComponent(t)}`,n=await fetch(i,{headers:{"X-DigitPop-Publisher-Key":this.config.publicKey}});if(!n.ok)throw new Error(`Failed to fetch wallet balance (HTTP ${n.status})`);let l=await n.json(),o=l.user?.earnedCredits??l.earnedCredits??0;return{earnedCredits:o,availableCredits:o,attentionCredits:o,popCoins:Math.floor(o*10),isCandidateAccount:!0}}catch(i){return console.warn("[DigitPop SDK] Failed to query wallet balance, returning fallback zero:",i.message),{earnedCredits:0,availableCredits:0,attentionCredits:0,popCoins:0,isCandidateAccount:!0}}}async grantAttentionReward(e){let t=await fetch(`${this.baseUrl}/api/engagement/grant-credit`,{method:"POST",headers:{"Content-Type":"application/json","X-DigitPop-Publisher-Key":this.config.publicKey},body:JSON.stringify({userId:e.userId,userEmail:this.config.userMetadata?.email,candidateName:this.config.userMetadata?.fullName,credits:e.credits,publisherKey:this.config.publicKey,videoId:e.videoId,engagementType:"VIDEO_WATCH",watchTimeSeconds:30})});if(!t.ok){let n=await t.json().catch(()=>({}));throw new Error(n.message||`Failed to grant credit (HTTP ${t.status})`)}let i=await t.json();return{success:!0,earnedCredits:i.totalEarnedCredits??i.data?.earnedCredits??e.credits}}async redeemTokens(e){let t=await fetch(`${this.baseUrl}/api/redemption/purchase-with-tokens`,{method:"POST",headers:{"Content-Type":"application/json","X-DigitPop-Publisher-Key":this.config.publicKey},body:JSON.stringify({userId:e.userId,tokenCost:e.tokenAmount,productId:e.assetId,deliveryEmail:this.config.userMetadata?.email})});if(!t.ok){let n=await t.json().catch(()=>({}));throw new Error(n.message||`Failed to redeem tokens (HTTP ${t.status})`)}let i=await t.json();return{success:!0,transactionId:i.redemption?.id||i.transactionId||`tx_redeem_${Date.now()}`}}async startAttentionChallenge(e){let t=await fetch(`${this.baseUrl}/api/engagement/challenge/start`,{method:"POST",headers:{"Content-Type":"application/json","X-DigitPop-Publisher-Key":this.config.publicKey},body:JSON.stringify({userId:this.config.userId,userEmail:this.config.userMetadata?.email,durationSeconds:e,publisherKey:this.config.publicKey})}),i=await t.json().catch(()=>({}));if(!t.ok){let n=new Error(i.message||`Failed to initiate attention challenge (HTTP ${t.status})`);throw n.code=i.code,n.remainingSeconds=i.remainingSeconds,n}return i}async verifyComprehension(e){let t=await fetch(`${this.baseUrl}/api/engagement/challenge/verify`,{method:"POST",headers:{"Content-Type":"application/json","X-DigitPop-Publisher-Key":this.config.publicKey},body:JSON.stringify({challengeToken:e.challengeToken,selectedOptionIndex:e.selectedOptionIndex,clientTelemetry:e.clientTelemetry})}),i=await t.json().catch(()=>({}));if(!t.ok){let n=new Error(i.message||`Attention comprehension verification failed (HTTP ${t.status})`);throw n.code=i.code,n.explanation=i.explanation,n}return i}};var p=class{constructor(e){this.ws=null;this.listeners=new Set;this.isConnecting=!1;this.reconnectTimer=null;this.config=e}resolveWsUrl(){return this.config.wsUrl?this.config.wsUrl.replace(/\/+$/,""):(this.config.environment==="staging","wss://digitpop-server-staging.up.railway.app")}connect(){if(typeof window>"u"||typeof window.WebSocket>"u"||this.ws&&(this.ws.readyState===0||this.ws.readyState===1))return;this.isConnecting=!0;let t=`${this.resolveWsUrl()}/${encodeURIComponent(this.config.userId)}`;try{this.ws=new window.WebSocket(t,`${this.config.userId}-player`),this.ws.onopen=()=>{this.isConnecting=!1,this.send({data:{trigger:"login",value:this.config.userId}})},this.ws.onmessage=i=>{try{let n=JSON.parse(i.data);this.notifyListeners(n)}catch{}},this.ws.onerror=i=>{this.isConnecting=!1},this.ws.onclose=()=>{this.isConnecting=!1,this.ws=null}}catch(i){this.isConnecting=!1,console.warn("[DigitPop SDK] WebSocket connection failed:",i)}}send(e){this.ws&&this.ws.readyState===1&&this.ws.send(typeof e=="string"?e:JSON.stringify(e))}subscribe(e){return this.listeners.add(e),()=>this.listeners.delete(e)}notifyListeners(e){this.listeners.forEach(t=>{try{t(e)}catch(i){console.error("[DigitPop SDK] Error in WebSocket listener:",i)}})}disconnect(){this.reconnectTimer&&clearTimeout(this.reconnectTimer),this.ws&&(this.ws.close(),this.ws=null),this.listeners.clear()}};var c=class{constructor(e,t){this.hostElement=null;this.shadowRoot=null;this.currentStage="SELECTION";this.watchTimer=null;this.watchProgress=0;this.durationSeconds=30;this.elapsedSeconds=0;this.isTabHidden=!1;this.challengeToken=null;this.currentQuiz=null;this.selectedQuizOption=null;this.quizError=null;this.rateLimitWarning=null;this.handleKeyDown=e=>{if(e.key==="Escape"&&this.close(),this.currentStage==="QUIZ"&&this.currentQuiz?.options){let t=this.currentQuiz.options.length;e.key==="ArrowDown"||e.key==="ArrowRight"?(e.preventDefault(),this.selectedQuizOption=this.selectedQuizOption===null?0:(this.selectedQuizOption+1)%t,this.quizError=null,this.updateContent()):e.key==="ArrowUp"||e.key==="ArrowLeft"?(e.preventDefault(),this.selectedQuizOption=this.selectedQuizOption===null?t-1:(this.selectedQuizOption-1+t)%t,this.quizError=null,this.updateContent()):e.key==="Enter"&&this.selectedQuizOption!==null&&(e.preventDefault(),this.submitQuizAnswer())}};this.handleVisibilityChange=()=>{if(!(typeof document>"u")&&(this.isTabHidden=document.hidden,this.currentStage==="WATCHING")){let e=this.shadowRoot?.getElementById("watch-instruction");e&&(document.hidden?e.innerHTML='<span style="color: #ef4444; font-weight: 600;">\u26A0\uFE0F Stream Paused:</span> Return to this tab to continue verifying proof of attention.':e.innerText="Please keep this tab focused to verify proof-of-attention credits.")}};this.client=e,this.options=t}render(){typeof document>"u"||(this.close(),this.hostElement=document.createElement("div"),this.hostElement.id="digitpop-gateway-root",this.shadowRoot=this.hostElement.attachShadow({mode:"open"}),document.body.appendChild(this.hostElement),this.updateContent(),window.addEventListener("keydown",this.handleKeyDown),document.addEventListener("visibilitychange",this.handleVisibilityChange))}close(){this.watchTimer&&(clearInterval(this.watchTimer),this.watchTimer=null),window.removeEventListener("keydown",this.handleKeyDown),document.removeEventListener("visibilitychange",this.handleVisibilityChange),this.hostElement&&this.hostElement.parentNode&&this.hostElement.parentNode.removeChild(this.hostElement),this.hostElement=null,this.shadowRoot=null,this.options.onClose&&this.options.onClose()}updateContent(){this.shadowRoot&&(this.shadowRoot.innerHTML=`
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
    `,this.bindEvents())}renderHeader(){return this.currentStage==="QUIZ"?`
        <div class="dp-header">
          <div class="dp-badge dp-badge-gold">
            <span class="dp-icon-shield">\u{1F6E1}\uFE0F</span> Cost-Per-Comprehension Gate
          </div>
          <h2 class="dp-title" id="dp-modal-title">Verify Brand Takeaway</h2>
          <p class="dp-subtitle">Answer the sponsor comprehension check to unlock your candidate application pass.</p>
        </div>
      `:this.currentStage==="WATCHING"?`
        <div class="dp-header">
          <div class="dp-badge dp-badge-cyan">
            <span class="dp-pulsing-dot-inline"></span> Proof of Elapsed Time Active
          </div>
          <h2 class="dp-title" id="dp-modal-title">Interactive Sponsor Experience</h2>
          <p class="dp-subtitle">Sponsored by Tier-1 Enterprise Brands to unlock full Opportunity OS tools</p>
        </div>
      `:`
      <div class="dp-header">
        <div class="dp-badge dp-badge-cyan">DigitPop Attention Clearinghouse</div>
        <h2 class="dp-title" id="dp-modal-title">${this.options.title||"Unlock Full System Access"}</h2>
        <p class="dp-subtitle">Select how you want to unlock candidate opportunities & AI tools</p>
      </div>
    `}renderBody(){return this.currentStage==="WATCHING"?this.renderWatchingStage():this.currentStage==="QUIZ"?this.renderQuizStage():this.currentStage==="SUCCESS"?this.renderSuccessStage():`
      ${this.rateLimitWarning?`<div class="dp-alert-warning">${this.rateLimitWarning}</div>`:""}
      <div class="dp-options-grid">
        <!-- Option 1: Direct Payment -->
        <div class="dp-card dp-card-payment" id="opt-payment">
          <div class="dp-card-tag">Instant Pass</div>
          <div class="dp-card-icon">\u{1F4B3}</div>
          <h3 class="dp-card-title">1-Click Pass</h3>
          <div class="dp-card-price">$49.00<span class="dp-price-period">/mo</span></div>
          <p class="dp-card-desc">Zero ads. Immediate access to all vetted job applications and operator tools.</p>
          <button class="dp-button dp-btn-emerald" id="btn-buy-pass">Checkout with Card</button>
        </div>

        <!-- Option 2: Watch to Earn -->
        <div class="dp-card dp-card-watch dp-card-featured" id="opt-watch">
          <div class="dp-card-tag dp-tag-featured">Most Popular</div>
          <div class="dp-card-icon">\u{1F4FA}</div>
          <h3 class="dp-card-title">Watch to Earn</h3>
          <div class="dp-card-price">100% Free<span class="dp-price-period">/ 30s Stream</span></div>
          <p class="dp-card-desc">Watch an interactive enterprise sponsor masterclass to earn instant credits & unlock access.</p>
          <button class="dp-button dp-btn-blue" id="btn-start-watch">Watch Clip & Verify (Free)</button>
        </div>

        <!-- Option 3: Token Redemption -->
        <div class="dp-card dp-card-token" id="opt-token">
          <div class="dp-card-tag">Token Vault</div>
          <div class="dp-card-icon">\u{1FA99}</div>
          <h3 class="dp-card-title">PopCoin Vault</h3>
          <div class="dp-card-price">50 Tokens<span class="dp-price-period">/ Pass</span></div>
          <p class="dp-card-desc">Redeem earned PopCoin tokens from your DigitPop universal attention wallet.</p>
          <button class="dp-button dp-btn-purple" id="btn-redeem-tokens">Redeem Tokens</button>
        </div>
      </div>
    `}renderWatchingStage(){return`
      <div class="dp-watch-container">
        <div class="dp-watch-header">
          <div class="dp-watch-meta">
            <span class="dp-stream-tag">LIVE STREAM</span>
            <span class="dp-sponsor-name">AWS Cloud & Graviton4</span>
          </div>
          <span class="dp-watch-counter" id="timer-label">${Math.max(0,Math.ceil(this.durationSeconds-this.elapsedSeconds))}s remaining</span>
        </div>
        <div class="dp-video-screen">
          <div class="dp-video-top-bar">
            <div class="dp-video-status">
              <span class="dp-pulsing-dot"></span>
              <span>Proof-of-Elapsed-Time Monitored</span>
            </div>
            <div class="dp-video-cert">\u{1F512} SOC2 Vetted Supply</div>
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
    `}renderQuizStage(){let e=this.currentQuiz||{questionText:"What is the primary benefit of AWS Graviton processors for cloud workloads?",options:["Up to 40% better price-performance over comparable x86 processors","Manual server patching required every week","Higher energy consumption in data centers","Incompatibility with Linux environments"]};return`
      <div class="dp-quiz-container">
        ${this.quizError?`<div class="dp-alert-error">${this.quizError}</div>`:""}
        <div class="dp-quiz-card">
          <div class="dp-quiz-banner">
            <span>SPONSOR ATTENTION CHECK</span>
            <span>+20 GrowthCredits</span>
          </div>
          <h3 class="dp-quiz-question">${e.questionText}</h3>
          
          <div class="dp-quiz-options" role="radiogroup" aria-label="Quiz Options">
            ${e.options.map((t,i)=>`
              <div 
                class="dp-quiz-option ${this.selectedQuizOption===i?"dp-quiz-option-selected":""}" 
                data-index="${i}"
                role="radio"
                tabindex="0"
                aria-checked="${this.selectedQuizOption===i?"true":"false"}"
              >
                <span class="dp-quiz-bullet">${String.fromCharCode(65+i)}</span>
                <span class="dp-quiz-text">${t}</span>
                <span class="dp-quiz-radio-indicator"></span>
              </div>
            `).join("")}
          </div>

          <button 
            class="dp-button dp-btn-emerald dp-btn-large" 
            id="btn-submit-quiz" 
            ${this.selectedQuizOption===null?'disabled style="opacity: 0.5; cursor: not-allowed;"':""}
          >
            Verify Comprehension & Claim Credits
          </button>
        </div>
      </div>
    `}renderSuccessStage(){return`
      <div class="dp-success-container">
        <div class="dp-success-glow">
          <div class="dp-success-icon">\u{1F389}</div>
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
    `}renderFooter(){return`
      <div class="dp-footer">
        <span class="dp-footer-left">
          <span>Powered by </span>
          <strong style="color: #38bdf8;">DigitPop Proof-of-Attention Clearinghouse</strong>
        </span>
        <span class="dp-footer-right">
          <span>\u{1F512} Vetted Corporate Consortium</span>
          <span>\u2022</span>
          <span>Zero-Fraud SLA</span>
        </span>
      </div>
    `}bindEvents(){if(!this.shadowRoot)return;let e=this.shadowRoot.getElementById("backdrop");e&&e.addEventListener("click",a=>{a.target===e&&this.close()});let t=this.shadowRoot.getElementById("btn-close");t&&t.addEventListener("click",()=>this.close());let i=this.shadowRoot.getElementById("btn-buy-pass");i&&i.addEventListener("click",()=>{this.options.onDirectCheckout&&this.options.onDirectCheckout({price:49,productId:"prod_opportunity_os_pro"}),this.close()});let n=this.shadowRoot.getElementById("btn-start-watch");n&&n.addEventListener("click",()=>this.startWatching());let l=this.shadowRoot.getElementById("btn-redeem-tokens");l&&l.addEventListener("click",()=>this.handleTokenRedemption());let o=this.shadowRoot.getElementById("btn-success-continue");o&&o.addEventListener("click",()=>this.close()),this.shadowRoot.querySelectorAll(".dp-quiz-option").forEach(a=>{a.addEventListener("click",()=>{let h=parseInt(a.getAttribute("data-index")||"0",10);this.selectedQuizOption=h,this.quizError=null,this.updateContent()}),a.addEventListener("keydown",h=>{if(h.key===" "||h.key==="Enter"){h.preventDefault();let f=parseInt(a.getAttribute("data-index")||"0",10);this.selectedQuizOption=f,this.quizError=null,this.updateContent()}})});let g=this.shadowRoot.getElementById("btn-submit-quiz");g&&g.addEventListener("click",()=>this.submitQuizAnswer())}async startWatching(){try{this.rateLimitWarning=null,this.client.ws.connect();let e=await this.client.startAttentionChallenge();this.challengeToken=e.challengeToken,this.currentQuiz=e.quiz,this.durationSeconds=e.durationSeconds||15,this.elapsedSeconds=0,this.watchProgress=0,this.selectedQuizOption=null,this.quizError=null,this.currentStage="WATCHING",this.updateContent(),this.runWatchTimer()}catch(e){e.code==="ACTIVE_ATTENTION_STREAM_IN_PROGRESS"?this.rateLimitWarning=`\u26A0\uFE0F Concurrency Lock: Active attention stream in progress (${e.remainingSeconds||15}s remaining). Please finish it before opening another.`:this.rateLimitWarning=`\u26A0\uFE0F ${e.message||"Failed to initiate attention challenge."}`,this.updateContent()}}runWatchTimer(){this.watchTimer&&clearInterval(this.watchTimer),this.watchTimer=setInterval(()=>{if(!this.isTabHidden){if(this.elapsedSeconds+=.5,this.watchProgress=Math.min(100,Math.round(this.elapsedSeconds/this.durationSeconds*100)),this.shadowRoot){let e=this.shadowRoot.getElementById("progress-bar");e&&(e.style.width=`${this.watchProgress}%`);let t=this.shadowRoot.getElementById("timer-label");if(t){let i=Math.max(0,Math.ceil(this.durationSeconds-this.elapsedSeconds));t.innerText=`${i}s remaining`}}this.elapsedSeconds>=this.durationSeconds&&(clearInterval(this.watchTimer),this.watchTimer=null,this.currentStage="QUIZ",this.updateContent())}},500)}async submitQuizAnswer(){if(!(this.selectedQuizOption===null||!this.challengeToken))try{let e=await this.client.verifyComprehension({challengeToken:this.challengeToken,selectedOptionIndex:this.selectedQuizOption,clientTelemetry:{tabHiddenCount:0,elapsedSeconds:this.elapsedSeconds}});e.verified&&(this.options.onCreditEarned&&this.options.onCreditEarned({credits:e.creditsEarned,totalEarnedCredits:e.totalEarnedCredits,transactionId:`tx_poet_${Date.now()}`,timestamp:new Date().toISOString()}),this.currentStage="SUCCESS",this.updateContent(),this.options.onAccessGranted&&this.options.onAccessGranted({accessType:"VIDEO_ENGAGEMENT",creditsEarned:e.creditsEarned,transactionId:`tx_access_${Date.now()}`,timestamp:new Date().toISOString(),userId:this.client.config.userId}))}catch(e){this.quizError=e.message||"Comprehension check failed.",this.updateContent()}}async handleTokenRedemption(){try{let e=await this.client.redeemTokens(50,this.options.assetId);this.currentStage="SUCCESS",this.updateContent();let t={accessType:"TOKEN_REDEMPTION",tokensSpent:50,transactionId:e.transactionId,timestamp:new Date().toISOString(),userId:this.client.config.userId};this.options.onAccessGranted&&this.options.onAccessGranted(t)}catch(e){alert(`Redemption Notice: ${e.message||"Insufficient PopCoin balance"}`)}}getStyles(){return`
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
    `}};var r=class{constructor(e){this.currentModal=null;if(!e||!e.publicKey)throw new Error("[DigitPop SDK] A valid publicKey (e.g. dp_pub_live_...) is required to initialize.");if(!e.userId)throw new Error("[DigitPop SDK] A valid userId representing the candidate/user is required.");this.config={environment:"production",...e},this.api=new d(this.config),this.ws=new p(this.config)}async getWalletBalance(){return this.api.getWalletBalance(this.config.userId)}openGateway(e={}){this.currentModal&&(this.currentModal.close(),this.currentModal=null);let t=[{type:"DIRECT_PAYMENT",price:49,productId:"prod_opportunity_os_pro",label:"1-Click Instant Pass",description:"Instant full access for 30 days without ads or interruptions."},{type:"VIDEO_ENGAGEMENT",requiredVideos:2,creditsPerWatch:10,label:"Watch-to-Earn (Free)",description:"Watch 2 sponsored partner clips to unlock instant credits."},{type:"TOKEN_REDEMPTION",tokensRequired:50,label:"Redeem PopCoin Tokens",description:"Exchange accumulated attention tokens for free platform passes."}],i={monetizationOptions:e.monetizationOptions||t,...e,onClose:()=>{this.currentModal=null,e.onClose&&e.onClose()}},n=new c(this,i);return n.render(),this.currentModal=n,n}closeGateway(){this.currentModal&&(this.currentModal.close(),this.currentModal=null)}async grantAttentionReward(e=10,t){return this.api.grantAttentionReward({userId:this.config.userId,credits:e,videoId:t})}async redeemTokens(e=50,t){return this.api.redeemTokens({userId:this.config.userId,tokenAmount:e,assetId:t})}async startAttentionChallenge(e){return this.api.startAttentionChallenge(e)}async verifyComprehension(e){return this.api.verifyComprehension(e)}destroy(){this.closeGateway(),this.ws.disconnect()}};function b(s){return new r(s)}typeof window<"u"&&(window.DigitPopSDK={DigitPopClient:r,createDigitPop:b});var k=r;return C(S);})();
//# sourceMappingURL=digitpop-sdk.global.global.js.map