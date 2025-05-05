package com.example.backend.service;

import com.example.backend.model.Post;
import com.example.backend.model.Reaction;
import com.example.backend.repository.PostRepository;
import com.example.backend.repository.ReactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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
        // Remove existing reaction if any
        Optional<Reaction> existingReaction = reactionRepository.findByUserIdAndPostId(userId, postId);
        if (existingReaction.isPresent()) {
            if (existingReaction.get().getReactionType().equals(reactionType)) {
                // If same reaction type, remove it (toggle behavior)
                reactionRepository.delete(existingReaction.get());
                updatePostReactionCounts(postId);
                return null;
            } else {
                // If different reaction type, remove old one
                reactionRepository.delete(existingReaction.get());
            }
        }

        // Create new reaction
        Reaction reaction = new Reaction(userId, postId, reactionType);
        reaction = reactionRepository.save(reaction);

        // Update post reaction counts
        updatePostReactionCounts(postId);

        return reaction;
    }

    public void removeReaction(String userId, String postId) {
        reactionRepository.deleteByUserIdAndPostId(userId, postId);
        updatePostReactionCounts(postId);
    }

    private void updatePostReactionCounts(String postId) {
        Post post = postRepository.findById(postId).orElseThrow();
        Map<String, Integer> counts = new HashMap<>();

        // Count reactions by type
        reactionRepository.findByPostId(postId).forEach(reaction -> {
            counts.merge(reaction.getReactionType(), 1, Integer::sum);
        });

        post.setReactionCounts(counts);
        postRepository.save(post);
    }

    public Map<String, Long> getReactionCounts(String postId) {
        Map<String, Long> counts = new HashMap<>();
        String[] reactionTypes = { "LIKE", "LOVE", "HAHA", "WOW", "SAD", "ANGRY" };

        for (String type : reactionTypes) {
            long count = reactionRepository.countByPostIdAndReactionType(postId, type);
            if (count > 0) {
                counts.put(type, count);
            }
        }

        return counts;
    }

    public Optional<Reaction> getUserReaction(String userId, String postId) {
        return reactionRepository.findByUserIdAndPostId(userId, postId);
    }
}
