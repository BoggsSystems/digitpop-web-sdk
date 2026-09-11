"use strict";var DigitPopSDK=(()=>{var p=Object.defineProperty;var u=Object.getOwnPropertyDescriptor;var f=Object.getOwnPropertyNames;var m=Object.prototype.hasOwnProperty;var b=(n,t)=>{for(var e in t)p(n,e,{get:t[e],enumerable:!0})},w=(n,t,e,i)=>{if(t&&typeof t=="object"||typeof t=="function")for(let s of f(t))!m.call(n,s)&&s!==e&&p(n,s,{get:()=>t[s],enumerable:!(i=u(t,s))||i.enumerable});return n};var v=n=>w(p({},"__esModule",{value:!0}),n);var x={};b(x,{ApiClient:()=>a,DigitPopClient:()=>r,GatewayModal:()=>c,WebSocketClient:()=>d,createDigitPop:()=>h,default:()=>y});var a=class{constructor(t){this.config=t,this.baseUrl=this.resolveBaseUrl()}getBaseUrl(){return this.baseUrl}resolveBaseUrl(){return this.config.apiUrl?this.config.apiUrl.replace(/\/+$/,""):(this.config.environment==="staging","https://digitpop-server-staging.up.railway.app")}async getWalletBalance(t){let e=t||this.config.userId;try{let i=`${this.baseUrl}/api/engagements/user-credits?userId=${encodeURIComponent(e)}`,s=await fetch(i,{headers:{"X-DigitPop-Publisher-Key":this.config.publicKey}});if(!s.ok)throw new Error(`Failed to fetch wallet balance (HTTP ${s.status})`);let o=await s.json();return{earnedCredits:o.earnedCredits||0,availableCredits:o.earnedCredits||0,attentionCredits:o.earnedCredits||0,popCoins:Math.floor((o.earnedCredits||0)*10),isCandidateAccount:!0}}catch(i){return console.warn("[DigitPop SDK] Failed to query wallet balance, returning fallback zero:",i.message),{earnedCredits:0,availableCredits:0,attentionCredits:0,popCoins:0,isCandidateAccount:!0}}}async grantAttentionReward(t){let e=await fetch(`${this.baseUrl}/api/engagements/grant-credit`,{method:"POST",headers:{"Content-Type":"application/json","X-DigitPop-Publisher-Key":this.config.publicKey},body:JSON.stringify({userId:t.userId,email:this.config.userMetadata?.email,candidateName:this.config.userMetadata?.fullName,credits:t.credits,publisherKey:this.config.publicKey,videoId:t.videoId})});if(!e.ok){let s=await e.json().catch(()=>({}));throw new Error(s.message||`Failed to grant credit (HTTP ${e.status})`)}let i=await e.json();return{success:!0,earnedCredits:i.data?.earnedCredits??i.earnedCredits??t.credits}}async redeemTokens(t){let e=await fetch(`${this.baseUrl}/api/redemption/redeem`,{method:"POST",headers:{"Content-Type":"application/json","X-DigitPop-Publisher-Key":this.config.publicKey},body:JSON.stringify({userId:t.userId,amount:t.tokenAmount,assetId:t.assetId,publisherKey:this.config.publicKey})});if(!e.ok){let s=await e.json().catch(()=>({}));throw new Error(s.message||`Failed to redeem tokens (HTTP ${e.status})`)}return{success:!0,transactionId:(await e.json()).transactionId||`tx_redeem_${Date.now()}`}}};var d=class{constructor(t){this.ws=null;this.listeners=new Set;this.isConnecting=!1;this.reconnectTimer=null;this.config=t}resolveWsUrl(){return this.config.wsUrl?this.config.wsUrl.replace(/\/+$/,""):(this.config.environment==="staging","wss://digitpop-server-staging.up.railway.app")}connect(){if(typeof window>"u"||typeof window.WebSocket>"u"||this.ws&&(this.ws.readyState===0||this.ws.readyState===1))return;this.isConnecting=!0;let e=`${this.resolveWsUrl()}/${encodeURIComponent(this.config.userId)}`;try{this.ws=new window.WebSocket(e,`${this.config.userId}-player`),this.ws.onopen=()=>{this.isConnecting=!1,this.send({data:{trigger:"login",value:this.config.userId}})},this.ws.onmessage=i=>{try{let s=JSON.parse(i.data);this.notifyListeners(s)}catch{}},this.ws.onerror=i=>{this.isConnecting=!1},this.ws.onclose=()=>{this.isConnecting=!1,this.ws=null}}catch(i){this.isConnecting=!1,console.warn("[DigitPop SDK] WebSocket connection failed:",i)}}send(t){this.ws&&this.ws.readyState===1&&this.ws.send(typeof t=="string"?t:JSON.stringify(t))}subscribe(t){return this.listeners.add(t),()=>this.listeners.delete(t)}notifyListeners(t){this.listeners.forEach(e=>{try{e(t)}catch(i){console.error("[DigitPop SDK] Error in WebSocket listener:",i)}})}disconnect(){this.reconnectTimer&&clearTimeout(this.reconnectTimer),this.ws&&(this.ws.close(),this.ws=null),this.listeners.clear()}};var c=class{constructor(t,e){this.hostElement=null;this.shadowRoot=null;this.currentStage="SELECTION";this.watchedVideos=0;this.requiredVideos=2;this.creditsPerWatch=10;this.watchTimer=null;this.watchProgress=0;this.handleKeyDown=t=>{t.key==="Escape"&&this.close()};this.client=t,this.options=e;let i=e.monetizationOptions?.find(s=>s.type==="VIDEO_ENGAGEMENT");i&&i.type==="VIDEO_ENGAGEMENT"&&(this.requiredVideos=i.requiredVideos||2,this.creditsPerWatch=i.creditsPerWatch||10)}render(){typeof document>"u"||(this.close(),this.hostElement=document.createElement("div"),this.hostElement.id="digitpop-gateway-root",this.shadowRoot=this.hostElement.attachShadow({mode:"open"}),document.body.appendChild(this.hostElement),this.updateContent(),window.addEventListener("keydown",this.handleKeyDown))}close(){this.watchTimer&&(clearInterval(this.watchTimer),this.watchTimer=null),window.removeEventListener("keydown",this.handleKeyDown),this.hostElement&&this.hostElement.parentNode&&this.hostElement.parentNode.removeChild(this.hostElement),this.hostElement=null,this.shadowRoot=null,this.options.onClose&&this.options.onClose()}updateContent(){this.shadowRoot&&(this.shadowRoot.innerHTML=`
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
    `,this.bindEvents())}renderHeader(){return`
      <div class="dp-header">
        <div class="dp-badge">DigitPop Attention Gateway</div>
        <h2 class="dp-title">${this.options.title||"Unlock Full System Access"}</h2>
        <p class="dp-subtitle">Select how you want to unlock candidate opportunities & AI tools</p>
      </div>
    `}renderBody(){return this.currentStage==="WATCHING"?this.renderWatchingStage():this.currentStage==="SUCCESS"?this.renderSuccessStage():`
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
          <div class="dp-card-price">100% Free<span class="dp-price-period">/ 2 Clips</span></div>
          <p class="dp-card-desc">Watch 2 short interactive partner clips to earn instant credits & unlock access.</p>
          <button class="dp-button dp-btn-blue" id="btn-start-watch">Watch Clips (Free)</button>
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
          <span class="dp-watch-status">Playing Sponsored Stream (${this.watchedVideos+1} of ${this.requiredVideos})</span>
          <span class="dp-watch-counter" id="timer-label">15s remaining</span>
        </div>
        <div class="dp-video-screen">
          <div class="dp-video-overlay">
            <div class="dp-pulsing-dot"></div>
            <span>Proof of Attention Verified by DigitPop</span>
          </div>
          <div class="dp-sim-video">
            <div class="dp-brand-watermark">PARTNER SPONSOR</div>
            <div class="dp-ad-title">DigitPop Interactive Experience</div>
            <div class="dp-progress-bar-container">
              <div class="dp-progress-bar-fill" id="progress-bar" style="width: ${this.watchProgress}%;"></div>
            </div>
          </div>
        </div>
        <p class="dp-watch-instruction">Please keep this window active to verify attention credits.</p>
      </div>
    `}renderSuccessStage(){return`
      <div class="dp-success-container">
        <div class="dp-success-icon">\u{1F389}</div>
        <h3 class="dp-success-title">Access Granted!</h3>
        <p class="dp-success-desc">Your candidate attention credits have been verified and applied to your account.</p>
        <button class="dp-button dp-btn-emerald" id="btn-success-continue">Continue to Application</button>
      </div>
    `}renderFooter(){return`
      <div class="dp-footer">
        <span>Powered by <strong style="color: #60a5fa;">DigitPop Attention Platform</strong></span>
        <span>Secure & Anonymous</span>
      </div>
    `}bindEvents(){if(!this.shadowRoot)return;let t=this.shadowRoot.getElementById("backdrop");t&&t.addEventListener("click",g=>{g.target===t&&this.close()});let e=this.shadowRoot.getElementById("btn-close");e&&e.addEventListener("click",()=>this.close());let i=this.shadowRoot.getElementById("btn-buy-pass");i&&i.addEventListener("click",()=>{this.options.onDirectCheckout&&this.options.onDirectCheckout({price:49,productId:"prod_opportunity_os_pro"}),this.close()});let s=this.shadowRoot.getElementById("btn-start-watch");s&&s.addEventListener("click",()=>this.startWatching());let o=this.shadowRoot.getElementById("btn-redeem-tokens");o&&o.addEventListener("click",()=>this.handleTokenRedemption());let l=this.shadowRoot.getElementById("btn-success-continue");l&&l.addEventListener("click",()=>this.close())}async startWatching(){this.currentStage="WATCHING",this.watchProgress=0,this.updateContent(),this.client.ws.connect();let t=6,e=0;this.watchTimer=setInterval(async()=>{if(e+=.5,this.watchProgress=Math.min(100,Math.round(e/t*100)),this.shadowRoot){let i=this.shadowRoot.getElementById("progress-bar");i&&(i.style.width=`${this.watchProgress}%`);let s=this.shadowRoot.getElementById("timer-label");if(s){let o=Math.max(0,Math.ceil(t-e));s.innerText=`${o}s remaining`}}if(e>=t){clearInterval(this.watchTimer),this.watchTimer=null,this.watchedVideos++;try{let i=await this.client.grantAttentionReward(this.creditsPerWatch);this.options.onCreditEarned&&this.options.onCreditEarned({credits:this.creditsPerWatch,totalEarnedCredits:i.earnedCredits,transactionId:`tx_reward_${Date.now()}`,timestamp:new Date().toISOString()})}catch(i){console.error("[DigitPop SDK] Failed to grant reward:",i)}if(this.watchedVideos>=this.requiredVideos){this.currentStage="SUCCESS",this.updateContent();let i={accessType:"VIDEO_ENGAGEMENT",creditsEarned:this.creditsPerWatch*this.requiredVideos,transactionId:`tx_access_${Date.now()}`,timestamp:new Date().toISOString(),userId:this.client.config.userId};this.options.onAccessGranted&&this.options.onAccessGranted(i)}else this.startWatching()}},500)}async handleTokenRedemption(){try{let t=await this.client.redeemTokens(50,this.options.assetId);this.currentStage="SUCCESS",this.updateContent();let e={accessType:"TOKEN_REDEMPTION",tokensSpent:50,transactionId:t.transactionId,timestamp:new Date().toISOString(),userId:this.client.config.userId};this.options.onAccessGranted&&this.options.onAccessGranted(e)}catch(t){alert(`Redemption Notice: ${t.message||"Insufficient PopCoin balance"}`)}}getStyles(){return`
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
    `}};var r=class{constructor(t){this.currentModal=null;if(!t||!t.publicKey)throw new Error("[DigitPop SDK] A valid publicKey (e.g. dp_pub_live_...) is required to initialize.");if(!t.userId)throw new Error("[DigitPop SDK] A valid userId representing the candidate/user is required.");this.config={environment:"production",...t},this.api=new a(this.config),this.ws=new d(this.config)}async getWalletBalance(){return this.api.getWalletBalance(this.config.userId)}openGateway(t={}){this.currentModal&&(this.currentModal.close(),this.currentModal=null);let e=[{type:"DIRECT_PAYMENT",price:49,productId:"prod_opportunity_os_pro",label:"1-Click Instant Pass",description:"Instant full access for 30 days without ads or interruptions."},{type:"VIDEO_ENGAGEMENT",requiredVideos:2,creditsPerWatch:10,label:"Watch-to-Earn (Free)",description:"Watch 2 sponsored partner clips to unlock instant credits."},{type:"TOKEN_REDEMPTION",tokensRequired:50,label:"Redeem PopCoin Tokens",description:"Exchange accumulated attention tokens for free platform passes."}],i={monetizationOptions:t.monetizationOptions||e,...t,onClose:()=>{this.currentModal=null,t.onClose&&t.onClose()}},s=new c(this,i);return s.render(),this.currentModal=s,s}closeGateway(){this.currentModal&&(this.currentModal.close(),this.currentModal=null)}async grantAttentionReward(t=10,e){return this.api.grantAttentionReward({userId:this.config.userId,credits:t,videoId:e})}async redeemTokens(t=50,e){return this.api.redeemTokens({userId:this.config.userId,tokenAmount:t,assetId:e})}destroy(){this.closeGateway(),this.ws.disconnect()}};function h(n){return new r(n)}typeof window<"u"&&(window.DigitPopSDK={DigitPopClient:r,createDigitPop:h});var y=r;return v(x);})();
//# sourceMappingURL=digitpop-sdk.global.global.js.map