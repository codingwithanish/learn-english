class WSClient {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
    this.heartbeatInterval = null;
    this.isConnected = false;
    
    // Event handlers
    this.onOpen = null;
    this.onClose = null;
    this.onError = null;
    this.onAck = null;
    this.onInterim = null;
    this.onProcessing = null;
    this.onFinal = null;
    this.onMessage = null;
    
    // Session data
    this.sessionId = null;
    this.token = null;
  }

  connect(token, sessionId = null) {
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      console.log('WebSocket already connecting or connected');
      return;
    }

    this.token = token;
    this.sessionId = sessionId;

    const wsUrl = sessionId 
      ? `ws://localhost:8000/ws/speak?token=${token}&session_id=${sessionId}`
      : `ws://localhost:8000/ws/speak?token=${token}`;

    try {
      this.ws = new WebSocket(wsUrl);
      this.setupEventHandlers();
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      if (this.onError) {
        this.onError(error);
      }
    }
  }

  setupEventHandlers() {
    if (!this.ws) return;

    this.ws.onopen = (event) => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      
      if (this.onOpen) {
        this.onOpen(event);
      }
    };

    this.ws.onclose = (event) => {
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

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      if (this.onError) {
        this.onError(error);
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };
  }

  handleMessage(message) {
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
        
      case 'pong':
        // Heartbeat response - connection is alive
        break;
        
      default:
        console.log('Unknown message type:', message.type, message);
    }
  }

  sendMessage(message) {
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

  startSession(config) {
    return this.sendMessage({
      type: 'start',
      session_id: this.sessionId,
      config: config
    });
  }

  sendAudioChunk(audioData, sequence) {
    return this.sendMessage({
      type: 'audio',
      sequence: sequence,
      payload_b64: audioData
    });
  }

  stopSession() {
    return this.sendMessage({
      type: 'stop',
      session_id: this.sessionId
    });
  }

  ping() {
    return this.sendMessage({
      type: 'ping'
    });
  }

  startHeartbeat() {
    // Send ping every 30 seconds to keep connection alive
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        this.ping();
      }
    }, 30000);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  attemptReconnect() {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
    
    console.log(`Attempting to reconnect in ${delay}ms... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      if (this.token) {
        this.connect(this.token, this.sessionId);
      }
    }, delay);
  }

  disconnect() {
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting');
      this.ws = null;
    }
    
    this.isConnected = false;
    this.sessionId = null;
    this.reconnectAttempts = 0;
  }

  getConnectionState() {
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
}

export default WSClient;