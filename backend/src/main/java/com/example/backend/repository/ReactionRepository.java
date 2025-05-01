package com.example.backend.repository;

import com.example.backend.model.Reaction;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ReactionRepository extends MongoRepository<Reaction, String> {
    List<Reaction> findByPostId(String postId);

    Optional<Reaction> findByPostIdAndUserId(String postId, String userId);

    void deleteByPostIdAndUserId(String postId, String userId);
}
