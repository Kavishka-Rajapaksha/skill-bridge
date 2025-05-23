package com.example.backend.service;

import com.example.backend.model.Post;
import com.example.backend.model.PostResponse;
import com.example.backend.model.User;
import com.example.backend.repository.PostRepository;
import com.example.backend.repository.UserRepository;
import com.mongodb.client.gridfs.GridFSBucket;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private PostService postService;

    @Autowired
    private GridFSBucket gridFSBucket;

    public User getUserById(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        // Don't send the password back to the client
        user.setPassword(null);
        user.setRawPassword(null);

        return user;
    }

    public User updateUserProfile(String userId, String firstName, String lastName, String bio,
            MultipartFile profilePicture) throws Exception {
        Optional<User> userOptional = userRepository.findById(userId);

        if (!userOptional.isPresent()) {
            throw new Exception("User not found");
        }

        User user = userOptional.get();

        // Handle null values by providing empty strings as defaults
        if (firstName != null) {
            user.setFirstName(firstName);
        }

        if (lastName != null) {
            user.setLastName(lastName);
        }

        if (bio != null) {
            user.setBio(bio);
        }

        // Handle profile picture upload
        if (profilePicture != null && !profilePicture.isEmpty()) {
            // Existing profile picture upload logic...
            if (!profilePicture.getContentType().startsWith("image/")) {
                throw new IllegalArgumentException("Only image files are allowed for profile picture");
            }

            // Save to GridFS
            ObjectId fileId = gridFSBucket.uploadFromStream(
                    profilePicture.getOriginalFilename(),
                    profilePicture.getInputStream());

            // Create URL for the profile picture
            String mediaId = fileId.toHexString();
            user.setProfilePicture("/api/media/" + mediaId);

            // Save to local storage
            Path uploadsPath = Paths.get("backend", "uploads");
            if (!Files.exists(uploadsPath)) {
                Files.createDirectories(uploadsPath);
            }

            Path filePath = uploadsPath.resolve(mediaId);
            Files.write(filePath, profilePicture.getBytes());
        }

        return userRepository.save(user);
    }

    public List<PostResponse> getUserPosts(String userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        List<Post> posts = postRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return posts.stream()
                .map(post -> postService.convertToPostResponse(post))
                .collect(Collectors.toList());
    }

    public User updateUserRole(String userId, String newRole) {
        User user = getUserById(userId);
        if (user == null) {
            throw new RuntimeException("User not found");
        }

        // Validate the role
        if (!newRole.equals("ROLE_USER") && !newRole.equals("ROLE_ADMIN")) {
            throw new IllegalArgumentException("Invalid role: " + newRole);
        }

        user.setRole(newRole);
        return userRepository.save(user);
    }

    public User saveUser(User user) {
        return userRepository.save(user);
    }

    /**
     * Search users by query string matching firstName, lastName, or email
     * 
     * @param query The search query
     * @return List of users that match the search criteria
     */
    public List<User> searchUsers(String query) {
        List<User> users = userRepository
                .findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
                        query, query, query);

        // Remove sensitive information before returning
        users.forEach(user -> {
            user.setPassword(null);
            user.setRawPassword(null);
        });

        return users;
    }
}
