package com.example.backend.service;

import com.example.backend.model.User;
import com.example.backend.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.logging.Logger;
import java.util.stream.Collectors;

@Service
public class AdminService {
    private static final Logger logger = Logger.getLogger(AdminService.class.getName());

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    public List<User> getAllUsers() {
        List<User> users = userRepository.findAll();
        // Sanitize sensitive information before returning
        return users.stream()
                .map(this::sanitizeUserForResponse)
                .collect(Collectors.toList());
    }
    
    public List<User> getBlockedUsers() {
        List<User> users = userRepository.findAll()
                .stream()
                .filter(user -> !user.isEnabled())
                .map(this::sanitizeUserForResponse)
                .collect(Collectors.toList());
        return users;
    }
    
    public User createUser(User user) {
        // Check if email already exists
        if (userRepository.existsByEmail(user.getEmail())) {
            logger.warning("Email already exists: " + user.getEmail());
            throw new IllegalArgumentException("Email already exists");
        }
        
        // Set raw password (for authentication)
        user.setRawPassword(user.getPassword());
        
        // Encode password for storage
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        
        // Set creation date if needed
        if (user.getCreatedAt() == null) {
            user.setCreatedAt(new Date());
        }
        
        logger.info("Saving new user: " + user.getEmail() + " with role: " + user.getRole());
        
        // Save user
        User savedUser = userRepository.save(user);
        
        // Return sanitized user
        return sanitizeUserForResponse(savedUser);
    }
    
    public User toggleUserStatus(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        // Toggle status
        user.setEnabled(!user.isEnabled());
        User updatedUser = userRepository.save(user);
        
        return sanitizeUserForResponse(updatedUser);
    }
    
    private User sanitizeUserForResponse(User user) {
        // Create a copy to avoid modifying the original entity
        User sanitizedUser = new User();
        sanitizedUser.setId(user.getId());
        sanitizedUser.setFirstName(user.getFirstName());
        sanitizedUser.setLastName(user.getLastName());
        sanitizedUser.setEmail(user.getEmail());
        sanitizedUser.setRole(user.getRole());
        sanitizedUser.setBio(user.getBio());
        sanitizedUser.setProfilePicture(user.getProfilePicture());
        sanitizedUser.setEnabled(user.isEnabled());
        sanitizedUser.setCreatedAt(user.getCreatedAt());
        // Don't set password
        
        return sanitizedUser;
    }

    /**
     * Get user by ID
     */
    public User getUserById(String userId) {
        try {
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                return user;
            }
            logger.warning("User not found with ID: " + userId);
            return null;
        } catch (Exception e) {
            logger.severe("Error finding user by ID: " + userId + ", Error: " + e.getMessage());
            return null;
        }
    }

    /**
     * Save user
     */
    public User saveUser(User user) {
        try {
            User savedUser = userRepository.save(user);
            return sanitizeUserForResponse(savedUser);
        } catch (Exception e) {
            logger.severe("Error saving user: " + e.getMessage());
            throw e;
        }
    }
}
