package com.example.backend.service;

import com.example.backend.model.Notification;
import com.example.backend.repository.NotificationRepository;
import com.example.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.ArrayList;
import java.util.Date;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    private String getNotificationContent(String type, String actorName, String targetType) {
        switch (type) {
            case "LIKE":
                return actorName + " liked your " + targetType;
            case "COMMENT":
                return actorName + " commented on your " + targetType;
            case "REPLY":
                return actorName + " replied to your comment";
            default:
                return actorName + " interacted with your " + targetType;
        }
    }

    public void createNotification(String userId, String type, String content, String sourceId, String sourceUserId) {
        // Don't create notification if user is acting on their own content
        if (userId.equals(sourceUserId)) {
            return;
        }

        try {
            Notification notification = new Notification();
            notification.setUserId(userId);
            notification.setType(type);
            notification.setContent(content);
            notification.setSourceId(sourceId);
            notification.setSourceUserId(sourceUserId);
            notification.setCreatedAt(new Date());
            notification.setRead(false);

            Notification savedNotification = notificationRepository.save(notification);

            // Send real-time notification via WebSocket
            messagingTemplate.convertAndSendToUser(
                    userId,
                    "/queue/notifications",
                    savedNotification);

            // Send comment update to all users viewing the post for COMMENT type
            if (type.equals("COMMENT") || type.equals("REPLY")) {
                CommentUpdateMessage updateMsg = new CommentUpdateMessage(sourceId, type.equals("COMMENT") ? "ADD" : "REPLY");
                messagingTemplate.convertAndSend("/topic/posts/" + sourceId + "/comments", updateMsg);
            }

            // Send WebSocket message for comment updates
            if (type.equals("COMMENT")) {
                messagingTemplate.convertAndSend(
                    "/topic/posts/" + sourceId + "/comments",
                    new WebSocketMessage("ADD", sourceId)
                );
            } else if (type.equals("COMMENT_DELETED")) {
                messagingTemplate.convertAndSend(
                    "/topic/posts/" + sourceId + "/comments",
                    new WebSocketMessage("DELETE", sourceId)
                );
            }

        } catch (Exception e) {
            System.err.println("Error creating notification: " + e.getMessage());
        }
    }

    // Add this new class inside NotificationService
    private static class CommentUpdateMessage {
        private final String postId;
        private final String type;

        public CommentUpdateMessage(String postId, String type) {
            this.postId = postId;
            this.type = type;
        }

        public String getPostId() { return postId; }
        public String getType() { return type; }
    }

    // Add this inner class at the same level as CommentUpdateMessage
    private static class WebSocketMessage {
        private final String type;
        private final String postId;

        public WebSocketMessage(String type, String postId) {
            this.type = type;
            this.postId = postId;
        }

        public String getType() { return type; }
        public String getPostId() { return postId; }
    }

    public List<Notification> getUserNotifications(String userId) {
        try {
            return notificationRepository.findByUserId(userId,
                    Sort.by(Sort.Direction.DESC, "createdAt"));
        } catch (Exception e) {
            System.err.println("Error fetching notifications: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    public void markAsRead(String notificationId) {
        notificationRepository.findById(notificationId).ifPresent(notification -> {
            notification.setRead(true);
            notificationRepository.save(notification);
        });
    }

    public void markAllAsRead(String userId) {
        List<Notification> notifications = notificationRepository.findByUserIdAndRead(userId, false);
        notifications.forEach(notification -> notification.setRead(true));
        notificationRepository.saveAll(notifications);
    }

    public long getUnreadCount(String userId) {
        return notificationRepository.countByUserIdAndRead(userId, false);
    }
}
