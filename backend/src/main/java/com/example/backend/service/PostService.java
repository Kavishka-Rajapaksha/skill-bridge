package com.example.backend.service;

import com.example.backend.model.Post;
import com.example.backend.model.PostResponse;
import com.example.backend.model.User;
import com.example.backend.repository.PostRepository;
import com.example.backend.repository.UserRepository;
import com.mongodb.client.gridfs.GridFSBucket;
import com.mongodb.client.gridfs.GridFSBuckets;
import com.mongodb.client.gridfs.model.GridFSUploadOptions;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.logging.Logger;
import java.util.stream.Collectors;

@Service
public class PostService {

    private static final Logger logger = Logger.getLogger(PostService.class.getName());
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final MongoTemplate mongoTemplate;
    private final GridFSBucket gridFSBucket;

    private static final int MAX_VIDEO_SIZE_MB = 15; // 15MB
    private static final List<String> ALLOWED_VIDEO_TYPES = List.of("video/mp4", "video/quicktime");
    private static final int MAX_VIDEO_DURATION_SECONDS = 30;

    @Value("${upload.directory}")
    private String uploadDirectory;

    @Autowired
    public PostService(
            PostRepository postRepository,
            UserRepository userRepository,
            MongoTemplate mongoTemplate) {
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.mongoTemplate = mongoTemplate;
        this.gridFSBucket = GridFSBuckets.create(mongoTemplate.getDb(), "media");
    }

    private User getUserDetails(String userId) {
        if (userId == null) {
            logger.warning("Null userId provided");
            return createFallbackUser("unknown");
        }

        try {
            return userRepository.findById(userId)
                    .orElseGet(() -> {
                        logger.warning("User not found for ID: " + userId);
                        return createFallbackUser(userId);
                    });
        } catch (Exception e) {
            logger.warning("Error fetching user with ID " + userId + ": " + e.getMessage());
            return createFallbackUser(userId);
        }
    }

    private User createFallbackUser(String userId) {
        User fallbackUser = new User();
        fallbackUser.setId(userId);
        fallbackUser.setFirstName("Unknown");
        fallbackUser.setLastName("User");
        fallbackUser.setProfilePicture(null);
        return fallbackUser;
    }

    private PostResponse convertToPostResponse(Post post) {
        try {
            PostResponse response = new PostResponse(post);

            try {
                User user = getUserDetails(post.getUserId());
                response.setUserName(user.getFirstName() + " " + user.getLastName());
                response.setUserProfilePicture(user.getProfilePicture());
            } catch (Exception e) {
                logger.warning("Error getting user details for post " + post.getId() + ": " + e.getMessage());
                response.setUserName("Unknown User");
                response.setUserProfilePicture(null);
            }

            return response;
        } catch (Exception e) {
            logger.severe("Error converting post to response for post ID: " + post.getId() + " - " + e.getMessage());
            // Return a minimal response to avoid breaking the list
            PostResponse fallbackResponse = new PostResponse();
            fallbackResponse.setId(post.getId());
            fallbackResponse.setUserId(post.getUserId());
            fallbackResponse.setUserName("Unknown User");
            fallbackResponse.setContent(post.getContent());
            fallbackResponse.setCreatedAt(post.getCreatedAt());
            return fallbackResponse;
        }
    }

    public PostResponse createPost(String userId, String content, List<MultipartFile> images, MultipartFile video) {
        if ((video == null && (images == null || images.isEmpty())) && (content == null || content.isEmpty())) {
            throw new IllegalArgumentException("Post must have content, images, or a video");
        }

        Post post = new Post();
        post.setUserId(userId);
        post.setContent(content);
        post.setCreatedAt(LocalDateTime.now());
        post.setLikes(0);
        post.setComments(new ArrayList<>());
        List<String> mediaIds = new ArrayList<>();

        try {
            // Ensure upload directory exists
            Path uploadsPath = Paths.get("backend", "uploads");
            if (!Files.exists(uploadsPath)) {
                Files.createDirectories(uploadsPath);
                logger.info("Created uploads directory at: " + uploadsPath.toAbsolutePath());
            }

            // Handle video upload
            if (video != null && !video.isEmpty()) {
                validateVideo(video);
                String videoId = saveMedia(video, "video");
                mediaIds.add(videoId);
                post.setVideoUrl("/api/media/" + videoId);
                saveToLocalStorage(video, videoId);
            }

            // Handle image uploads
            if (images != null && !images.isEmpty()) {
                for (MultipartFile image : images) {
                    if (!image.getContentType().startsWith("image/")) {
                        throw new IllegalArgumentException("Only image files are supported");
                    }
                    String imageId = saveMedia(image, "image");
                    mediaIds.add(imageId);
                    saveToLocalStorage(image, imageId);
                }
                post.setImageUrls(mediaIds.stream()
                        .map(id -> "/api/media/" + id)
                        .collect(Collectors.toList()));
            }

            post.setMediaIds(mediaIds);
            Post savedPost = postRepository.save(post);
            return convertToPostResponse(savedPost);
        } catch (IOException e) {
            logger.severe("Failed to save media: " + e.getMessage());
            throw new RuntimeException("Failed to save media: " + e.getMessage());
        }
    }

    private void saveToLocalStorage(MultipartFile file, String mediaId) throws IOException {
        Path uploadsPath = Paths.get("D:", "Learn_Book", "backend", "uploads");
        Files.createDirectories(uploadsPath);
        Path filePath = uploadsPath.resolve(mediaId);
        logger.info("Saving file to: " + filePath);

        try (FileOutputStream fos = new FileOutputStream(filePath.toFile())) {
            fos.write(file.getBytes());
        }
    }

    private void validateVideo(MultipartFile video) {
        if (!ALLOWED_VIDEO_TYPES.contains(video.getContentType())) {
            throw new IllegalArgumentException(
                    "Invalid video format. Allowed formats: " + String.join(", ", ALLOWED_VIDEO_TYPES));
        }
        if (video.getSize() > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
            throw new IllegalArgumentException("Video size must be less than " + MAX_VIDEO_SIZE_MB + "MB");
        }
    }

    private String saveMedia(MultipartFile file, String type) throws IOException {
        GridFSUploadOptions options = new GridFSUploadOptions()
                .metadata(new org.bson.Document("type", type)
                        .append("contentType", file.getContentType()));
        ObjectId fileId = gridFSBucket.uploadFromStream(
                file.getOriginalFilename() != null ? file.getOriginalFilename() : "media_" + type,
                file.getInputStream(),
                options);
        return fileId.toHexString();
    }

    public List<PostResponse> getAllPosts() {
        try {
            List<Post> posts = postRepository.findAllByOrderByCreatedAtDesc();
            return posts.stream()
                    .map(this::convertToPostResponse)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            logger.severe("Error fetching all posts: " + e.getMessage());
            throw new RuntimeException("Failed to fetch posts: " + e.getMessage());
        }
    }

    public List<PostResponse> getUserPosts(String userId) {
        try {
            List<Post> posts = postRepository.findByUserIdOrderByCreatedAtDesc(userId);
            return posts.stream()
                    .map(this::convertToPostResponse)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            logger.severe("Error fetching posts for user ID: " + userId + " - " + e.getMessage());
            throw new RuntimeException("Failed to fetch user posts: " + e.getMessage());
        }
    }

    public void deletePost(String postId, String userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));

        if (!post.getUserId().equals(userId)) {
            throw new IllegalArgumentException("You can only delete your own posts");
        }

        if (post.getMediaIds() != null) {
            for (String mediaId : post.getMediaIds()) {
                try {
                    gridFSBucket.delete(new ObjectId(mediaId));
                    Path mediaPath = Paths.get("D:", "Learn_Book", "backend", "uploads", mediaId);
                    if (Files.exists(mediaPath)) {
                        Files.delete(mediaPath);
                        logger.info("Deleted file: " + mediaPath);
                    }
                } catch (Exception e) {
                    logger.severe("Failed to delete media: " + mediaId + " - " + e.getMessage());
                }
            }
        }

        postRepository.deleteById(postId);
    }

    public PostResponse updatePost(String postId, String userId, String content, List<MultipartFile> images) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));

        if (!post.getUserId().equals(userId)) {
            throw new IllegalArgumentException("You can only update your own posts");
        }

        post.setContent(content);
        List<String> mediaIds = new ArrayList<>(post.getMediaIds() != null ? post.getMediaIds() : new ArrayList<>());

        try {
            if (images != null && !images.isEmpty()) {
                if (!mediaIds.isEmpty()) {
                    for (String mediaId : mediaIds) {
                        try {
                            gridFSBucket.delete(new ObjectId(mediaId));
                            Path mediaPath = Paths.get("D:", "Learn_Book", "backend", "uploads", mediaId);
                            if (Files.exists(mediaPath)) {
                                Files.delete(mediaPath);
                                logger.info("Deleted file during update: " + mediaPath);
                            }
                        } catch (Exception e) {
                            logger.severe("Failed to delete old media: " + mediaId + " - " + e.getMessage());
                        }
                    }
                    mediaIds.clear();
                }

                for (MultipartFile image : images) {
                    if (!image.getContentType().startsWith("image/")) {
                        throw new IllegalArgumentException("Only image files are supported");
                    }
                    String imageId = saveMedia(image, "image");
                    mediaIds.add(imageId);
                    saveToLocalStorage(image, imageId);
                }
                post.setImageUrls(mediaIds.stream()
                        .map(id -> "/api/media/" + id)
                        .collect(Collectors.toList()));
            }

            post.setMediaIds(mediaIds);
            Post updatedPost = postRepository.save(post);
            return convertToPostResponse(updatedPost);
        } catch (IOException e) {
            logger.severe("Failed to update media: " + e.getMessage());
            throw new RuntimeException("Failed to update media: " + e.getMessage());
        }
    }
}