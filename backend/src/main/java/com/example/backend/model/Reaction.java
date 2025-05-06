package com.example.backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "reactions")
public class Reaction {
    @Id
    private String id;
    private String userId;
    private String postId;
    private String reactionType; // LIKE, LOVE, HAHA, WOW, SAD, ANGRY
    private LocalDateTime createdAt;

    public Reaction() {
        this.createdAt = LocalDateTime.now();
    }

    // Constructor with fields
    public Reaction(String userId, String postId, String reactionType) {
        this.userId = userId;
        this.postId = postId;
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

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getPostId() {
        return postId;
    }

    public void setPostId(String postId) {
        this.postId = postId;
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
