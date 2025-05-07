package com.example.backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "comment_reactions")
public class CommentReaction {
    @Id
    private String id;
    private String commentId;
    private String userId;
    private String reactionType; // "like" for now, could be extended for other reaction types
    private LocalDateTime createdAt;

    public CommentReaction() {
        this.createdAt = LocalDateTime.now();
    }

    public CommentReaction(String commentId, String userId, String reactionType) {
        this.commentId = commentId;
        this.userId = userId;
        this.reactionType = reactionType;
        this.createdAt = LocalDateTime.now();
    }

    // Getters and setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getCommentId() {
        return commentId;
    }

    public void setCommentId(String commentId) {
        this.commentId = commentId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getReactionType() {
        return reactionType;
    }

    public void setReactionType(String reactionType) {
        this.reactionType = reactionType;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
