package com.example.backend.service;

import com.example.backend.model.Group;
import com.example.backend.repository.GroupRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GroupService {

    @Autowired
    private GroupRepository groupRepository;

    public List<Group> getAllGroups() {
        return groupRepository.findAll();
    }

    public Group getGroupById(String id) {
        return groupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Group not found"));
    }

    public Group createGroup(Group group) {
        return groupRepository.save(group);
    }

    public Group updateGroup(String id, Group groupDetails) {
        Group group = getGroupById(id);

        // Only allow group owner to update
        if (!group.getCreatedBy().equals(groupDetails.getCreatedBy())) {
            throw new RuntimeException("Only group owner can update the group");
        }

        group.setName(groupDetails.getName());
        group.setDescription(groupDetails.getDescription());

        return groupRepository.save(group);
    }

    public void deleteGroup(String id, String userId) {
        Group group = getGroupById(id);

        // Only allow group owner to delete
        if (!group.getCreatedBy().equals(userId)) {
            throw new RuntimeException("Only group owner can delete the group");
        }

        groupRepository.delete(group);
    }

    public Group joinGroup(String groupId, String userId) {
        Group group = getGroupById(groupId);

        if (!group.getMembers().contains(userId)) {
            group.getMembers().add(userId);
            return groupRepository.save(group);
        }
        return group;
    }

    public Group leaveGroup(String groupId, String userId) {
        Group group = getGroupById(groupId);

        // Don't allow group owner to leave
        if (group.getCreatedBy().equals(userId)) {
            throw new RuntimeException("Group owner cannot leave the group");
        }

        group.getMembers().remove(userId);
        return groupRepository.save(group);
    }
}