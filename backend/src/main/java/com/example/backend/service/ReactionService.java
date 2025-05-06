package com.example.backend.service;

import com.example.backend.model.Reaction;
import com.example.backend.repository.ReactionRepository;
import com.example.backend.repository.PostRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Service
public class ReactionService {

    @Autowired
    private ReactionRepository reactionRepository;

    @Autowired
    private PostRepository postRepository;

    @Transactional
    public Reaction addReaction(String postId, String userId, String type) {
        if (postId == null || userId == null || type == null) {
            throw new IllegalArgumentException("PostId, userId and type are required");
        }

        try {
            // Verify post exists
            postRepository.findById(postId)
                    .orElseThrow(() -> new IllegalArgumentException("Post not found: " + postId));

            // Validate reaction type
            if (!isValidReactionType(type)) {
                throw new IllegalArgumentException("Invalid reaction type: " + type);
            }

            // Check for existing reaction and update if exists
            Optional<Reaction> existingReaction = reactionRepository.findByPostIdAndUserId(postId, userId);

            if (existingReaction.isPresent()) {
                Reaction reaction = existingReaction.get();
                reaction.setType(type);
                return reactionRepository.save(reaction);
            }

            // Create new reaction
            Reaction newReaction = new Reaction(postId, userId, type);
            return reactionRepository.save(newReaction);
        } catch (DuplicateKeyException e) {
            throw new IllegalStateException(
                    "A reaction already exists for this user and post: " + postId + ", " + userId, e);
        } catch (Exception e) {
            throw new RuntimeException("Failed to add reaction: " + e.getMessage(), e);
        }
    }

    private boolean isValidReactionType(String type) {
        return type != null && Set.of("LIKE", "LOVE", "HAHA", "WOW", "SAD", "ANGRY").contains(type);
    }

    public void removeReaction(String postId, String userId) {
        if (postId == null || userId == null) {
            throw new IllegalArgumentException("PostId and userId are required");
        }

        reactionRepository.deleteByPostIdAndUserId(postId, userId);
    }

    public Map<String, Object> getReactionStats(String postId) {
        if (postId == null) {
            throw new IllegalArgumentException("PostId is required");
        }

        List<Reaction> reactions = reactionRepository.findByPostId(postId);
        Map<String, Integer> reactionCounts = new HashMap<>();
        int total = reactions.size();

        // Count each reaction type
        for (Reaction reaction : reactions) {
            reactionCounts.merge(reaction.getType(), 1, Integer::sum);
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("total", total);
        stats.put("reactions", reactionCounts);

        return stats;
    }

    public Reaction getUserReaction(String postId, String userId) {
        if (postId == null || userId == null) {
            throw new IllegalArgumentException("PostId and userId are required");
        }

        return reactionRepository.findByPostIdAndUserId(postId, userId)
                .orElse(null); // Return null if no reaction found
    }
}
