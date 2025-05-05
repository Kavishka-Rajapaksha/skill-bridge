package com.example.backend.repository;

import com.example.backend.model.Reaction;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface ReactionRepository extends MongoRepository<Reaction, String> {
    Optional<Reaction> findByUserIdAndPostId(String userId, String postId);

    List<Reaction> findByPostId(String postId);

    void deleteByUserIdAndPostId(String userId, String postId);

    long countByPostIdAndReactionType(String postId, String reactionType);
}
