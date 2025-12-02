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
 * 
 * Manages the WebSocket connection lifecycle:
 * - Establishes connection with authentication
 * - Handles automatic reconnection on failure
 * - Processes incoming bike updates (binary data)
 * - Sends viewport bounds to server
 * - Manages graceful disconnection
 * 
 * The server sends bike data only for bikes within the viewport bounds
 * to optimize bandwidth and performance.
 */
export class WebSocketManager {
  /** WebSocket connection instance */
  private ws: WebSocket | null = null;
  
  /** Number of reconnection attempts made */
  private reconnectAttempts = 0;
  
  /** Maximum number of reconnection attempts before giving up */
  private maxReconnectAttempts = 5;
  
  /** Base delay between reconnection attempts (increases with each attempt) */
  private reconnectDelay = 3000; // 3 seconds
  
  /** Timer for scheduled reconnection */
  private reconnectTimer: NodeJS.Timeout | null = null;
  
  /** Callback function to handle bike updates */
  private onBikeUpdate: BikeUpdateCallback | null = null;
  
  /** Flag to prevent reconnection when user intentionally closes connection */
  private isIntentionallyClosed = false;

  /**
   * Connect to WebSocket server
   * 
   * Initiates the WebSocket connection with the server.
   * The connection is authenticated using the session ID from login.
   * 
   * @param onBikeUpdate - Callback function to handle bike updates
   */
  connect(onBikeUpdate: BikeUpdateCallback): void {
    this.onBikeUpdate = onBikeUpdate;
    this.isIntentionallyClosed = false;
    this.createConnection();
  }

  /**
   * Create WebSocket connection
   * 
   * Internal method that:
   * 1. Gets session ID from storage (authentication)
   * 2. Builds WebSocket URL with auth query parameter
   * 3. Creates WebSocket instance
   * 4. Sets up event handlers
   * 5. Schedules reconnection if connection fails
   */
  private createConnection(): void {
    // Get session ID for authentication
    const sessionId = getSessionId();
    
    if (!sessionId) {
      console.error('❌ No session ID found. Cannot connect to WebSocket.');
      return;
    }

    // Build WebSocket URL with authorization query parameter
    // Server validates this session ID before accepting connection
    const wsUrl = `${WS_BASE_URL}?authorization=${encodeURIComponent(sessionId)}`;
    
    console.log('🔌 Connecting to WebSocket:', wsUrl);

    try {
      // Create new WebSocket connection
      this.ws = new WebSocket(wsUrl);
      this.setupEventHandlers(wsUrl, sessionId);
    } catch (error) {
      console.error('❌ Failed to create WebSocket:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * Setup WebSocket event handlers
   * 
   * Configures handlers for all WebSocket lifecycle events:
   * - onopen: Connection established successfully
   * - onmessage: Received data from server (bike updates)
   * - onerror: Connection error occurred
   * - onclose: Connection closed (intentionally or due to error)
   */
  private setupEventHandlers(wsUrl: string, sessionId: string): void {
    if (!this.ws) return;

    // Event: Connection opened successfully
    this.ws.onopen = () => {
      console.log('✅ WebSocket connected');
      this.reconnectAttempts = 0; // Reset reconnect counter on successful connection
    };

    // Event: Message received from server
    this.ws.onmessage = (event) => {
      this.handleMessage(event);
    };

    // Event: Connection error
    this.ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      console.error('❌ WebSocket URL was:', wsUrl);
      console.error('❌ Session ID:', sessionId);
    };

    // Event: Connection closed
    this.ws.onclose = (event) => {
      console.log('🔌 WebSocket closed:', event.code, event.reason, 'clean?', event.wasClean);
      console.log('🔌 Close codes: 1000=Normal, 1006=Abnormal, 1008=Policy, 1011=Server error');
      
      // Only attempt reconnect if not intentionally closed by user
      if (!this.isIntentionallyClosed) {
        this.scheduleReconnect();
      }
    };
  }

  /**
   * Handle incoming WebSocket messages
   * 
   * Processes different message types from server:
   * 1. Binary (ArrayBuffer): Bike location updates - most common
   * 2. Blob: Binary data in blob format - converted to ArrayBuffer
   * 3. Text (string): Server messages or notifications
   * 
   * Bike updates are sent as binary data for efficiency.
   * The binary format is decoded using the BinaryDecoder utility.
   */
  private handleMessage(event: MessageEvent): void {
    // Case 1: Binary message (ArrayBuffer) - Bike updates
    if (event.data instanceof ArrayBuffer) {
      const bytes = new Uint8Array(event.data);
      const updates = decodeBikeUpdates(bytes); // Decode binary format
      console.log('🔄 Received bike updates:', updates.length, 'bikes');
      
      if (this.onBikeUpdate) {
        this.onBikeUpdate(updates);
      }
      return;
    }

    // Case 2: Blob message - Convert to ArrayBuffer then decode
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

    // Case 3: Text message - Server notifications or status messages
    if (typeof event.data === 'string') {
      console.log('📄 Text message from server:', event.data);
      return;
    }

    // Unknown message type
    console.warn('⚠️ Unknown message type:', event.data);
  }

  /**
   * Send viewport bounds to server
   * 
   * Tells the server which area of the map is currently visible.
   * Server responds by sending bike updates only for bikes within this viewport.
   * This optimizes bandwidth by not sending data for bikes outside the visible area.
   * 
   * Call this when:
   * - Map is first loaded
   * - User pans the map
   * - User zooms in/out
   * 
   * @param bounds - Current map viewport boundaries (lat/long)
   */
  sendViewport(bounds: ViewportBounds): void {
    // Guard: Only send if connection is open
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('⚠️ WebSocket not open, cannot send viewport');
      return;
    }

    // Build viewport message
    const message = {
      maxLong: bounds.maxLong, // Eastern boundary
      minLong: bounds.minLong, // Western boundary
      maxLat: bounds.maxLat,   // Northern boundary
      minLat: bounds.minLat,   // Southern boundary
    };

    // Send as JSON string
    this.ws.send(JSON.stringify(message));
    console.log('📤 Sent viewport:', message);
  }

  /**
   * Schedule reconnection attempt
   * 
   * Uses exponential backoff strategy:
   * - Attempt 1: 3 seconds
   * - Attempt 2: 6 seconds
   * - Attempt 3: 9 seconds
   * - etc.
   * 
   * Gives up after maxReconnectAttempts (5 by default)
   */
  private scheduleReconnect(): void {
    // Check if we've exceeded max attempts
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnect attempts reached. Giving up.');
      return;
    }

    // Increment attempt counter
    this.reconnectAttempts++;
    
    // Calculate delay with exponential backoff
    const delay = this.reconnectDelay * this.reconnectAttempts;
    
    console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    // Schedule reconnection
    this.reconnectTimer = setTimeout(() => {
      this.createConnection();
    }, delay);
  }

  /**
   * Close WebSocket connection
   * 
   * Gracefully disconnects from server:
   * - Marks as intentionally closed (prevents auto-reconnect)
   * - Cancels any pending reconnection attempts
   * - Closes the WebSocket connection
   * 
   * Call this when:
   * - User logs out
   * - Component unmounts
   * - App is closing
   */
  disconnect(): void {
    // Mark as intentionally closed to prevent reconnection
    this.isIntentionallyClosed = true;
    
    // Cancel any pending reconnection
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Close WebSocket connection
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    console.log('🔌 WebSocket disconnected');
  }

  /**
   * Check if WebSocket is connected
   * 
   * @returns true if connection is open and ready to send/receive
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

/**
 * Singleton instance for global WebSocket management
 */
export const websocketManager = new WebSocketManager();
