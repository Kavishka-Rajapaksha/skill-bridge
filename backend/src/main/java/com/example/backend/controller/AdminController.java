package com.example.backend.controller;

import com.example.backend.model.User;
import com.example.backend.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
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
    
    /**
     * Update user role endpoint
     */
    @PutMapping("/users/{userId}/role")
    public ResponseEntity<?> updateUserRole(@PathVariable String userId, @RequestBody Map<String, String> payload) {
        try {
            logger.info("Updating role for user: " + userId);
            
            // Extract role from payload
            String role = payload.get("role");
            if (role == null || (!role.equals("ROLE_USER") && !role.equals("ROLE_ADMIN"))) {
                return ResponseEntity.badRequest().body("Invalid role specified");
            }
            
            // Find the user by ID
            Optional<User> userOpt = userRepository.findById(userId);
            if (!userOpt.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found with ID: " + userId);
            }
            
            // Update the user's role
            User user = userOpt.get();
            user.setRole(role);
            User updatedUser = userRepository.save(user);
            
            // Return sanitized user object (remove sensitive info)
            return ResponseEntity.ok(sanitizeUserForResponse(updatedUser));
        } catch (Exception e) {
            logger.severe("Error updating user role: " + e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
