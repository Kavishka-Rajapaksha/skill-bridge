package com.example.backend.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class PostResponse {
    private String id;
    private String userId;
    private String userName;
    private String userProfilePicture;
    private String content;
    private String videoUrl;
    private List<String> imageUrls = new ArrayList<>();
    private List<String> mediaIds = new ArrayList<>();
    private Map<String, String> mediaTypes = new HashMap<>();
    private int likes;
    private List<String> comments = new ArrayList<>();
    private LocalDateTime createdAt;
    private String sharedFrom;
    private String sharedByUserId;
    private String sharedByUserName;
    private String sharedByUserProfilePicture;
    private LocalDateTime sharedAt;
    private String originalUserId; // Add this field
    private String originalUserName;
    private String originalUserProfilePicture;
    private LocalDateTime originalCreatedAt;
    private String originalContent;
    private List<String> originalImageUrls = new ArrayList<>();
    private String originalVideoUrl;

    public PostResponse() {
    }

    public PostResponse(Post post) {
        this.id = post.getId();
        this.userId = post.getUserId();
        this.content = post.getContent();
        this.videoUrl = post.getVideoUrl();
        this.imageUrls = post.getImageUrls();
        this.mediaIds = post.getMediaIds();
        this.mediaTypes = post.getMediaTypes();
        this.likes = post.getLikes();
        this.comments = post.getComments();
        this.createdAt = post.getCreatedAt();
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

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getUserProfilePicture() {
        return userProfilePicture;
    }

    public void setUserProfilePicture(String userProfilePicture) {
        this.userProfilePicture = userProfilePicture;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getVideoUrl() {
        return videoUrl;
    }

    public void setVideoUrl(String videoUrl) {
        this.videoUrl = videoUrl;
    }

    public List<String> getImageUrls() {
        return imageUrls;
    }

    public void setImageUrls(List<String> imageUrls) {
        this.imageUrls = imageUrls;
    }

    public List<String> getMediaIds() {
        return mediaIds;
    }

    public void setMediaIds(List<String> mediaIds) {
        this.mediaIds = mediaIds;
    }

    public Map<String, String> getMediaTypes() {
        return mediaTypes;
    }

    public void setMediaTypes(Map<String, String> mediaTypes) {
        this.mediaTypes = mediaTypes;
    }

    public int getLikes() {
        return likes;
    }

    public void setLikes(int likes) {
        this.likes = likes;
    }

    public List<String> getComments() {
        return comments;
    }

    public void setComments(List<String> comments) {
        this.comments = comments;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getSharedFrom() {
        return sharedFrom;
    }

    public void setSharedFrom(String sharedFrom) {
        this.sharedFrom = sharedFrom;
    }

    public String getSharedByUserId() {
        return sharedByUserId;
    }

    public void setSharedByUserId(String sharedByUserId) {
        this.sharedByUserId = sharedByUserId;
    }

    public String getSharedByUserName() {
        return sharedByUserName;
    }

    public void setSharedByUserName(String sharedByUserName) {
        this.sharedByUserName = sharedByUserName;
    }

    public String getSharedByUserProfilePicture() {
        return sharedByUserProfilePicture;
    }

    public void setSharedByUserProfilePicture(String sharedByUserProfilePicture) {
        this.sharedByUserProfilePicture = sharedByUserProfilePicture;
    }

    public LocalDateTime getSharedAt() {
        return sharedAt;
    }

    public void setSharedAt(LocalDateTime sharedAt) {
        this.sharedAt = sharedAt;
    }

    public String getOriginalUserId() {
        return originalUserId;
    }

    public void setOriginalUserId(String originalUserId) {
        this.originalUserId = originalUserId;
    }

    public String getOriginalUserName() {
        return originalUserName;
    }

    public void setOriginalUserName(String originalUserName) {
        this.originalUserName = originalUserName;
    }

    public String getOriginalUserProfilePicture() {
        return originalUserProfilePicture;
    }

    public void setOriginalUserProfilePicture(String originalUserProfilePicture) {
        this.originalUserProfilePicture = originalUserProfilePicture;
    }

    public LocalDateTime getOriginalCreatedAt() {
        return originalCreatedAt;
    }

    public void setOriginalCreatedAt(LocalDateTime originalCreatedAt) {
        this.originalCreatedAt = originalCreatedAt;
    }

    public String getOriginalContent() {
        return originalContent;
    }

    public void setOriginalContent(String originalContent) {
        this.originalContent = originalContent;
    }

    public List<String> getOriginalImageUrls() {
        return originalImageUrls;
    }

    public void setOriginalImageUrls(List<String> originalImageUrls) {
        this.originalImageUrls = originalImageUrls != null ? originalImageUrls : new ArrayList<>();
    }

    public String getOriginalVideoUrl() {
        return originalVideoUrl;
    }

    public void setOriginalVideoUrl(String originalVideoUrl) {
        this.originalVideoUrl = originalVideoUrl;
    }
}