package com.example.backend.controller;

import com.example.backend.model.Reaction;
import com.example.backend.service.ReactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/reactions")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001", "http://localhost:3002" })
public class ReactionController {

    @Autowired
    private ReactionService reactionService;

    @PostMapping
    public ResponseEntity<?> addReaction(
            @RequestParam String userId,
            @RequestParam String postId,
            @RequestParam String type) {
        Reaction reaction = reactionService.addReaction(userId, postId, type);
        Map<String, Long> updatedCounts = reactionService.getReactionCounts(postId);
        return ResponseEntity.ok(updatedCounts);
    }

    @DeleteMapping
    public ResponseEntity<?> removeReaction(
            @RequestParam String userId,
            @RequestParam String postId) {
        reactionService.removeReaction(userId, postId);
        Map<String, Long> updatedCounts = reactionService.getReactionCounts(postId);
        return ResponseEntity.ok(updatedCounts);
    }

    @GetMapping("/post/{postId}")
    public ResponseEntity<Map<String, Long>> getReactionCounts(@PathVariable String postId) {
        return ResponseEntity.ok(reactionService.getReactionCounts(postId));
    }

    @GetMapping("/user")
    public ResponseEntity<?> getUserReaction(
            @RequestParam String userId,
            @RequestParam String postId) {
        return ResponseEntity.ok(reactionService.getUserReaction(userId, postId));
    }
}
