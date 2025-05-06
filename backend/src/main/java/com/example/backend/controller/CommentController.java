package com.example.backend.controller;

import com.example.backend.model.CommentResponse;
import com.example.backend.service.CommentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/comments")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001", "http://localhost:3002" })
public class CommentController {
    private final CommentService commentService;

    @Autowired
    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @GetMapping("/post/{postId}")
    public ResponseEntity<List<CommentResponse>> getPostComments(
            @PathVariable String postId,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(commentService.getPostComments(postId, limit));
    }

    @PostMapping
    public ResponseEntity<CommentResponse> createComment(
            @RequestParam String userId,
            @RequestParam String postId,
            @RequestParam String content) {
        return ResponseEntity.ok(commentService.createComment(userId, postId, content));
    }

    @PutMapping("/{commentId}")
    public ResponseEntity<CommentResponse> updateComment(
            @PathVariable String commentId,
            @RequestParam String userId,
            @RequestParam String content) {
        return ResponseEntity.ok(commentService.updateComment(commentId, userId, content));
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<?> deleteComment(
            @PathVariable String commentId,
            @RequestParam String userId) {
        commentService.deleteComment(commentId, userId);
        return ResponseEntity.ok().build();
    }
}
