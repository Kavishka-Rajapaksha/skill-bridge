package com.example.backend.controller;

import com.example.backend.model.CommentResponse;
import com.example.backend.service.CommentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/comments")
public class CommentController {
    private final CommentService commentService;

    @Autowired
    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @PostMapping
    public ResponseEntity<?> createComment(
            @RequestParam String postId,
            @RequestParam String userId,
            @RequestParam String content,
            @RequestParam(required = false) String parentCommentId) {
        try {
            CommentResponse comment = commentService.createComment(postId, userId, content, parentCommentId);
            return ResponseEntity.ok(comment);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{commentId}")
    public ResponseEntity<?> updateComment(
            @PathVariable String commentId,
            @RequestParam String userId,
            @RequestParam String content) {
        try {
            CommentResponse comment = commentService.updateComment(commentId, userId, content);
            return ResponseEntity.ok(comment);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<?> deleteComment(
            @PathVariable String commentId,
            @RequestParam String userId,
            @RequestParam(required = false, defaultValue = "false") boolean isAdmin) {
        try {
            commentService.deleteComment(commentId, userId, isAdmin);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/post/{postId}")
    public ResponseEntity<List<CommentResponse>> getPostComments(
            @PathVariable String postId,
            @RequestParam(defaultValue = "100") int limit,
            @RequestParam(defaultValue = "true") boolean includeReplies,
            @RequestParam(defaultValue = "false") boolean hierarchical) {
        return ResponseEntity.ok(commentService.getPostComments(postId, limit));
    }
}
