package com.example.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.example.backend.dto.StatsResponse;
import com.example.backend.model.Post;
import com.example.backend.model.User;
import com.example.backend.repository.PostRepository;
import com.example.backend.repository.UserRepository;

import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

@Service
public class AdminStatsService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PostRepository postRepository;
    
    // Store the last computed values to avoid frequent recalculation
    private StatsResponse cachedUserStats = null;
    private StatsResponse cachedPostStats = null;
    private Integer cachedTodayPostsCount = null;
    private long lastUserStatsUpdate = 0;
    private long lastPostStatsUpdate = 0;
    private long lastTodayPostsUpdate = 0;
    private static final long CACHE_TTL = TimeUnit.MINUTES.toMillis(5); // 5 minutes cache validity

    @Cacheable(value = "adminStats", key = "'userStats'")
    public StatsResponse getUserStats() {
        // Return cached value if it's still valid
        long currentTime = System.currentTimeMillis();
        if (cachedUserStats != null && (currentTime - lastUserStatsUpdate) < CACHE_TTL) {
            return cachedUserStats;
        }
        
        int totalUsers = (int) userRepository.count();

        // Calculate new users today
        Calendar calendar = Calendar.getInstance();
        calendar.set(Calendar.HOUR_OF_DAY, 0);
        calendar.set(Calendar.MINUTE, 0);
        calendar.set(Calendar.SECOND, 0);
        calendar.set(Calendar.MILLISECOND, 0);
        Date today = calendar.getTime();

        int newUsersToday = userRepository.countByCreatedAtGreaterThanEqual(today);

        // Calculate active users (users with enabled=true)
        int activeUsers = userRepository.countByEnabledTrue();

        StatsResponse response = new StatsResponse(totalUsers, newUsersToday, activeUsers);
        
        // Update cache
        cachedUserStats = response;
        lastUserStatsUpdate = currentTime;
        
        return response;
    }

    @Cacheable(value = "adminStats", key = "'postStats'")
    public StatsResponse getPostStats() {
        // Return cached value if it's still valid
        long currentTime = System.currentTimeMillis();
        if (cachedPostStats != null && (currentTime - lastPostStatsUpdate) < CACHE_TTL) {
            return cachedPostStats;
        }
        
        int totalPosts = (int) postRepository.count();
        StatsResponse response = new StatsResponse(totalPosts);
        
        // Update cache
        cachedPostStats = response;
        lastPostStatsUpdate = currentTime;
        
        return response;
    }

    @Cacheable(value = "adminStats", key = "'todayPosts'")
    public int getTodayPostsCount() {
        // Return cached value if it's still valid
        long currentTime = System.currentTimeMillis();
        if (cachedTodayPostsCount != null && (currentTime - lastTodayPostsUpdate) < CACHE_TTL) {
            return cachedTodayPostsCount;
        }
        
        Calendar calendar = Calendar.getInstance();
        calendar.set(Calendar.HOUR_OF_DAY, 0);
        calendar.set(Calendar.MINUTE, 0);
        calendar.set(Calendar.SECOND, 0);
        calendar.set(Calendar.MILLISECOND, 0);
        Date today = calendar.getTime();

        int count = (int) postRepository.countByCreatedAtGreaterThanEqual(today);
        
        // Update cache
        cachedTodayPostsCount = count;
        lastTodayPostsUpdate = currentTime;
        
        return count;
    }
    
    // Get all stats in parallel
    public CompletableFuture<StatsResponse[]> getAllStatsParallel() {
        CompletableFuture<StatsResponse> userStatsFuture = CompletableFuture.supplyAsync(this::getUserStats);
        CompletableFuture<StatsResponse> postStatsFuture = CompletableFuture.supplyAsync(this::getPostStats);
        CompletableFuture<Integer> todayPostsFuture = CompletableFuture.supplyAsync(this::getTodayPostsCount);
        
        return CompletableFuture.allOf(userStatsFuture, postStatsFuture, todayPostsFuture)
            .thenApply(v -> {
                StatsResponse[] stats = new StatsResponse[3];
                stats[0] = userStatsFuture.join();
                stats[1] = postStatsFuture.join();
                
                // Create a stats response for today's posts
                StatsResponse todayStats = new StatsResponse();
                todayStats.setCount(todayPostsFuture.join());
                stats[2] = todayStats;
                
                return stats;
            });
    }
}
