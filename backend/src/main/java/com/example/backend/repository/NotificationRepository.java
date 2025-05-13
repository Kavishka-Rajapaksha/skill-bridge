package com.example.backend.repository;

import com.example.backend.model.Notification;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends MongoRepository<Notification, String> {
    List<Notification> findByUserId(String userId, Sort sort);

    List<Notification> findByUserIdAndRead(String userId, boolean read);

    long countByUserIdAndRead(String userId, boolean read);
}
