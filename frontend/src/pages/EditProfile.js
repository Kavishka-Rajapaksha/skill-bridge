import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axios";
import Header from "../components/Header";

function EditProfile() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    bio: "",
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));

        if (!user || !user.id) {
          // Redirect to login if not authenticated
          navigate("/login");
          return;
        }

        // Initialize form with default values to avoid undefined values
        setFormData({
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          bio: user.bio || "",
        });

        if (user.profilePicture) {
          setProfilePicturePreview(user.profilePicture);
        }

        // Try to fetch fresh user data in the background
        try {
          const response = await axiosInstance.get(`/api/users/${user.id}`);
          const userData = response.data;

          // Ensure we have values and not null
          setFormData({
            firstName: userData.firstName || "",
            lastName: userData.lastName || "",
            bio: userData.bio || "",
          });

          if (userData.profilePicture) {
            setProfilePicturePreview(userData.profilePicture);
          }
        } catch (apiError) {
          console.warn(
            "Could not fetch latest user data, using cached data instead:",
            apiError
          );
          // Continue with localStorage data, no need to show error to user
          // For Google users, make sure we have data even if it's empty strings
          if (
            user.email &&
            (user.firstName === null || user.firstName === undefined)
          ) {
            setFormData((prevData) => ({
              ...prevData,
              firstName: user.email.split("@")[0] || "", // Use email username as default first name
              lastName: "",
              bio: "",
            }));
          }
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        setError("Failed to load user data. Please try refreshing the page.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file is an image
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }

    setProfilePicture(file);
    setProfilePicturePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const user = JSON.parse(localStorage.getItem("user"));

      if (!user || !user.id) {
        navigate("/login");
        return;
      }

      // Create form data
      const data = new FormData();

      // Make sure to send empty strings rather than undefined
      data.append("firstName", formData.firstName || "");
      data.append("lastName", formData.lastName || "");
      data.append("bio", formData.bio || "");

      if (profilePicture) {
        data.append("profilePicture", profilePicture);
      }

      // Update profile
      const response = await axiosInstance.put(`/api/users/${user.id}`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Update user in localStorage with proper defaults for any missing fields
      const updatedUser = {
        ...user,
        firstName: response.data.firstName || "",
        lastName: response.data.lastName || "",
        bio: response.data.bio || "",
        profilePicture: response.data.profilePicture || user.profilePicture,
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));

      setSuccess("Profile updated successfully!");

      // Redirect to profile after short delay
      setTimeout(() => {
        navigate(`/profile/${user.id}`);
      }, 1500);
    } catch (error) {
      console.error("Error updating profile:", error);
      setError(error.response?.data || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <div className="flex justify-center items-center min-h-screen bg-gray-50">
          <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-2xl animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="flex items-center mb-8">
              <div className="w-24 h-24 rounded-full bg-gray-200 mr-6"></div>
              <div className="h-10 bg-gray-200 rounded w-32"></div>
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="mb-6">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-12 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
            <div className="flex justify-end">
              <div className="h-10 bg-gray-200 rounded w-24 mr-4"></div>
              <div className="h-10 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h1 className="text-3xl font-bold mb-8 text-gray-800 border-b pb-4">
              Edit Your Profile
            </h1>

            {error && (
              <div className="mb-6 p-4 border-l-4 border-red-500 bg-red-50 text-red-700 rounded-md flex items-center">
                <svg
                  className="w-5 h-5 mr-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 01-1-1v-4a1 1 0 112 0v4a1 1 0 01-1 1z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 border-l-4 border-green-500 bg-green-50 text-green-700 rounded-md flex items-center">
                <svg
                  className="w-5 h-5 mr-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="mb-8">
                <label className="block text-gray-700 font-medium mb-2">
                  Profile Picture
                </label>
                <div className="flex items-center">
                  <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-gray-200 mr-6 shadow-md">
                    {profilePicturePreview ? (
                      <img
                        src={profilePicturePreview}
                        alt="Profile Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-300 to-indigo-300">
                        <span className="text-3xl font-semibold text-white">
                          {formData.firstName?.charAt(0) || "?"}
                        </span>
                      </div>
                    )}
                  </div>

                  <label className="cursor-pointer px-5 py-2.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-all duration-200 inline-flex items-center shadow-sm border border-indigo-100">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Upload Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    className="block text-gray-700 font-medium mb-2"
                    htmlFor="firstName"
                  >
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    placeholder="Your first name"
                  />
                </div>

                <div>
                  <label
                    className="block text-gray-700 font-medium mb-2"
                    htmlFor="lastName"
                  >
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    placeholder="Your last name"
                  />
                </div>
              </div>

              <div>
                <label
                  className="block text-gray-700 font-medium mb-2"
                  htmlFor="bio"
                >
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows="4"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  placeholder="Tell us about yourself"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Share a little about your background, interests, or skills
                </p>
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/profile/${JSON.parse(localStorage.getItem("user")).id}`
                    )
                  }
                  className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium flex items-center"
                  disabled={saving}
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 font-medium flex items-center shadow-md ${
                    saving
                      ? "opacity-70 cursor-not-allowed"
                      : "hover:shadow-lg transform hover:-translate-y-0.5"
                  }`}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default EditProfile;
