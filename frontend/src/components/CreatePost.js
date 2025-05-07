import React, { useState, useEffect, useRef } from "react";
import axiosInstance from "../utils/axios";
import { useNavigate } from "react-router-dom";

function CreatePost({ onPostCreated }) {
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [video, setVideo] = useState(null);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();
  const textareaRef = useRef(null);
  
  const [isCodeBlock, setIsCodeBlock] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const colorOptions = [
    { name: 'Red', class: 'text-red-500', value: 'red' },
    { name: 'Blue', class: 'text-blue-500', value: 'blue' },
    { name: 'Green', class: 'text-green-500', value: 'green' },
    { name: 'Purple', class: 'text-purple-500', value: 'purple' },
    { name: 'Orange', class: 'text-orange-500', value: 'orange' }
  ];

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const validImages = files.every((file) => file.type.startsWith("image/"));
      if (!validImages) {
        setError("Please upload only image files");
        return;
      }

      setImages(files);
      const urls = files.map((file) => URL.createObjectURL(file));
      setPreviewUrls(urls);
      setError("");
      setVideo(null);
      setVideoPreviewUrl("");
    }
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setError("Video size must be less than 15MB");
      return;
    }

    if (!["video/mp4", "video/quicktime"].includes(file.type)) {
      setError("Only MP4 and QuickTime videos are supported");
      return;
    }

    const videoURL = URL.createObjectURL(file);
    const videoElement = document.createElement("video");
    videoElement.preload = "metadata";

    videoElement.onloadedmetadata = () => {
      window.URL.revokeObjectURL(videoElement.src);

      if (videoElement.duration > 30) {
        setError("Video must be 30 seconds or less");
        return;
      }

      const timestamp = new Date().getTime();
      const newFile = new File([file], `video-${timestamp}-${file.name}`, {
        type: file.type,
      });

      setVideo(newFile);
      setVideoPreviewUrl(videoURL);
      setImages([]);
      setPreviewUrls([]);
      setError("");
    };

    videoElement.onerror = () => {
      setError("Could not load video. Please try a different file.");
      window.URL.revokeObjectURL(videoElement.src);
    };

    videoElement.src = videoURL;
  };

  const insertFormatting = (format, colorValue = null) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    let formattedText = '';
    let cursorAdjustment = 0;
    
    switch(format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        cursorAdjustment = 2;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        cursorAdjustment = 1;
        break;
      case 'code':
        if (selectedText.includes('\n') || isCodeBlock) {
          formattedText = selectedText ? 
            '```\n' + selectedText + '\n```' : 
            '```\n\n```';
          setIsCodeBlock(true);
          cursorAdjustment = 4;
        } else {
          formattedText = `\`${selectedText}\``;
          cursorAdjustment = 1;
        }
        break;
      case 'color':
        formattedText = `{${colorValue}}${selectedText}{/color}`;
        cursorAdjustment = colorValue.length + 2;
        break;
      case 'bullet':
        if (selectedText.includes('\n')) {
          const lines = selectedText.split('\n');
          formattedText = lines.map(line => `• ${line}`).join('\n');
        } else {
          formattedText = `• ${selectedText}`;
        }
        cursorAdjustment = 2;
        break;
      default:
        return;
    }
    
    const newContent = content.substring(0, start) + formattedText + content.substring(end);
    setContent(newContent);
    
    setTimeout(() => {
      if (selectedText.length === 0) {
        textarea.focus();
        textarea.selectionStart = start + cursorAdjustment;
        textarea.selectionEnd = start + cursorAdjustment;
      } else {
        textarea.focus();
        textarea.selectionStart = start;
        textarea.selectionEnd = start + formattedText.length;
      }
    }, 0);
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Tab' && isCodeBlock) {
      e.preventDefault();
      
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      const newContent = content.substring(0, start) + '    ' + content.substring(end);
      setContent(newContent);
      
      setTimeout(() => {
        textarea.selectionStart = start + 4;
        textarea.selectionEnd = start + 4;
      }, 0);
    }
    
    if (e.key === 'Enter') {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const currentLine = content.substring(0, start).split('\n').pop();
      
      if (currentLine.trimStart().startsWith('• ')) {
        if (currentLine.trim() === '• ') {
          e.preventDefault();
          
          const lineStart = content.lastIndexOf('\n', start - 1) + 1;
          if (lineStart === 0) {
            setContent(content.substring(start));
          } else {
            setContent(
              content.substring(0, lineStart) + 
              content.substring(start)
            );
          }
          
          setTimeout(() => {
            textarea.selectionStart = lineStart;
            textarea.selectionEnd = lineStart;
          }, 0);
          
        } else {
          e.preventDefault();
          const indentation = currentLine.match(/^\s*/)[0];
          const insertion = '\n' + indentation + '• ';
          
          setContent(
            content.substring(0, start) + 
            insertion + 
            content.substring(start)
          );
          
          setTimeout(() => {
            const newPosition = start + insertion.length;
            textarea.selectionStart = newPosition;
            textarea.selectionEnd = newPosition;
          }, 0);
        }
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setProgress(0);
    setIsLoading(true);

    const user = JSON.parse(localStorage.getItem("user"));

    if (!user || !user.id) {
      navigate("/login");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("userId", user.id);
      formData.append("content", content);

      if (video) {
        formData.append("video", video);
      } else if (images.length > 0) {
        images.forEach((image) => formData.append("images", image));
      }

      const response = await axiosInstance.post("/api/posts", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percentCompleted);
        },
      });

      previewUrls.forEach((url) => URL.revokeObjectURL(url));
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);

      setContent("");
      setImages([]);
      setVideo(null);
      setPreviewUrls([]);
      setVideoPreviewUrl("");
      setProgress(0);
      setIsCodeBlock(false);

      if (onPostCreated) {
        onPostCreated(response.data);
      }

      alert("Post created successfully!");
    } catch (error) {
      console.error("Error creating post:", error);
      if (error.code === "ECONNABORTED") {
        setError(
          "Upload timed out. Please try again with a smaller file or check your connection."
        );
      } else if (error.response?.status === 403) {
        setError("Not authorized. Please log in again.");
        localStorage.removeItem("user");
        navigate("/login");
      } else {
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data ||
          "Failed to create post. Please try again.";
        setError(
          typeof errorMessage === "object"
            ? JSON.stringify(errorMessage)
            : errorMessage
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    };
  }, [previewUrls, videoPreviewUrl]);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <h2 className="text-xl font-semibold mb-4">Create Post</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit}>
        {/* Enhanced formatting toolbar with better icons and styling */}
        <div className="mb-3 flex flex-wrap border-b border-gray-200 pb-3">
          <button 
            type="button"
            onClick={() => insertFormatting('bold')}
            className="p-2 mr-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded transition-all duration-200"
            title="Bold"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24" strokeWidth="2" stroke="none">
              <path d="M15.6 11.8c1-.7 1.6-1.8 1.6-2.8a4 4 0 0 0-4-4H7v14h7c2 0 3.5-1.6 3.5-3.6 0-1.3-.8-2.4-1.9-3.6zM10 7.5h3a1.5 1.5 0 1 1 0 3h-3v-3zm3.5 9H10v-3h3.5a1.5 1.5 0 0 1 0 3z"/>
            </svg>
          </button>
          <button 
            type="button"
            onClick={() => insertFormatting('italic')}
            className="p-2 mr-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded transition-all duration-200"
            title="Italic"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24" strokeWidth="0.5" stroke="currentColor">
              <path d="M10 5v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V5h-8z"/>
            </svg>
          </button>
          <button 
            type="button"
            onClick={() => insertFormatting('code')}
            className={`p-2 mr-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded transition-all duration-200 ${isCodeBlock ? 'bg-blue-100 text-blue-600' : ''}`}
            title="Code Block"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
            </svg>
          </button>
          <button 
            type="button"
            onClick={() => insertFormatting('bullet')}
            className="p-2 mr-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded transition-all duration-200"
            title="Bullet List"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/>
            </svg>
          </button>
          <div className="relative">
            <button 
              type="button"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className={`p-2 mr-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded transition-all duration-200 ${showColorPicker ? 'bg-blue-100 text-blue-600' : ''}`}
              title="Text Color"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 22C6.49 22 2 17.51 2 12S6.49 2 12 2s10 4.04 10 9c0 3.31-2.69 6-6 6h-1.77c-.28 0-.5.22-.5.5 0 .12.05.23.13.33.41.47.64 1.06.64 1.67A2.5 2.5 0 0 1 12 22zm0-18c-4.41 0-8 3.59-8 8s3.59 8 8 8c.28 0 .5-.22.5-.5a.54.54 0 0 0-.14-.35c-.41-.46-.63-1.05-.63-1.65a2.5 2.5 0 0 1 2.5-2.5H16c2.21 0 4-1.79 4-4 0-3.86-3.59-7-8-7z"/>
                <circle cx="6.5" cy="11.5" r="1.5"/>
                <circle cx="9.5" cy="7.5" r="1.5"/>
                <circle cx="14.5" cy="7.5" r="1.5"/>
                <circle cx="17.5" cy="11.5" r="1.5"/>
              </svg>
            </button>
            
            {showColorPicker && (
              <div className="absolute left-0 top-full mt-1 bg-white rounded-lg shadow-lg z-10 border border-gray-200 p-2 min-w-[150px]">
                <div className="flex flex-col">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => {
                        insertFormatting('color', color.value);
                        setShowColorPicker(false);
                      }}
                      className={`flex items-center px-3 py-2 rounded hover:bg-gray-100 transition-colors duration-200 ${color.class}`}
                    >
                      <span className="w-4 h-4 rounded-full mr-3 shadow-inner" style={{ backgroundColor: color.value }}></span>
                      <span className="font-medium">{color.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          {isCodeBlock && (
            <span className="ml-2 text-xs bg-blue-50 text-blue-600 py-1 px-2 rounded-md self-center">
              Press Tab for indentation
            </span>
          )}
        </div>

        <textarea
          className={`w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm font-mono ${isCodeBlock ? 'bg-gray-50' : ''}`}
          rows="5"
          placeholder="What's on your mind? Use ** for bold, * for italic, ` for inline code, or ``` for code blocks"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isLoading}
          ref={textareaRef}
          onKeyDown={handleKeyDown}
        />

        <div className="mb-4 flex flex-wrap gap-2">
          {previewUrls.map((url, index) => (
            <img
              key={index}
              src={url}
              alt={`Preview ${index}`}
              className="w-24 h-24 object-cover rounded-lg"
            />
          ))}
          {videoPreviewUrl && (
            <video
              src={videoPreviewUrl}
              className="w-full max-h-96 object-contain"
              controls
            />
          )}
        </div>

        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <label className="cursor-pointer">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                disabled={!!video || isLoading}
              />
              <svg
                className="w-8 h-8 text-blue-500 hover:text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </label>

            <label className="cursor-pointer">
              <input
                type="file"
                accept="video/mp4,video/quicktime"
                onChange={handleVideoChange}
                className="hidden"
                disabled={images.length > 0 || isLoading}
              />
              <svg
                className="w-8 h-8 text-blue-500 hover:text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading || (!content && !video && images.length === 0)}
            className={`px-6 py-2 rounded-lg font-semibold text-white
              ${
                isLoading || (!content && !video && images.length === 0)
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600"
              }`}
          >
            {isLoading ? "Posting..." : "Post"}
          </button>
        </div>
      </form>

      {isLoading && progress > 0 && (
        <div className="w-full h-2 bg-gray-200 rounded-full mb-4">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
          <p className="text-sm text-center mt-1">Uploading: {progress}%</p>
        </div>
      )}

      {content && (
        <div className="mt-4 border-t pt-4">
          <h3 className="text-sm font-semibold mb-2 text-gray-500">Preview:</h3>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="prose max-w-none">
              {content.split('\n').map((line, i) => {
                let processedLine = line
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>')
                  .replace(/\{(red|blue|green|purple|orange)\}(.*?)\{\/color\}/g, (match, color, text) => {
                    return `<span class="text-${color}-500">${text}</span>`;
                  })
                  .replace(/^• (.*)$/, '<span class="inline-flex items-center">• $1</span>');
                
                return <div key={i} dangerouslySetInnerHTML={{ __html: processedLine }} />;
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreatePost;
