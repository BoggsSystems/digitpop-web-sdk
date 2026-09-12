"use strict";var DigitPopSDK=(()=>{var h=Object.defineProperty;var b=Object.getOwnPropertyDescriptor;var m=Object.getOwnPropertyNames;var v=Object.prototype.hasOwnProperty;var y=(o,e)=>{for(var t in e)h(o,t,{get:e[t],enumerable:!0})},w=(o,e,t,i)=>{if(e&&typeof e=="object"||typeof e=="function")for(let n of m(e))!v.call(o,n)&&n!==t&&h(o,n,{get:()=>e[n],enumerable:!(i=b(e,n))||i.enumerable});return o};var x=o=>w(h({},"__esModule",{value:!0}),o);var k={};y(k,{ApiClient:()=>a,DigitPopClient:()=>s,GatewayModal:()=>c,WebSocketClient:()=>d,createDigitPop:()=>g,default:()=>C});var a=class{constructor(e){this.config=e,this.baseUrl=this.resolveBaseUrl()}getBaseUrl(){return this.baseUrl}resolveBaseUrl(){return this.config.apiUrl?this.config.apiUrl.replace(/\/+$/,""):(this.config.environment==="staging","https://digitpop-server-staging.up.railway.app")}async getWalletBalance(e){let t=e||this.config.userId;try{let i=`${this.baseUrl}/api/engagement/user/${encodeURIComponent(t)}`,n=await fetch(i,{headers:{"X-DigitPop-Publisher-Key":this.config.publicKey}});if(!n.ok)throw new Error(`Failed to fetch wallet balance (HTTP ${n.status})`);let p=await n.json(),r=p.user?.earnedCredits??p.earnedCredits??0;return{earnedCredits:r,availableCredits:r,attentionCredits:r,popCoins:Math.floor(r*10),isCandidateAccount:!0}}catch(i){return console.warn("[DigitPop SDK] Failed to query wallet balance, returning fallback zero:",i.message),{earnedCredits:0,availableCredits:0,attentionCredits:0,popCoins:0,isCandidateAccount:!0}}}async grantAttentionReward(e){let t=await fetch(`${this.baseUrl}/api/engagement/grant-credit`,{method:"POST",headers:{"Content-Type":"application/json","X-DigitPop-Publisher-Key":this.config.publicKey},body:JSON.stringify({userId:e.userId,userEmail:this.config.userMetadata?.email,candidateName:this.config.userMetadata?.fullName,credits:e.credits,publisherKey:this.config.publicKey,videoId:e.videoId,engagementType:"VIDEO_WATCH",watchTimeSeconds:30})});if(!t.ok){let n=await t.json().catch(()=>({}));throw new Error(n.message||`Failed to grant credit (HTTP ${t.status})`)}let i=await t.json();return{success:!0,earnedCredits:i.totalEarnedCredits??i.data?.earnedCredits??e.credits}}async redeemTokens(e){let t=await fetch(`${this.baseUrl}/api/redemption/purchase-with-tokens`,{method:"POST",headers:{"Content-Type":"application/json","X-DigitPop-Publisher-Key":this.config.publicKey},body:JSON.stringify({userId:e.userId,tokenCost:e.tokenAmount,productId:e.assetId,deliveryEmail:this.config.userMetadata?.email})});if(!t.ok){let n=await t.json().catch(()=>({}));throw new Error(n.message||`Failed to redeem tokens (HTTP ${t.status})`)}let i=await t.json();return{success:!0,transactionId:i.redemption?.id||i.transactionId||`tx_redeem_${Date.now()}`}}async startAttentionChallenge(e){let t=await fetch(`${this.baseUrl}/api/engagement/challenge/start`,{method:"POST",headers:{"Content-Type":"application/json","X-DigitPop-Publisher-Key":this.config.publicKey},body:JSON.stringify({userId:this.config.userId,userEmail:this.config.userMetadata?.email,durationSeconds:e,publisherKey:this.config.publicKey})}),i=await t.json().catch(()=>({}));if(!t.ok){let n=new Error(i.message||`Failed to initiate attention challenge (HTTP ${t.status})`);throw n.code=i.code,n.remainingSeconds=i.remainingSeconds,n}return i}async verifyComprehension(e){let t=await fetch(`${this.baseUrl}/api/engagement/challenge/verify`,{method:"POST",headers:{"Content-Type":"application/json","X-DigitPop-Publisher-Key":this.config.publicKey},body:JSON.stringify({challengeToken:e.challengeToken,selectedOptionIndex:e.selectedOptionIndex,clientTelemetry:e.clientTelemetry})}),i=await t.json().catch(()=>({}));if(!t.ok){let n=new Error(i.message||`Attention comprehension verification failed (HTTP ${t.status})`);throw n.code=i.code,n.explanation=i.explanation,n}return i}};var d=class{constructor(e){this.ws=null;this.listeners=new Set;this.isConnecting=!1;this.reconnectTimer=null;this.config=e}resolveWsUrl(){return this.config.wsUrl?this.config.wsUrl.replace(/\/+$/,""):(this.config.environment==="staging","wss://digitpop-server-staging.up.railway.app")}connect(){if(typeof window>"u"||typeof window.WebSocket>"u"||this.ws&&(this.ws.readyState===0||this.ws.readyState===1))return;this.isConnecting=!0;let t=`${this.resolveWsUrl()}/${encodeURIComponent(this.config.userId)}`;try{this.ws=new window.WebSocket(t,`${this.config.userId}-player`),this.ws.onopen=()=>{this.isConnecting=!1,this.send({data:{trigger:"login",value:this.config.userId}})},this.ws.onmessage=i=>{try{let n=JSON.parse(i.data);this.notifyListeners(n)}catch{}},this.ws.onerror=i=>{this.isConnecting=!1},this.ws.onclose=()=>{this.isConnecting=!1,this.ws=null}}catch(i){this.isConnecting=!1,console.warn("[DigitPop SDK] WebSocket connection failed:",i)}}send(e){this.ws&&this.ws.readyState===1&&this.ws.send(typeof e=="string"?e:JSON.stringify(e))}subscribe(e){return this.listeners.add(e),()=>this.listeners.delete(e)}notifyListeners(e){this.listeners.forEach(t=>{try{t(e)}catch(i){console.error("[DigitPop SDK] Error in WebSocket listener:",i)}})}disconnect(){this.reconnectTimer&&clearTimeout(this.reconnectTimer),this.ws&&(this.ws.close(),this.ws=null),this.listeners.clear()}};var c=class{constructor(e,t){this.hostElement=null;this.shadowRoot=null;this.currentStage="SELECTION";this.watchTimer=null;this.watchProgress=0;this.durationSeconds=30;this.elapsedSeconds=0;this.isTabHidden=!1;this.challengeToken=null;this.currentQuiz=null;this.selectedQuizOption=null;this.quizError=null;this.rateLimitWarning=null;this.handleKeyDown=e=>{e.key==="Escape"&&this.close()};this.handleVisibilityChange=()=>{if(!(typeof document>"u")&&(this.isTabHidden=document.hidden,this.currentStage==="WATCHING")){let e=this.shadowRoot?.getElementById("watch-instruction");e&&(document.hidden?(e.innerText="\u26A0\uFE0F Attention paused: Return to this tab to continue verifying stream.",e.style.color="#f87171"):(e.innerText="Please keep this window active to verify proof of attention.",e.style.color="#94a3b8"))}};this.client=e,this.options=t}render(){typeof document>"u"||(this.close(),this.hostElement=document.createElement("div"),this.hostElement.id="digitpop-gateway-root",this.shadowRoot=this.hostElement.attachShadow({mode:"open"}),document.body.appendChild(this.hostElement),this.updateContent(),window.addEventListener("keydown",this.handleKeyDown),document.addEventListener("visibilitychange",this.handleVisibilityChange))}close(){this.watchTimer&&(clearInterval(this.watchTimer),this.watchTimer=null),window.removeEventListener("keydown",this.handleKeyDown),document.removeEventListener("visibilitychange",this.handleVisibilityChange),this.hostElement&&this.hostElement.parentNode&&this.hostElement.parentNode.removeChild(this.hostElement),this.hostElement=null,this.shadowRoot=null,this.options.onClose&&this.options.onClose()}updateContent(){this.shadowRoot&&(this.shadowRoot.innerHTML=`
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
    `,this.bindEvents())}renderHeader(){return this.currentStage==="QUIZ"?`
        <div class="dp-header">
          <div class="dp-badge" style="color: #fbbf24; background: rgba(251, 191, 36, 0.12); border-color: rgba(251, 191, 36, 0.25);">
            Brand Comprehension Verification
          </div>
          <h2 class="dp-title">Verify Your Attention Takeaway</h2>
          <p class="dp-subtitle">Answer the sponsor comprehension check to unlock candidate application credits.</p>
        </div>
      `:`
      <div class="dp-header">
        <div class="dp-badge">DigitPop Attention Gateway</div>
        <h2 class="dp-title">${this.options.title||"Unlock Full System Access"}</h2>
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
        <div class="dp-card dp-card-watch" id="opt-watch">
          <div class="dp-card-tag dp-tag-featured">Most Popular</div>
          <div class="dp-card-icon">\u{1F4FA}</div>
          <h3 class="dp-card-title">Watch to Earn</h3>
          <div class="dp-card-price">100% Free<span class="dp-price-period">/ 30s Stream</span></div>
          <p class="dp-card-desc">Watch an interactive enterprise sponsor clip to earn instant credits & unlock access.</p>
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
          <span class="dp-watch-status">Playing Sponsored Stream (Proof of Elapsed Time Active)</span>
          <span class="dp-watch-counter" id="timer-label">${Math.max(0,Math.ceil(this.durationSeconds-this.elapsedSeconds))}s remaining</span>
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
    `}renderQuizStage(){let e=this.currentQuiz||{questionText:"What is the primary benefit of AWS Graviton processors for cloud workloads?",options:["Up to 40% better price-performance over comparable x86 processors","Manual server patching required every week","Higher energy consumption in data centers","Incompatibility with Linux environments"]};return`
      <div class="dp-quiz-container">
        ${this.quizError?`<div class="dp-alert-error">${this.quizError}</div>`:""}
        <div class="dp-quiz-card">
          <h3 class="dp-quiz-question">${e.questionText}</h3>
          <div class="dp-quiz-options">
            ${e.options.map((t,i)=>`
              <label class="dp-quiz-option ${this.selectedQuizOption===i?"dp-quiz-option-selected":""}" data-index="${i}">
                <input type="radio" name="quiz-answer" value="${i}" ${this.selectedQuizOption===i?"checked":""} style="display: none;" />
                <span class="dp-quiz-bullet">${String.fromCharCode(65+i)}</span>
                <span class="dp-quiz-text">${t}</span>
              </label>
            `).join("")}
          </div>
          <button class="dp-button dp-btn-emerald" id="btn-submit-quiz" ${this.selectedQuizOption===null?'disabled style="opacity: 0.5; cursor: not-allowed;"':""}>
            Verify Comprehension & Claim Credits
          </button>
        </div>
      </div>
    `}renderSuccessStage(){return`
      <div class="dp-success-container">
        <div class="dp-success-icon">\u{1F389}</div>
        <h3 class="dp-success-title">Attention & Comprehension Verified!</h3>
        <p class="dp-success-desc">Your candidate attention credits have been verified by the DigitPop clearinghouse and applied to Opportunity OS.</p>
        <button class="dp-button dp-btn-emerald" id="btn-success-continue">Continue to Application</button>
      </div>
    `}renderFooter(){return`
      <div class="dp-footer">
        <span>Powered by <strong style="color: #60a5fa;">DigitPop Proof-of-Attention Clearinghouse</strong></span>
        <span>Corporate Vetted Supply Network</span>
      </div>
    `}bindEvents(){if(!this.shadowRoot)return;let e=this.shadowRoot.getElementById("backdrop");e&&e.addEventListener("click",l=>{l.target===e&&this.close()});let t=this.shadowRoot.getElementById("btn-close");t&&t.addEventListener("click",()=>this.close());let i=this.shadowRoot.getElementById("btn-buy-pass");i&&i.addEventListener("click",()=>{this.options.onDirectCheckout&&this.options.onDirectCheckout({price:49,productId:"prod_opportunity_os_pro"}),this.close()});let n=this.shadowRoot.getElementById("btn-start-watch");n&&n.addEventListener("click",()=>this.startWatching());let p=this.shadowRoot.getElementById("btn-redeem-tokens");p&&p.addEventListener("click",()=>this.handleTokenRedemption());let r=this.shadowRoot.getElementById("btn-success-continue");r&&r.addEventListener("click",()=>this.close()),this.shadowRoot.querySelectorAll(".dp-quiz-option").forEach(l=>{l.addEventListener("click",()=>{let f=parseInt(l.getAttribute("data-index")||"0",10);this.selectedQuizOption=f,this.quizError=null,this.updateContent()})});let u=this.shadowRoot.getElementById("btn-submit-quiz");u&&u.addEventListener("click",()=>this.submitQuizAnswer())}async startWatching(){try{this.rateLimitWarning=null,this.client.ws.connect();let e=await this.client.startAttentionChallenge();this.challengeToken=e.challengeToken,this.currentQuiz=e.quiz,this.durationSeconds=e.durationSeconds||15,this.elapsedSeconds=0,this.watchProgress=0,this.selectedQuizOption=null,this.quizError=null,this.currentStage="WATCHING",this.updateContent(),this.runWatchTimer()}catch(e){e.code==="ACTIVE_ATTENTION_STREAM_IN_PROGRESS"?this.rateLimitWarning=`\u26A0\uFE0F Concurrency Lock: Active attention stream in progress (${e.remainingSeconds||15}s remaining). Please finish it before starting another.`:this.rateLimitWarning=`\u26A0\uFE0F ${e.message||"Failed to initiate attention challenge."}`,this.updateContent()}}runWatchTimer(){this.watchTimer&&clearInterval(this.watchTimer),this.watchTimer=setInterval(()=>{if(!this.isTabHidden){if(this.elapsedSeconds+=.5,this.watchProgress=Math.min(100,Math.round(this.elapsedSeconds/this.durationSeconds*100)),this.shadowRoot){let e=this.shadowRoot.getElementById("progress-bar");e&&(e.style.width=`${this.watchProgress}%`);let t=this.shadowRoot.getElementById("timer-label");if(t){let i=Math.max(0,Math.ceil(this.durationSeconds-this.elapsedSeconds));t.innerText=`${i}s remaining`}}this.elapsedSeconds>=this.durationSeconds&&(clearInterval(this.watchTimer),this.watchTimer=null,this.currentStage="QUIZ",this.updateContent())}},500)}async submitQuizAnswer(){if(!(this.selectedQuizOption===null||!this.challengeToken))try{let e=await this.client.verifyComprehension({challengeToken:this.challengeToken,selectedOptionIndex:this.selectedQuizOption,clientTelemetry:{tabHiddenCount:0,elapsedSeconds:this.elapsedSeconds}});e.verified&&(this.options.onCreditEarned&&this.options.onCreditEarned({credits:e.creditsEarned,totalEarnedCredits:e.totalEarnedCredits,transactionId:`tx_poet_${Date.now()}`,timestamp:new Date().toISOString()}),this.currentStage="SUCCESS",this.updateContent(),this.options.onAccessGranted&&this.options.onAccessGranted({accessType:"VIDEO_ENGAGEMENT",creditsEarned:e.creditsEarned,transactionId:`tx_access_${Date.now()}`,timestamp:new Date().toISOString(),userId:this.client.config.userId}))}catch(e){this.quizError=e.message||"Comprehension check failed.",this.updateContent()}}async handleTokenRedemption(){try{let e=await this.client.redeemTokens(50,this.options.assetId);this.currentStage="SUCCESS",this.updateContent();let t={accessType:"TOKEN_REDEMPTION",tokensSpent:50,transactionId:e.transactionId,timestamp:new Date().toISOString(),userId:this.client.config.userId};this.options.onAccessGranted&&this.options.onAccessGranted(t)}catch(e){alert(`Redemption Notice: ${e.message||"Insufficient PopCoin balance"}`)}}getStyles(){return`
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
    `}};var s=class{constructor(e){this.currentModal=null;if(!e||!e.publicKey)throw new Error("[DigitPop SDK] A valid publicKey (e.g. dp_pub_live_...) is required to initialize.");if(!e.userId)throw new Error("[DigitPop SDK] A valid userId representing the candidate/user is required.");this.config={environment:"production",...e},this.api=new a(this.config),this.ws=new d(this.config)}async getWalletBalance(){return this.api.getWalletBalance(this.config.userId)}openGateway(e={}){this.currentModal&&(this.currentModal.close(),this.currentModal=null);let t=[{type:"DIRECT_PAYMENT",price:49,productId:"prod_opportunity_os_pro",label:"1-Click Instant Pass",description:"Instant full access for 30 days without ads or interruptions."},{type:"VIDEO_ENGAGEMENT",requiredVideos:2,creditsPerWatch:10,label:"Watch-to-Earn (Free)",description:"Watch 2 sponsored partner clips to unlock instant credits."},{type:"TOKEN_REDEMPTION",tokensRequired:50,label:"Redeem PopCoin Tokens",description:"Exchange accumulated attention tokens for free platform passes."}],i={monetizationOptions:e.monetizationOptions||t,...e,onClose:()=>{this.currentModal=null,e.onClose&&e.onClose()}},n=new c(this,i);return n.render(),this.currentModal=n,n}closeGateway(){this.currentModal&&(this.currentModal.close(),this.currentModal=null)}async grantAttentionReward(e=10,t){return this.api.grantAttentionReward({userId:this.config.userId,credits:e,videoId:t})}async redeemTokens(e=50,t){return this.api.redeemTokens({userId:this.config.userId,tokenAmount:e,assetId:t})}async startAttentionChallenge(e){return this.api.startAttentionChallenge(e)}async verifyComprehension(e){return this.api.verifyComprehension(e)}destroy(){this.closeGateway(),this.ws.disconnect()}};function g(o){return new s(o)}typeof window<"u"&&(window.DigitPopSDK={DigitPopClient:s,createDigitPop:g});var C=s;return x(k);})();
//# sourceMappingURL=digitpop-sdk.global.global.js.map