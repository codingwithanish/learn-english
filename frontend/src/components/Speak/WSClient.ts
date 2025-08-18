import type { 
  WSIncomingMessage, 
  WSOutgoingMessage, 
  WSAckMessage, 
  WSInterimMessage, 
  WSProcessingMessage, 
  WSFinalMessage,
  SpeakType
} from '@/types';

interface SessionConfig {
  subject: string;
  speak_time: number;
  type: SpeakType;
}

type ConnectionState = 'CONNECTING' | 'CONNECTED' | 'CLOSING' | 'DISCONNECTED' | 'UNKNOWN';

type EventHandler<T = any> = (data: T) => void;

class WSClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000; // Start with 1 second
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isConnected: boolean = false;
  
  // Event handlers
  public onOpen: EventHandler<Event> | null = null;
  public onClose: EventHandler<CloseEvent> | null = null;
  public onError: EventHandler<Event | Error> | null = null;
  public onAck: EventHandler<WSAckMessage> | null = null;
  public onInterim: EventHandler<WSInterimMessage> | null = null;
  public onProcessing: EventHandler<WSProcessingMessage> | null = null;
  public onFinal: EventHandler<WSFinalMessage> | null = null;
  public onMessage: EventHandler<WSIncomingMessage> | null = null;
  
  // Session data
  private sessionId: string | null = null;
  private token: string | null = null;

  connect(token: string, sessionId?: string): void {
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      console.log('WebSocket already connecting or connected');
      return;
    }

    this.token = token;
    this.sessionId = sessionId || null;

    const baseUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';
    const wsUrl = sessionId 
      ? `${baseUrl}/ws/speak?token=${token}&session_id=${sessionId}`
      : `${baseUrl}/ws/speak?token=${token}`;

    try {
      this.ws = new WebSocket(wsUrl);
      this.setupEventHandlers();
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      if (this.onError) {
        this.onError(error instanceof Error ? error : new Error(String(error)));
      }
    }
  }

  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = (event: Event): void => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      
      if (this.onOpen) {
        this.onOpen(event);
      }
    };

    this.ws.onclose = (event: CloseEvent): void => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      this.isConnected = false;
      this.stopHeartbeat();
      
      if (this.onClose) {
        this.onClose(event);
      }

      // Attempt reconnection if not a normal closure
      if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.attemptReconnect();
      }
    };

    this.ws.onerror = (error: Event): void => {
      console.error('WebSocket error:', error);
      if (this.onError) {
        this.onError(error);
      }
    };

    this.ws.onmessage = (event: MessageEvent): void => {
      try {
        const message: WSIncomingMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };
  }

  private handleMessage(message: WSIncomingMessage): void {
    if (this.onMessage) {
      this.onMessage(message);
    }

    switch (message.type) {
      case 'ack':
        this.sessionId = message.session_id;
        if (this.onAck) {
          this.onAck(message);
        }
        break;
        
      case 'interim':
        if (this.onInterim) {
          this.onInterim(message);
        }
        break;
        
      case 'processing':
        if (this.onProcessing) {
          this.onProcessing(message);
        }
        break;
        
      case 'final':
        if (this.onFinal) {
          this.onFinal(message);
        }
        break;
        
      case 'error':
        console.error('WebSocket server error:', message);
        if (this.onError) {
          this.onError(new Error(message.message || 'Server error'));
        }
        break;
        
      default:
        console.log('Unknown message type:', message);
    }
  }

  private sendMessage(message: WSOutgoingMessage): boolean {
    if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected, cannot send message');
      return false;
    }

    try {
      this.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
      return false;
    }
  }

  startSession(config: SessionConfig): boolean {
    return this.sendMessage({
      type: 'start',
      config: config
    });
  }

  sendAudioChunk(audioData: string, sequence: number): boolean {
    return this.sendMessage({
      type: 'audio',
      sequence: sequence,
      payload_b64: audioData
    });
  }

  stopSession(): boolean {
    if (!this.sessionId) {
      console.warn('No session ID available for stop message');
      return false;
    }

    return this.sendMessage({
      type: 'stop',
      session_id: this.sessionId
    });
  }

  private ping(): boolean {
    return this.sendMessage({
      type: 'ping'
    } as WSOutgoingMessage);
  }

  private startHeartbeat(): void {
    // Send ping every 30 seconds to keep connection alive
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        this.ping();
      }
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private attemptReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
    
    console.log(`Attempting to reconnect in ${delay}ms... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      if (this.token) {
        this.connect(this.token, this.sessionId || undefined);
      }
    }, delay);
  }

  disconnect(): void {
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting');
      this.ws = null;
    }
    
    this.isConnected = false;
    this.sessionId = null;
    this.reconnectAttempts = 0;
  }

  getConnectionState(): ConnectionState {
    if (!this.ws) return 'DISCONNECTED';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'CONNECTING';
      case WebSocket.OPEN:
        return 'CONNECTED';
      case WebSocket.CLOSING:
        return 'CLOSING';
      case WebSocket.CLOSED:
        return 'DISCONNECTED';
      default:
        return 'UNKNOWN';
    }
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  isConnectedState(): boolean {
    return this.isConnected;
  }
}

export default WSClient;