import React, { useState, useEffect } from "react";
import CreatePost from "../components/CreatePost";
import Post from "../components/Post";
import axiosInstance from "../utils/axios";
import { useNavigate } from "react-router-dom";

function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const fetchUserData = async () => {
    try {
      // Check for stored user data instead of just the token
      const userData = localStorage.getItem("user");
      if (!userData) {
        navigate("/login");
        return;
      }

      const user = JSON.parse(userData);
      setUser(user);
      
      // Optionally validate token on backend or refresh user data
      // const response = await axiosInstance.get("/api/users/me");
      // setUser(response.data);
    } catch (error) {
      console.error("Error fetching user data:", error);
      localStorage.removeItem("user");
      navigate("/login");
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await axiosInstance.get("/api/posts");
      setPosts(response.data);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
    fetchPosts();
  }, []);

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
  };

  const handlePostDeleted = (postId) => {
    setPosts(posts.filter((post) => post.id !== postId));
  };

  const handlePostUpdated = (updatedPost) => {
    setPosts(
      posts.map((post) => (post.id === updatedPost.id ? updatedPost : post))
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-2xl mx-auto py-8 px-4">
        <CreatePost onPostCreated={handlePostCreated} />
        {posts.map((post) => (
          <Post
            key={post.id}
            post={post}
            onPostDeleted={handlePostDeleted}
            onPostUpdated={handlePostUpdated}
          />
        ))}
      </div>
    </>
  );
}

export default Home;
