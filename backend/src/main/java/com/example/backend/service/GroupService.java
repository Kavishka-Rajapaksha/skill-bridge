package com.example.backend.service;

import com.example.backend.model.Group;
import com.example.backend.repository.GroupRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.List;
import java.util.Collections;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class GroupService {

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private FileStorageService fileStorageService;

    private static final Logger logger = LoggerFactory.getLogger(GroupService.class);

    public Group createGroup(String name, String description, String userId, MultipartFile coverImage)
            throws IOException {
        if (groupRepository.existsByName(name)) {
            throw new IllegalArgumentException("Group name already exists");
        }

        Group group = new Group();
        group.setName(name);
        group.setDescription(description);
        group.setCreatedBy(userId);

        if (coverImage != null && !coverImage.isEmpty()) {
            // This will now return a full URL
            String imageUrl = fileStorageService.storeFile(coverImage);
            group.setCoverImageUrl(imageUrl);
        }

        return groupRepository.save(group);
    }

    public Group updateGroup(String groupId, String userId, String name, String description) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found"));

        // Verify ownership
        if (!group.getCreatedBy().equals(userId)) {
            throw new IllegalArgumentException("You don't have permission to update this group");
        }

        // Check if new name already exists (skip if name hasn't changed)
        if (!group.getName().equals(name) && groupRepository.existsByName(name)) {
            throw new IllegalArgumentException("Group name already exists");
        }

        group.setName(name);
        group.setDescription(description);
        return groupRepository.save(group);
    }

    public void deleteGroup(String groupId, String userId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found"));

        // Verify ownership
        if (!group.getCreatedBy().equals(userId)) {
            throw new IllegalArgumentException("You don't have permission to delete this group");
        }

        groupRepository.delete(group);
    }

    public List<Group> getUserGroups(String userId) {
        return groupRepository.findByCreatedBy(userId);
    }

    public List<Group> getAllGroups() {
        try {
            List<Group> groups = groupRepository.findAll();
            if (groups == null) {
                return Collections.emptyList();
            }
            return groups;
        } catch (Exception e) {
            logger.error("Error fetching all groups: {}", e.getMessage());
            throw new RuntimeException("Failed to fetch groups", e);
        }
    }

    public Group getGroupById(String groupId) {
        return groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found with id: " + groupId));
    }
}
