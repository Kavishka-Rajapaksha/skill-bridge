package com.example.backend.controller;

import com.example.backend.model.CommentResponse;
import com.example.backend.service.CommentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/comments")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001", "http://localhost:3002" })
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
            @RequestParam(required = false) String parentCommentId,
            @RequestParam(required = false) String mentions) {
        try {
            List<String> mentionsList = null;
            if (mentions != null && !mentions.isEmpty()) {
                mentionsList = Arrays.asList(mentions.split(","));
            }

            CommentResponse comment = commentService.createComment(
                    postId, userId, content, parentCommentId, mentionsList);
            return ResponseEntity.status(201).body(comment);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(e.getMessage());
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
            @RequestParam(required = false) String currentUserId) {
        return ResponseEntity.ok(commentService.getPostComments(postId, limit, currentUserId));
    }

    @GetMapping("/count/{postId}")
    public ResponseEntity<Map<String, Long>> getCommentCount(@PathVariable String postId) {
        long count = commentService.getCommentCount(postId);
        Map<String, Long> response = new HashMap<>();
        response.put("count", count);
        return ResponseEntity.ok(response);
    }
}
