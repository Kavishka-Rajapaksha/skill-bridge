<<<<<<< Updated upstream
package com.example.backend.controller;

import com.example.backend.model.CommentResponse;
import com.example.backend.service.CommentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/comments")
public class CommentReactionController {

    private final CommentService commentService;

    @Autowired
    public CommentReactionController(CommentService commentService) {
        this.commentService = commentService;
    }

    @PostMapping("/{commentId}/react")
    public ResponseEntity<?> reactToComment(
            @PathVariable String commentId,
            @RequestParam String userId,
            @RequestParam(defaultValue = "like") String reactionType) {
        try {
            CommentResponse comment = commentService.reactToComment(commentId, userId, reactionType);
            return ResponseEntity.ok(comment);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
=======
package com.example.backend.controller;

import com.example.backend.model.CommentResponse;
import com.example.backend.service.CommentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/comments")
public class CommentReactionController {

    private final CommentService commentService;

    @Autowired
    public CommentReactionController(CommentService commentService) {
        this.commentService = commentService;
    }

    @PostMapping("/{commentId}/react")
    public ResponseEntity<?> reactToComment(
            @PathVariable String commentId,
            @RequestParam String userId,
            @RequestParam(defaultValue = "like") String reactionType) {
        try {
            CommentResponse comment = commentService.reactToComment(commentId, userId, reactionType);
            return ResponseEntity.ok(comment);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
>>>>>>> Stashed changes
