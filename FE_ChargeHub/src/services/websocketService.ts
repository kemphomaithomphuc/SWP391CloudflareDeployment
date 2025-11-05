import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
// @ts-ignore - sockjs-client types issue
import SockJS from 'sockjs-client';

// Base URL for WebSocket connection - use same as API
const WS_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// NotificationSignalDTO interface - định nghĩa cấu trúc dữ liệu nhận từ BE
export interface NotificationSignalDTO {
  notificationId: number;
  title: string;
  content: string;
  sentTime: string;
  type: "BOOKING" | "PAYMENT" | "ISSUE" | "GENERAL" | "PENALTY";
  isRead: boolean;
  userId: number;
}

// Callback type for handling incoming notifications
export type NotificationCallback = (notification: NotificationSignalDTO) => void;

class WebSocketService {
  private client: Client | null = null;
  private subscription: StompSubscription | null = null;
  private isConnecting: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 3000; // 3 seconds
  private notificationCallback: NotificationCallback | null = null;

  /**
   * Connect to WebSocket server
   */
  connect(token: string, onNotification: NotificationCallback): Promise<void> {
    return new Promise((resolve, reject) => {
      // Validate token before connecting
      if (!token || token.trim() === '') {
        console.log('⚠️ No valid token provided, skipping WebSocket connection');
        reject(new Error('No authentication token provided'));
        return;
      }

      if (this.client?.connected) {
        console.log('WebSocket already connected');
        resolve();
        return;
      }

      if (this.isConnecting) {
        console.log('WebSocket connection already in progress');
        return;
      }

      this.isConnecting = true;
      this.notificationCallback = onNotification;

      console.log('=== WebSocket Connection Debug ===');
      console.log('Connecting to WebSocket...');
      console.log('WebSocket URL:', `${WS_BASE_URL}/api/notifications/connection/ws`);
      console.log('Token (first 20 chars):', token ? token.substring(0, 20) + '...' : 'NO TOKEN');
      console.log('Token length:', token ? token.length : 0);

      // Create STOMP client with SockJS
      this.client = new Client({
        webSocketFactory: () => {
          // Create SockJS with custom headers
          return new SockJS(`${WS_BASE_URL}/api/notifications/connection/ws`, null, {
            transports: ['websocket', 'xhr-streaming', 'xhr-polling'],
          });
        },
        connectHeaders: {
          Authorization: `Bearer ${token}`,
        },
        debug: (str) => {
          console.log('STOMP Debug:', str);
        },
        reconnectDelay: 0, // Disable automatic reconnection
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => {
          console.log('✅ WebSocket Connected successfully!');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.subscribeToNotifications();
          resolve();
        },
        onStompError: (frame) => {
          console.error('❌ STOMP Error:', frame.headers['message']);
          console.error('Error details:', frame.body);
          this.isConnecting = false;
          // Don't attempt reconnection on authentication errors
          reject(new Error(frame.headers['message'] || 'STOMP connection error'));
        },
        onWebSocketError: (event) => {
          console.error('❌ WebSocket Error:', event);
          this.isConnecting = false;
          reject(new Error('WebSocket connection error'));
        },
        onDisconnect: () => {
          console.log('⚠️ WebSocket Disconnected');
          this.isConnecting = false;
          // Don't automatically reconnect - let the application decide
        },
      });

      // Activate the client
      this.client.activate();
    });
  }

  /**
   * Subscribe to user-specific notification queue
   */
  private subscribeToNotifications(): void {
    if (!this.client?.connected) {
      console.error('Cannot subscribe: WebSocket not connected');
      return;
    }

    console.log('Subscribing to notifications...');

    // Subscribe to user-specific queue
    this.subscription = this.client.subscribe('/user/queue/notifications', (message: IMessage) => {
      try {
        console.log('📩 Received notification:', message.body);
        const notification: NotificationSignalDTO = JSON.parse(message.body);
        
        // Call the callback function to handle the notification
        if (this.notificationCallback) {
          this.notificationCallback(notification);
        }
      } catch (error) {
        console.error('Error parsing notification:', error);
      }
    });

    console.log('✅ Subscribed to /user/queue/notifications');
  }

  /**
   * Handle reconnection logic
   */
  private handleReconnect(token: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached. Please refresh the page.');
      return;
    }

    this.reconnectAttempts++;
    console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    setTimeout(() => {
      if (this.notificationCallback) {
        this.connect(token, this.notificationCallback).catch((error) => {
          console.error('Reconnection failed:', error);
        });
      }
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    console.log('Disconnecting WebSocket...');
    
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }

    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }

    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.notificationCallback = null;
    
    console.log('✅ WebSocket disconnected');
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.client?.connected ?? false;
  }

  /**
   * Send a message to the server (optional - if needed)
   */
  sendMessage(destination: string, body: any): void {
    if (!this.client?.connected) {
      console.error('Cannot send message: WebSocket not connected');
      return;
    }

    this.client.publish({
      destination,
      body: JSON.stringify(body),
    });
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
