/**
 * WebSocket Service
 * Manages real-time bike updates via WebSocket connection
 * Sends viewport updates when map moves and receives bike telemetry
 */

import { BikeUpdate } from '@trungthao/admin_dashboard_dto';
import { decodeBikeUpdates } from '../utlities/BindaryDecoder';
import { getSessionId } from './apiClient';

/** WebSocket base URL from environment variables */
const WS_BASE_URL = (import.meta as any).env.VITE_WS_BASE_URL || 'ws://still-simply-katydid.ngrok.app/GoScoot/WebSocket/ws';

/** Map viewport bounds */
export interface ViewportBounds {
  maxLong: number;
  minLong: number;
  maxLat: number;
  minLat: number;
}

/** Callback for receiving bike updates */
export type BikeUpdateCallback = (bikes: BikeUpdate[]) => void;

/**
 * WebSocket Manager Class
 * Handles connection, reconnection, and message handling
 */
export class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000; // 3 seconds
  private reconnectTimer: NodeJS.Timeout | null = null;
  private onBikeUpdate: BikeUpdateCallback | null = null;
  private isIntentionallyClosed = false;

  /**
   * Connect to WebSocket server
   * @param onBikeUpdate - Callback function to handle bike updates
   */
  connect(onBikeUpdate: BikeUpdateCallback): void {
    this.onBikeUpdate = onBikeUpdate;
    this.isIntentionallyClosed = false;
    this.createConnection();
  }

  /**
   * Create WebSocket connection
   */
  private createConnection(): void {
    const sessionId = getSessionId();
    
    if (!sessionId) {
      console.error('❌ No session ID found. Cannot connect to WebSocket.');
      return;
    }

    // Build WebSocket URL with authorization query parameter
    const wsUrl = `${WS_BASE_URL}?authorization=${encodeURIComponent(sessionId)}`;
    
    console.log('🔌 Connecting to WebSocket:', wsUrl);

    try {
      this.ws = new WebSocket(wsUrl);
      this.setupEventHandlers(wsUrl, sessionId);
    } catch (error) {
      console.error('❌ Failed to create WebSocket:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupEventHandlers(wsUrl: string, sessionId: string): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('✅ WebSocket connected');
      this.reconnectAttempts = 0; // Reset reconnect counter on successful connection
    };

    this.ws.onmessage = (event) => {
      this.handleMessage(event);
    };

    this.ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      console.error('❌ WebSocket URL was:', wsUrl);
      console.error('❌ Session ID:', sessionId);
    };

    this.ws.onclose = (event) => {
      console.log('🔌 WebSocket closed:', event.code, event.reason, 'clean?', event.wasClean);
      console.log('🔌 Close codes: 1000=Normal, 1006=Abnormal, 1008=Policy, 1011=Server error');
      
      // Only attempt reconnect if not intentionally closed
      if (!this.isIntentionallyClosed) {
        this.scheduleReconnect();
      }
    };
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(event: MessageEvent): void {
    // Handle binary messages (bike updates)
    if (event.data instanceof ArrayBuffer) {
      const bytes = new Uint8Array(event.data);
      const updates = decodeBikeUpdates(bytes);
      console.log('🔄 Received bike updates:', updates.length, 'bikes');
      
      if (this.onBikeUpdate) {
        this.onBikeUpdate(updates);
      }
      return;
    }

    // Handle Blob messages
    if (event.data instanceof Blob) {
      event.data.arrayBuffer().then((buf) => {
        const bytes = new Uint8Array(buf);
        const updates = decodeBikeUpdates(bytes);
        console.log('🔄 Received bike updates:', updates.length, 'bikes');
        
        if (this.onBikeUpdate) {
          this.onBikeUpdate(updates);
        }
      });
      return;
    }

    // Handle text messages
    if (typeof event.data === 'string') {
      console.log('📄 Text message from server:', event.data);
      return;
    }

    console.warn('⚠️ Unknown message type:', event.data);
  }

  /**
   * Send viewport bounds to server
   * Call this when map moves (pan, zoom)
   */
  sendViewport(bounds: ViewportBounds): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('⚠️ WebSocket not open, cannot send viewport');
      return;
    }

    const message = {
      maxLong: bounds.maxLong,
      minLong: bounds.minLong,
      maxLat: bounds.maxLat,
      minLat: bounds.minLat,
    };

    this.ws.send(JSON.stringify(message));
    console.log('📤 Sent viewport:', message);
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnect attempts reached. Giving up.');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;
    
    console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.createConnection();
    }, delay);
  }

  /**
   * Close WebSocket connection
   */
  disconnect(): void {
    this.isIntentionallyClosed = true;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    console.log('🔌 WebSocket disconnected');
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

/**
 * Singleton instance for global WebSocket management
 */
export const websocketManager = new WebSocketManager();
