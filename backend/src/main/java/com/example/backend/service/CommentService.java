package com.example.backend.service;

import com.example.backend.model.Comment;
import com.example.backend.model.CommentResponse;
import com.example.backend.model.User;
import com.example.backend.repository.CommentRepository;
import com.example.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CommentService {
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;

    @Autowired
    public CommentService(CommentRepository commentRepository, UserRepository userRepository) {
        this.commentRepository = commentRepository;
        this.userRepository = userRepository;
    }

    private CommentResponse convertToResponse(Comment comment) {
        CommentResponse response = new CommentResponse(comment);
        userRepository.findById(comment.getUserId()).ifPresent(user -> {
            response.setUserName(user.getFirstName() + " " + user.getLastName());
            response.setUserProfilePicture(user.getProfilePicture());
        });
        return response;
    }

    public List<CommentResponse> getPostComments(String postId, int limit) {
        List<Comment> comments = commentRepository.findByPostIdOrderByCreatedAtDesc(postId);
        if (limit > 0) {
            comments = comments.subList(0, Math.min(comments.size(), limit));
        }
        return comments.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    public CommentResponse createComment(String userId, String postId, String content) {
        Comment comment = new Comment();
        comment.setUserId(userId);
        comment.setPostId(postId);
        comment.setContent(content);
        comment.setCreatedAt(LocalDateTime.now());
        comment.setUpdatedAt(LocalDateTime.now());
        return convertToResponse(commentRepository.save(comment));
    }

    public CommentResponse updateComment(String commentId, String userId, String content) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));

        if (!comment.getUserId().equals(userId)) {
            throw new IllegalArgumentException("You can only update your own comments");
        }

        comment.setContent(content);
        comment.setUpdatedAt(LocalDateTime.now());
        return convertToResponse(commentRepository.save(comment));
    }

    public void deleteComment(String commentId, String userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));

        if (!comment.getUserId().equals(userId)) {
            throw new IllegalArgumentException("You can only delete your own comments");
        }

        commentRepository.deleteById(commentId);
    }
}
