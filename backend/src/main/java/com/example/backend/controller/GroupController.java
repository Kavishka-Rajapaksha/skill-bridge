package com.example.backend.controller;

import com.example.backend.model.Group;
import com.example.backend.service.GroupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001", "http://localhost:3002" })
public class GroupController {

    @Autowired
    private GroupService groupService;

    @GetMapping(produces = "application/json")
    public ResponseEntity<List<Group>> getAllGroups() {
        return ResponseEntity.ok(groupService.getAllGroups());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Group> getGroupById(@PathVariable String id) {
        return ResponseEntity.ok(groupService.getGroupById(id));
    }

    @PostMapping(consumes = "application/json", produces = "application/json")
    public ResponseEntity<Group> createGroup(
        @RequestBody Group group,
        @RequestHeader(value = "userId", required = false) String userId) {
        
        if (userId != null && !userId.isEmpty()) {
            // Ensure the userId in header matches the createdBy in the group
            if (group.getCreatedBy() != null && !group.getCreatedBy().equals(userId)) {
                return ResponseEntity.status(403).body(null);
            }
        }
        
        return ResponseEntity.ok(groupService.createGroup(group));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateGroup(
            @PathVariable String id,
            @RequestBody Group groupDetails,
            @RequestHeader(value = "userId", required = true) String userId) {
        try {
            groupDetails.setCreatedBy(userId); // Set the userId as createdBy for verification
            Group updatedGroup = groupService.updateGroup(id, groupDetails);
            return ResponseEntity.ok(updatedGroup);
        } catch (Exception e) {
            return ResponseEntity.status(403).body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteGroup(
            @PathVariable String id,
            @RequestHeader(value = "userId", required = true) String userId) {
        try {
            groupService.deleteGroup(id, userId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(403).body(e.getMessage());
        }
    }

    @PostMapping("/{groupId}/join")
    public ResponseEntity<Group> joinGroup(
            @PathVariable String groupId,
            @RequestHeader(value = "userId", required = true) String userId) {
        return ResponseEntity.ok(groupService.joinGroup(groupId, userId));
    }

    @PostMapping("/{groupId}/leave")
    public ResponseEntity<Group> leaveGroup(
            @PathVariable String groupId,
            @RequestHeader(value = "userId", required = true) String userId) {
        return ResponseEntity.ok(groupService.leaveGroup(groupId, userId));
    }
}