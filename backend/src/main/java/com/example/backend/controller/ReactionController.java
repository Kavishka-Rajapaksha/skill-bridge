package com.example.backend.controller;

import com.example.backend.model.Reaction;
import com.example.backend.service.ReactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/reactions")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001", "http://localhost:3002" })
public class ReactionController {

    @Autowired
    private ReactionService reactionService;

    @GetMapping("/{postId}/stats")
    public ResponseEntity<?> getReactionStats(@PathVariable String postId) {
        return ResponseEntity.ok(reactionService.getReactionStats(postId));
    }

    @GetMapping("/{postId}/user/{userId}")
    public ResponseEntity<?> getUserReaction(
            @PathVariable String postId,
            @PathVariable String userId) {
        Reaction reaction = reactionService.getUserReaction(postId, userId);
        if (reaction == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(reaction);
    }

    @PostMapping("/{postId}")
    public ResponseEntity<?> addReaction(
            @PathVariable String postId,
            @RequestBody Map<String, String> payload) {
        return ResponseEntity.ok(reactionService.addReaction(
                postId,
                payload.get("userId"),
                payload.get("type")));
    }

    @DeleteMapping("/{postId}/user/{userId}")
    public ResponseEntity<?> removeReaction(
            @PathVariable String postId,
            @PathVariable String userId) {
        reactionService.removeReaction(postId, userId);
        return ResponseEntity.ok().build();
    }
}
