package com.example.backend.controller;

import com.example.backend.model.Reaction;
import com.example.backend.service.ReactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/reactions")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001", "http://localhost:3002" })
public class ReactionController {

    @Autowired
    private ReactionService reactionService;

    private Map<String, Object> createResponse(Map<String, Long> counts) {
        long total = counts.values().stream().mapToLong(Long::longValue).sum();
        Map<String, Object> response = new HashMap<>();
        response.put("total", total);
        response.put("reactions", counts);
        return response;
    }

    @GetMapping("/{postId}/stats")
    public ResponseEntity<?> getReactionStats(@PathVariable String postId) {
        try {
            Map<String, Long> counts = reactionService.getReactionCounts(postId);
            return ResponseEntity.ok(createResponse(counts));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to fetch reaction stats: " + e.getMessage()));
        }
    }

    @GetMapping("/{postId}/user/{userId}")
    public ResponseEntity<?> getUserReaction(
            @PathVariable String postId,
            @PathVariable String userId) {
        try {
            Optional<Reaction> reaction = reactionService.getUserReaction(userId, postId);
            if (reaction.isPresent()) {
                Map<String, String> response = new HashMap<>();
                response.put("type", reaction.get().getReactionType());
                return ResponseEntity.ok(response);
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error getting user reaction: " + e.getMessage()));
        }
    }

    @PostMapping("/{postId}")
    public ResponseEntity<?> addReaction(
            @PathVariable String postId,
            @RequestBody Map<String, String> payload) {
        try {
            String userId = payload.get("userId");
            String type = payload.get("type");

            if (userId == null || type == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Both userId and type are required"));
            }

            reactionService.addReaction(userId, postId, type);
            Map<String, Long> counts = reactionService.getReactionCounts(postId);
            return ResponseEntity.ok(createResponse(counts));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to process reaction: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{postId}/user/{userId}")
    public ResponseEntity<?> removeReaction(
            @PathVariable String postId,
            @PathVariable String userId) {
        try {
            reactionService.removeReaction(userId, postId);
            Map<String, Long> counts = reactionService.getReactionCounts(postId);
            Map<String, Object> response = new HashMap<>();
            response.put("total", counts.values().stream().mapToLong(Long::longValue).sum());
            response.put("reactions", counts);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Failed to remove reaction: " + e.getMessage());
        }
    }
}
