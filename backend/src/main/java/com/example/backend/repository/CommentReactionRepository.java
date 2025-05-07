package com.example.backend.repository;

import com.example.backend.model.CommentReaction;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface CommentReactionRepository extends MongoRepository<CommentReaction, String> {
    List<CommentReaction> findByCommentId(String commentId);
    
    List<CommentReaction> findByCommentIdAndReactionType(String commentId, String reactionType);
    
    Optional<CommentReaction> findByCommentIdAndUserId(String commentId, String userId);
    
    int countByCommentId(String commentId);
    
    int countByCommentIdAndReactionType(String commentId, String reactionType);
    
    void deleteByCommentIdAndUserId(String commentId, String userId);
}
