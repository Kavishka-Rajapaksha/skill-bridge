import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

class WebSocketService {
  constructor() {
    this.client = null;
    this.subscriptions = new Map();
    this.commentCallbacks = new Map();
  }

  connect(userId) {
    if (this.client) {
      this.disconnect();
    }

    this.client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8081/ws"),
      debug: (str) => {
        console.log(str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = () => {
      console.log("Connected to WebSocket");

      // Subscribe to user-specific notifications
      this.client.subscribe(
        `/user/${userId}/queue/notifications`,
        (message) => {
          if (this.notificationCallback) {
            const notification = JSON.parse(message.body);
            this.notificationCallback(notification);
          }
        }
      );
    };

    this.client.activate();
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
  }

  setNotificationCallback(callback) {
    this.notificationCallback = callback;
  }

  setReactionCallback(callback) {
    this.reactionCallback = callback;
  }

  subscribeToComments(postId, callback) {
    if (!this.client || !this.client.connected) {
      return;
    }

    // Store callback for this post
    this.commentCallbacks.set(postId, callback);

    // Subscribe to comment updates for this post
    const subscription = this.client.subscribe(
      `/topic/posts/${postId}/comments`,
      (message) => {
        const update = JSON.parse(message.body);
        const callback = this.commentCallbacks.get(postId);
        if (callback) {
          callback(update);
        }
      }
    );

    this.subscriptions.set(postId, subscription);
  }

  unsubscribeFromComments(postId) {
    const subscription = this.subscriptions.get(postId);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(postId);
      this.commentCallbacks.delete(postId);
    }
  }
}

export default new WebSocketService();
