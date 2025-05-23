package com.example.backend.service;

import com.example.backend.model.Comment;
import com.example.backend.model.CommentReaction;
import com.example.backend.model.CommentResponse;
import com.example.backend.model.Post;
import com.example.backend.model.User;
import com.example.backend.repository.CommentReactionRepository;
import com.example.backend.repository.CommentRepository;
import com.example.backend.repository.PostRepository;
import com.example.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CommentService {
    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final CommentReactionRepository commentReactionRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    public CommentService(CommentRepository commentRepository,
            PostRepository postRepository,
            UserRepository userRepository,
            CommentReactionRepository commentReactionRepository) {
        this.commentRepository = commentRepository;
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.commentReactionRepository = commentReactionRepository;
    }

    private CommentResponse convertToCommentResponse(Comment comment, String currentUserId) {
        CommentResponse response = new CommentResponse(comment);

        try {
            userRepository.findById(comment.getUserId()).ifPresent(user -> {
                response.setUserName(user.getFirstName() + " " + user.getLastName());
                response.setUserProfilePicture(user.getProfilePicture());
            });
        } catch (Exception e) {
            // If user not found, use default values
            response.setUserName("Deleted User");
            response.setUserProfilePicture(null);
        }

        // Add reaction information
        try {
            int likeCount = commentReactionRepository.countByCommentIdAndReactionType(comment.getId(), "like");
            response.setLikeCount(likeCount);

            // Check if current user has liked this comment
            if (currentUserId != null) {
                boolean userLiked = commentReactionRepository.findByCommentIdAndUserId(comment.getId(), currentUserId)
                        .isPresent();
                response.setUserLiked(userLiked);
            }
        } catch (Exception e) {
            System.err.println("Error getting reaction data for comment " + comment.getId() + ": " + e.getMessage());
        }

        return response;
    }

    private CommentResponse convertToCommentResponse(Comment comment) {
        return convertToCommentResponse(comment, null);
    }

    public CommentResponse createComment(String postId, String userId, String content, String parentCommentId,
            List<String> mentions) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));

        Comment comment = new Comment();
        comment.setPostId(postId);
        comment.setUserId(userId);
        comment.setContent(content);
        comment.setParentCommentId(parentCommentId);

        // Set mentioned users if provided
        if (mentions != null && !mentions.isEmpty()) {
            comment.setMentions(mentions);
        }

        Comment savedComment = commentRepository.save(comment);

        // Get commenter name
        User commenter = userRepository.findById(userId).orElse(null);
        String commenterName = commenter != null ? (commenter.getFirstName() + " " + commenter.getLastName())
                : "Someone";

        // Create notification for post owner if it's a top-level comment
        if (parentCommentId == null) {
            notificationService.createNotification(
                    post.getUserId(),
                    "COMMENT",
                    commenterName + " commented on your post",
                    postId,
                    userId);
        } else {
            // Create notification for parent comment owner
            Comment parentComment = commentRepository.findById(parentCommentId)
                    .orElseThrow(() -> new IllegalArgumentException("Parent comment not found"));

            notificationService.createNotification(
                    parentComment.getUserId(),
                    "REPLY",
                    commenterName + " replied to your comment",
                    postId,
                    userId);
        }

        // Create notifications for mentioned users
        if (mentions != null && !mentions.isEmpty()) {
            for (String mentionedUserId : mentions) {
                // Skip if the mentioned user is the same as the commenter or the post owner
                if (!mentionedUserId.equals(userId) && !mentionedUserId.equals(post.getUserId())) {
                    notificationService.createNotification(
                            mentionedUserId,
                            "MENTION",
                            commenterName + " mentioned you in a comment",
                            postId,
                            userId);
                }
            }
        }

        return convertToCommentResponse(savedComment);
    }

    // Add overloaded method for backward compatibility
    public CommentResponse createComment(String postId, String userId, String content, String parentCommentId) {
        return createComment(postId, userId, content, parentCommentId, null);
    }

    // Update the existing createComment method to call the new one
    public CommentResponse createComment(String postId, String userId, String content) {
        return createComment(postId, userId, content, null, null);
    }

    public CommentResponse updateComment(String commentId, String userId, String content) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));

        if (!comment.getUserId().equals(userId)) {
            throw new IllegalArgumentException("You can only update your own comments");
        }

        comment.setContent(content);
        comment.setUpdatedAt(LocalDateTime.now());
        Comment updatedComment = commentRepository.save(comment);

        return convertToCommentResponse(updatedComment);
    }

    public void deleteComment(String commentId, String userId, boolean isAdmin) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));

        // If user is admin, allow deletion regardless of ownership
        if (isAdmin) {
            // Remove comment ID from post's comments list if post still exists
            postRepository.findById(comment.getPostId()).ifPresent(post -> {
                post.getComments().remove(commentId);
                postRepository.save(post);
            });

            // Delete the comment
            commentRepository.deleteById(commentId);
            return;
        }

        Post post = postRepository.findById(comment.getPostId())
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));

        // Check if user is either comment owner or post owner
        if (!comment.getUserId().equals(userId) && !post.getUserId().equals(userId)) {
            throw new IllegalArgumentException("You don't have permission to delete this comment");
        }

        // Remove comment ID from post's comments list
        post.getComments().remove(commentId);
        postRepository.save(post);

        // Delete the comment
        commentRepository.deleteById(commentId);
    }

    // Keep the original method for backward compatibility
    public void deleteComment(String commentId, String userId) {
        deleteComment(commentId, userId, false);
    }

    public List<CommentResponse> getPostComments(String postId) {
        try {
            return commentRepository.findByPostIdOrderByCreatedAtAsc(postId)
                    .stream()
                    .map(this::convertToCommentResponse)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            // Log error and return empty list
            System.err.println("Error fetching comments for post " + postId + ": " + e.getMessage());
            return Collections.emptyList();
        }
    }

    public Page<CommentResponse> getPostComments(String postId, PageRequest pageRequest) {
        try {
            Page<Comment> commentPage = commentRepository.findByPostIdOrderByCreatedAtDesc(postId, pageRequest);
            List<CommentResponse> commentResponses = commentPage.getContent().stream()
                    .map(this::convertToCommentResponse)
                    .collect(Collectors.toList());

            return new PageImpl<>(
                    commentResponses,
                    pageRequest,
                    commentPage.getTotalElements());
        } catch (Exception e) {
            // Log error and return empty page
            System.err.println("Error fetching paged comments for post " + postId + ": " + e.getMessage());
            return new PageImpl<>(Collections.emptyList(), pageRequest, 0);
        }
    }

    public List<CommentResponse> getPostComments(String postId, int limit) {
        try {
            // Replace findByPostId with an existing repository method
            List<Comment> allComments = commentRepository.findByPostIdOrderByCreatedAtDesc(
                    postId,
                    PageRequest.of(0, Math.max(limit, 1000)) // Ensure we get enough comments for hierarchical
                                                             // structuring
            ).getContent();

            // Convert to response objects
            return allComments.stream()
                    .map(this::convertToCommentResponse)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            // Log error and return empty list
            System.err.println("Error fetching comments for post " + postId + ": " + e.getMessage());
            e.printStackTrace(); // Add stack trace for better debugging
            return Collections.emptyList();
        }
    }

    public List<CommentResponse> getPostComments(String postId, String currentUserId) {
        try {
            return commentRepository.findByPostIdOrderByCreatedAtAsc(postId)
                    .stream()
                    .map(comment -> convertToCommentResponse(comment, currentUserId))
                    .collect(Collectors.toList());
        } catch (Exception e) {
            System.err.println("Error fetching comments for post " + postId + ": " + e.getMessage());
            return Collections.emptyList();
        }
    }

    public List<CommentResponse> getPostComments(String postId, int limit, String currentUserId) {
        try {
            List<Comment> allComments = commentRepository.findByPostIdOrderByCreatedAtDesc(
                    postId,
                    PageRequest.of(0, Math.max(limit, 1000))).getContent();

            return allComments.stream()
                    .map(comment -> convertToCommentResponse(comment, currentUserId))
                    .collect(Collectors.toList());
        } catch (Exception e) {
            System.err.println("Error fetching comments for post " + postId + ": " + e.getMessage());
            e.printStackTrace();
            return Collections.emptyList();
        }
    }

    public CommentResponse reactToComment(String commentId, String userId, String reactionType) {
        // Validate comment exists
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));

        // Check if user already reacted to this comment
        Optional<CommentReaction> existingReaction = commentReactionRepository.findByCommentIdAndUserId(commentId,
                userId);

        if (existingReaction.isPresent()) {
            // User already reacted, so remove the reaction (toggle behavior)
            commentReactionRepository.deleteById(existingReaction.get().getId());
        } else {
            // Add new reaction
            CommentReaction reaction = new CommentReaction(commentId, userId, reactionType);
            commentReactionRepository.save(reaction);
        }

        // Return updated comment response
        return convertToCommentResponse(comment, userId);
    }

    public long getCommentCount(String postId) {
        try {
            List<Comment> comments = commentRepository.findByPostId(postId);
            return comments.size();
        } catch (Exception e) {
            System.err.println("Error getting comment count: " + e.getMessage());
            return 0;
        }
    }
}
