package com.example.backend.controller;

import com.example.backend.model.User;
import com.example.backend.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.logging.Logger;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001", "http://localhost:3002" })
public class AdminController {

    private static final Logger logger = Logger.getLogger(AdminController.class.getName());
    
    @Autowired
    private AdminService adminService;

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        logger.info("Getting all users");
        return ResponseEntity.ok(adminService.getAllUsers());
    }
    
    @GetMapping("/users/blocked")
    public ResponseEntity<List<User>> getBlockedUsers() {
        logger.info("Getting blocked users");
        return ResponseEntity.ok(adminService.getBlockedUsers());
    }
    
    @PostMapping("/users")
    public ResponseEntity<?> createUser(@RequestBody User user) {
        try {
            logger.info("Creating user with email: " + user.getEmail());
            User createdUser = adminService.createUser(user);
            return ResponseEntity.ok(createdUser);
        } catch (Exception e) {
            logger.warning("Error creating user: " + e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @PutMapping("/users/{userId}/toggle-status")
    public ResponseEntity<?> toggleUserStatus(@PathVariable String userId) {
        try {
            User user = adminService.toggleUserStatus(userId);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
