import { DigitPopConfig } from '../types';

export type WebSocketListener = (data: any) => void;

export class WebSocketClient {
  private config: DigitPopConfig;
  private ws: any = null; // Browser WebSocket or isomorphic
  private listeners: Set<WebSocketListener> = new Set();
  private isConnecting: boolean = false;
  private reconnectTimer: any = null;

  constructor(config: DigitPopConfig) {
    this.config = config;
  }

  private resolveWsUrl(): string {
    if (this.config.wsUrl) {
      return this.config.wsUrl.replace(/\/+$/, '');
    }
    if (this.config.environment === 'staging') {
      return 'wss://digitpop-server-staging.up.railway.app';
    }
    return 'wss://digitpop-server-staging.up.railway.app';
  }

  /**
   * Connect to DigitPop WebSocket Stream Gateway
   */
  connect(): void {
    if (typeof window === 'undefined' || typeof window.WebSocket === 'undefined') {
      return; // SSR or non-browser environment
    }

    if (this.ws && (this.ws.readyState === 0 || this.ws.readyState === 1)) {
      return;
    }

    this.isConnecting = true;
    const baseWs = this.resolveWsUrl();
    const targetUrl = `${baseWs}/${encodeURIComponent(this.config.userId)}`;

    try {
      this.ws = new window.WebSocket(targetUrl, `${this.config.userId}-player`);

      this.ws.onopen = () => {
        this.isConnecting = false;
        // Register user connection
        this.send({
          data: {
            trigger: 'login',
            value: this.config.userId,
          },
        });
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const payload = JSON.parse(event.data);
          this.notifyListeners(payload);
        } catch {
          // Non-JSON payload
        }
      };

      this.ws.onerror = (_err: any) => {
        this.isConnecting = false;
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        this.ws = null;
      };
    } catch (err) {
      this.isConnecting = false;
      console.warn('[DigitPop SDK] WebSocket connection failed:', err);
    }
  }

  send(data: any): void {
    if (this.ws && this.ws.readyState === 1) {
      this.ws.send(typeof data === 'string' ? data : JSON.stringify(data));
    }
  }

  subscribe(listener: WebSocketListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(data: any): void {
    this.listeners.forEach((fn) => {
      try {
        fn(data);
      } catch (err) {
        console.error('[DigitPop SDK] Error in WebSocket listener:', err);
      }
    });
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
  }
}
