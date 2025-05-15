import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

class WebSocketService {
  constructor() {
    this.client = null;
    this.subscriptions = new Map();
    this.commentCallbacks = new Map();
    this.connectAttempts = 0;
    this.maxConnectAttempts = 10;
    this.reconnecting = false;
    this.userId = null;
    this.connectionPromise = null;
    this.pendingSubscriptions = [];
    this.connectionStatus = "disconnected"; // Add connection status tracking
    this.connectionListeners = [];
  }

  // Add listener for connection status changes
  addConnectionListener(listener) {
    this.connectionListeners.push(listener);
    // Immediately notify of current status
    listener(this.connectionStatus);
    return () => {
      this.connectionListeners = this.connectionListeners.filter(
        (l) => l !== listener
      );
    };
  }

  // Update connection status and notify listeners
  setConnectionStatus(status) {
    this.connectionStatus = status;
    this.connectionListeners.forEach((listener) => listener(status));
  }

  connect(userId) {
    if (this.client) {
      this.disconnect();
    }

    this.userId = userId;
    this.connectAttempts = 0;
    this.setConnectionStatus("connecting");

    this.connectionPromise = new Promise((resolve, reject) => {
      this.resolveConnection = resolve;
      this.rejectConnection = reject;
    });

    this.connectWithRetry(userId);
    return this.connectionPromise;
  }

  connectWithRetry(userId) {
    if (this.connectAttempts >= this.maxConnectAttempts) {
      console.warn(
        "Max connection attempts reached. Giving up on WebSocket connection."
      );
      this.reconnecting = false;
      this.setConnectionStatus("failed");
      if (this.rejectConnection) {
        this.rejectConnection("Max connection attempts reached");
      }
      return;
    }

    this.connectAttempts++;
    this.reconnecting = true;

    try {
      this.client = new Client({
        webSocketFactory: () => {
          console.log("Opening Web Socket...");
          // Simplified connection without token
          const socket = new SockJS("http://localhost:8081/ws");

          socket.onerror = (error) => {
            console.error("WebSocket connection error:", error);
          };

          return socket;
        },
        debug: (str) => {
          if (
            str.includes("error") ||
            str.includes("failed") ||
            str.includes("connect")
          ) {
            console.log(str);
          }
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 8000,
        heartbeatOutgoing: 8000,
        connectionTimeout: 15000,
      });

      this.client.onConnect = () => {
        console.log("Connected to WebSocket");
        this.connectAttempts = 0;
        this.reconnecting = false;
        this.setConnectionStatus("connected");

        // Resolve the connection promise
        if (this.resolveConnection) {
          this.resolveConnection(true);
        }

        // Re-subscribe to all previous subscriptions after reconnect
        this.resubscribeAll(userId);

        // Subscribe to user-specific notifications
        if (userId) {
          try {
            this.client.subscribe(
              `/user/${userId}/queue/notifications`,
              (message) => {
                if (this.notificationCallback) {
                  try {
                    const notification = JSON.parse(message.body);
                    this.notificationCallback(notification);
                  } catch (error) {
                    console.error("Error parsing notification:", error);
                  }
                }
              },
              { id: `notifications-${userId}` }
            );
          } catch (error) {
            console.error("Error subscribing to notifications:", error);
          }
        }

        // Process any pending subscriptions
        this.processPendingSubscriptions();
      };

      this.client.onStompError = (frame) => {
        console.error("STOMP protocol error:", frame.headers["message"]);
        this.setConnectionStatus("error");
        if (this.rejectConnection) {
          this.rejectConnection("STOMP protocol error");
        }
      };

      this.client.onWebSocketError = (event) => {
        console.error("WebSocket error. Will attempt to reconnect shortly.");
        this.setConnectionStatus("error");
        this.scheduleReconnect(userId);
      };

      this.client.onWebSocketClose = () => {
        if (!this.reconnecting) {
          console.log("WebSocket closed. Will attempt to reconnect.");
          this.setConnectionStatus("disconnected");
          this.scheduleReconnect(userId);
        }
      };

      this.client.onDisconnect = () => {
        console.log("Disconnected from WebSocket");
        this.setConnectionStatus("disconnected");
      };

      this.client.activate();
    } catch (error) {
      console.error("Error activating WebSocket client:", error);
      this.setConnectionStatus("error");
      this.scheduleReconnect(userId);
      if (this.rejectConnection) {
        this.rejectConnection(error);
      }
    }
  }

  scheduleReconnect(userId) {
    if (!this.reconnecting && this.connectAttempts < this.maxConnectAttempts) {
      this.reconnecting = true;
      this.setConnectionStatus("reconnecting");
      console.log(`STOMP: scheduling reconnection in 5000ms`);
      setTimeout(() => {
        this.connectWithRetry(userId);
      }, 5000);
    }
  }

  resubscribeAll(userId) {
    // Restore comment subscriptions
    for (const [postId, callback] of this.commentCallbacks.entries()) {
      this._subscribeToCommentsInternal(postId, callback);
    }
  }

  disconnect() {
    this.reconnecting = false;
    if (this.client) {
      try {
        // Clean up subscriptions first
        this.subscriptions.forEach((subscription) => {
          if (subscription && subscription.unsubscribe) {
            subscription.unsubscribe();
          }
        });
        this.subscriptions.clear();

        this.client.deactivate();
        this.setConnectionStatus("disconnected");
      } catch (error) {
        console.error("Error during WebSocket disconnect:", error);
      }
      this.client = null;
      this.connectionPromise = null;
    }
  }

  setNotificationCallback(callback) {
    this.notificationCallback = callback;
  }

  setReactionCallback(callback) {
    this.reactionCallback = callback;
  }

  processPendingSubscriptions() {
    // Process any subscriptions that were attempted while not connected
    while (this.pendingSubscriptions.length > 0) {
      const { postId, callback } = this.pendingSubscriptions.shift();
      this._subscribeToCommentsInternal(postId, callback);
    }
  }

  subscribeToComments(postId, callback) {
    if (!postId) {
      console.warn("Cannot subscribe to comments: missing postId");
      return { success: false };
    }

    // Store callback for this post regardless of connection status
    this.commentCallbacks.set(postId, callback);

    if (!this.isConnected()) {
      console.log(
        `Queueing subscription to comments for post ${postId} for when connection is established`
      );
      // Store the pending subscription without adding duplicates
      if (!this.pendingSubscriptions.some((sub) => sub.postId === postId)) {
        this.pendingSubscriptions.push({ postId, callback });
      }
      return { success: false, queued: true };
    }

    return { success: this._subscribeToCommentsInternal(postId, callback) };
  }

  _subscribeToCommentsInternal(postId, callback) {
    try {
      if (!this.client || !this.client.active) {
        console.log(
          `Cannot subscribe to comments for post ${postId}: Not connected`
        );
        return false;
      }

      // Check if already subscribed to avoid duplicates
      if (this.subscriptions.has(postId)) {
        console.log(`Already subscribed to comments for post ${postId}`);
        return true;
      }

      // Subscribe to comment updates for this post
      const subscription = this.client.subscribe(
        `/topic/posts/${postId}/comments`,
        (message) => {
          try {
            const update = JSON.parse(message.body);
            const callback = this.commentCallbacks.get(postId);
            if (callback) {
              callback(update);
            }
          } catch (error) {
            console.error("Error processing comment update:", error);
          }
        },
        { id: `post-comments-${postId}` }
      );

      this.subscriptions.set(postId, subscription);
      console.log(`Successfully subscribed to comments for post ${postId}`);
      return true;
    } catch (error) {
      console.error(
        `Failed to subscribe to comments for post ${postId}:`,
        error
      );
      return false;
    }
  }

  unsubscribeFromComments(postId) {
    const subscription = this.subscriptions.get(postId);
    if (subscription) {
      try {
        subscription.unsubscribe();
        console.log(`Unsubscribed from comments for post ${postId}`);
      } catch (error) {
        console.error(`Error unsubscribing from post ${postId}:`, error);
      }
      this.subscriptions.delete(postId);
      this.commentCallbacks.delete(postId);
    }

    // Also remove from pending subscriptions if it exists there
    this.pendingSubscriptions = this.pendingSubscriptions.filter(
      (item) => item.postId !== postId
    );
  }

  // Helper method to check connection status
  isConnected() {
    return this.client && this.client.active;
  }

  // Method to force reconnection (useful after token refresh)
  refreshConnection() {
    if (this.userId) {
      return this.connect(this.userId);
    }
    return Promise.reject("No user ID set");
  }

  // Wait for connection before subscribing
  async waitForConnection(timeout = 5000) {
    if (this.isConnected()) {
      return true;
    }

    if (!this.connectionPromise) {
      if (this.userId) {
        this.connectionPromise = this.connect(this.userId);
      } else {
        return false;
      }
    }

    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Connection timeout")), timeout);
      });

      return await Promise.race([this.connectionPromise, timeoutPromise]);
    } catch (error) {
      console.error("Connection wait failed:", error);
      return false;
    }
  }
}

export default new WebSocketService();
