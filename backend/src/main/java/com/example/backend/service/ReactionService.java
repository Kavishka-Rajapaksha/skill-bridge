package com.example.backend.service;

import com.example.backend.model.Post;
import com.example.backend.model.Reaction;
import com.example.backend.repository.PostRepository;
import com.example.backend.repository.ReactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class ReactionService {

    @Autowired
    private ReactionRepository reactionRepository;

    @Autowired
    private PostRepository postRepository;

    public Reaction addReaction(String userId, String postId, String reactionType) {
        if (userId == null || postId == null || reactionType == null) {
            throw new IllegalArgumentException("userId, postId, and reactionType are required");
        }

        // Validate reaction type
        if (!Arrays.asList("LIKE", "LOVE", "HAHA", "WOW", "SAD", "ANGRY").contains(reactionType)) {
            throw new IllegalArgumentException("Invalid reaction type: " + reactionType);
        }

        // Remove existing reaction if any
        Optional<Reaction> existingReaction = reactionRepository.findByUserIdAndPostId(userId, postId);
        if (existingReaction.isPresent()) {
            if (existingReaction.get().getReactionType().equals(reactionType)) {
                reactionRepository.delete(existingReaction.get());
                updatePostReactionCounts(postId);
                return null;
            }
            reactionRepository.delete(existingReaction.get());
        }

        // Create new reaction
        Reaction reaction = new Reaction(userId, postId, reactionType);
        reaction = reactionRepository.save(reaction);
        updatePostReactionCounts(postId);
        return reaction;
    }

    public void removeReaction(String userId, String postId) {
        reactionRepository.deleteByUserIdAndPostId(userId, postId);
        updatePostReactionCounts(postId);
    }

    private void updatePostReactionCounts(String postId) {
        if (postId == null) {
            throw new IllegalArgumentException("Post ID cannot be null");
        }

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found with ID: " + postId));

        Map<String, Integer> counts = new HashMap<>();
        String[] validTypes = { "LIKE", "LOVE", "HAHA", "WOW", "SAD", "ANGRY" };

        // Initialize all reaction types with 0
        for (String type : validTypes) {
            counts.put(type, 0);
        }

        // Count reactions by type
        reactionRepository.findByPostId(postId).forEach(reaction -> {
            String type = reaction.getReactionType();
            if (type != null && counts.containsKey(type)) {
                counts.put(type, counts.get(type) + 1);
            }
        });

        post.setReactionCounts(counts);
        postRepository.save(post);
    }

    public Map<String, Long> getReactionCounts(String postId) {
        if (postId == null) {
            throw new IllegalArgumentException("postId is required");
        }

        Map<String, Long> counts = new HashMap<>();
        String[] validTypes = { "LIKE", "LOVE", "HAHA", "WOW", "SAD", "ANGRY" };

        // Initialize all types with 0L
        for (String type : validTypes) {
            counts.put(type, 0L);
        }

        try {
            // Update counts only for reactions that exist
            for (String type : validTypes) {
                long count = reactionRepository.countByPostIdAndReactionType(postId, type);
                counts.put(type, count);
            }
        } catch (Exception e) {
            // Log error but return empty counts rather than throwing
            e.printStackTrace();
        }

        return counts;
    }

    public Optional<Reaction> getUserReaction(String userId, String postId) {
        if (userId == null || postId == null) {
            throw new IllegalArgumentException("Both userId and postId are required");
        }
        return reactionRepository.findByUserIdAndPostId(userId, postId);
    }
}
