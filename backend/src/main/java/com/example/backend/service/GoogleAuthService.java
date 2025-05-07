package com.example.backend.service;

import com.example.backend.model.User;
import com.example.backend.repository.UserRepository;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;
import java.util.Date;
import java.util.Optional;
import java.util.UUID;

@Service
public class GoogleAuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String clientId;

    public GoogleAuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${google.oauth.client-id}") String clientId) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.clientId = clientId;
    }

    // Updated method to handle both login and registration
    public User authenticateGoogleUser(String idTokenString, boolean isRegistration) throws Exception {
        System.out.println("GoogleAuthService: Authenticating token, isRegistration=" + isRegistration);
        System.out.println("Using client ID: " + clientId);
        
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(), new GsonFactory())
                    .setAudience(Collections.singletonList(clientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken == null) {
                throw new IllegalArgumentException("Invalid Google ID token");
            }

            // Get user info from token
            Payload payload = idToken.getPayload();
            String email = payload.getEmail();
            String firstName = (String) payload.get("given_name");
            String lastName = (String) payload.get("family_name");
            String picture = (String) payload.get("picture");

            // Check if user exists
            Optional<User> existingUserOpt = userRepository.findByEmail(email);
            
            if (existingUserOpt.isPresent()) {
                User existingUser = existingUserOpt.get();
                
                // If this is registration and user already exists
                if (isRegistration) {
                    System.out.println("User tried to register with Google but already exists: " + email);
                    // You could throw an exception or just log them in
                    // throw new RuntimeException("User already exists. Please login instead.");
                }
                
                // Update profile picture if available
                if (picture != null && !picture.equals(existingUser.getProfilePicture())) {
                    existingUser.setProfilePicture(picture);
                    userRepository.save(existingUser);
                }
                
                // Update last login time
                existingUser.setLastLogin(new Date());
                userRepository.save(existingUser);
                
                return existingUser;
            }

            // Create a new user
            User newUser = new User();
            newUser.setEmail(email);
            newUser.setFirstName(firstName != null ? firstName : "Google");
            newUser.setLastName(lastName != null ? lastName : "User");
            newUser.setProfilePicture(picture);
            newUser.setCreatedAt(new Date());
            newUser.setLastLogin(new Date());
            newUser.setEnabled(true);
            newUser.setRole("ROLE_USER"); // Default role
            
            // Generate a random secure password
            String randomPassword = UUID.randomUUID().toString();
            newUser.setPassword(passwordEncoder.encode(randomPassword));
            
            System.out.println("Creating new user via Google: " + email);
            return userRepository.save(newUser);
            
        } catch (GeneralSecurityException | IOException e) {
            System.err.println("Google token verification failed: " + e.getMessage());
            e.printStackTrace();
            throw new Exception("Failed to verify Google ID token: " + e.getMessage());
        } catch (Exception e) {
            System.err.println("Unexpected error during Google authentication: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    // Keep the original method for backward compatibility
    public User authenticateGoogleUser(String idTokenString) throws Exception {
        return authenticateGoogleUser(idTokenString, false);
    }
}