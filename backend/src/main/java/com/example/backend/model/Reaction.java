package com.example.backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Field;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

@Document(collection = "reactions")
@CompoundIndexes({
        @CompoundIndex(name = "post_user_idx", def = "{'postId': 1, 'userId': 1}", unique = true, background = true, sparse = true)
})
public class Reaction {
    @Id
    private String id;

    @NotNull(message = "PostId is required")
    @Field("postId")
    private String postId;

    @NotNull(message = "UserId is required")
    @Field("userId")
    private String userId;

    @NotNull(message = "Type is required")
    @Pattern(regexp = "^(LIKE|LOVE|HAHA|WOW|SAD|ANGRY)$", message = "Invalid reaction type")
    @Field("type")
    private String type;

    public Reaction() {
    }

    public Reaction(String postId, String userId, String type) {
        this.postId = postId;
        this.userId = userId;
        this.type = type;
    }

    // Getters and setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getPostId() {
        return postId;
    }

    public void setPostId(String postId) {
        if (postId == null) {
            throw new IllegalArgumentException("postId cannot be null");
        }
        this.postId = postId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        if (userId == null) {
            throw new IllegalArgumentException("userId cannot be null");
        }
        this.userId = userId;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        if (type == null) {
            throw new IllegalArgumentException("type cannot be null");
        }
        if (!type.matches("^(LIKE|LOVE|HAHA|WOW|SAD|ANGRY)$")) {
            throw new IllegalArgumentException("Invalid reaction type");
        }
        this.type = type;
    }
}
