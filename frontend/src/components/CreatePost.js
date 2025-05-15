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
  const [expanded, setExpanded] = useState(false);

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
    <div className="bg-white rounded-xl shadow-lg p-5 mb-6 transform transition-all duration-300 border border-gray-100 hover:shadow-xl">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
        <span className="bg-gradient-to-r from-blue-500 to-purple-500 w-1 h-6 rounded mr-2 inline-block"></span>
        Create Post
      </h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
          <p className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </p>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div 
          className={`relative transition-all duration-300 ${expanded ? '' : 'cursor-text'}`}
          onClick={() => !expanded && setExpanded(true)}
        >
          <div className={`mb-3 flex flex-wrap items-center border-b border-gray-200 pb-3 transition-all ${expanded ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
            <div className="flex items-center space-x-1 bg-gray-50 rounded-lg p-1 shadow-sm">
              <button 
                type="button"
                onClick={() => insertFormatting('bold')}
                className="p-2 text-gray-700 hover:bg-blue-100 hover:text-blue-600 rounded-md transition-all duration-200"
                title="Bold"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24" strokeWidth="2" stroke="none">
                  <path d="M15.6 11.8c1-.7 1.6-1.8 1.6-2.8a4 4 0 0 0-4-4H7v14h7c2 0 3.5-1.6 3.5-3.6 0-1.3-.8-2.4-1.9-3.6zM10 7.5h3a1.5 1.5 0 1 1 0 3h-3v-3zm3.5 9H10v-3h3.5a1.5 1.5 0 0 1 0 3z"/>
                </svg>
              </button>
              <button 
                type="button"
                onClick={() => insertFormatting('italic')}
                className="p-2 text-gray-700 hover:bg-blue-100 hover:text-blue-600 rounded-md transition-all duration-200"
                title="Italic"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24" strokeWidth="0.5" stroke="currentColor">
                  <path d="M10 5v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V5h-8z"/>
                </svg>
              </button>
              <button 
                type="button"
                onClick={() => insertFormatting('code')}
                className={`p-2 text-gray-700 hover:bg-blue-100 hover:text-blue-600 rounded-md transition-all duration-200 ${isCodeBlock ? 'bg-blue-100 text-blue-600' : ''}`}
                title="Code Block"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
                </svg>
              </button>
              <button 
                type="button"
                onClick={() => insertFormatting('bullet')}
                className="p-2 text-gray-700 hover:bg-blue-100 hover:text-blue-600 rounded-md transition-all duration-200"
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
                  className={`p-2 text-gray-700 hover:bg-blue-100 hover:text-blue-600 rounded-md transition-all duration-200 ${showColorPicker ? 'bg-blue-100 text-blue-600' : ''}`}
                  title="Text Color"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                  </svg>
                </button>
                
                {showColorPicker && (
                  <div className="absolute left-0 top-full mt-1 bg-white rounded-lg shadow-xl z-10 border border-gray-200 p-2 min-w-[150px] animate-fade-in">
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
            </div>
            
            {isCodeBlock && (
              <span className="ml-3 text-xs bg-blue-50 text-blue-600 py-1 px-3 rounded-full self-center">
                <span className="font-medium">Tab</span> for indentation
              </span>
            )}
          </div>

          <textarea
            className={`w-full p-4 border border-gray-200 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent shadow-sm transition-all duration-300 ${
              expanded ? 'min-h-[120px] font-mono' : 'h-14'
            } ${isCodeBlock ? 'bg-gray-50' : ''}`}
            placeholder={expanded ? "What's on your mind? Use ** for bold, * for italic, ` for inline code, or ``` for code blocks" : "Create a post..."}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (!expanded) setExpanded(true);
            }}
            disabled={isLoading}
            ref={textareaRef}
            onKeyDown={handleKeyDown}
            onFocus={() => setExpanded(true)}
          />

          {(previewUrls.length > 0 || videoPreviewUrl) && (
            <div className={`mb-4 rounded-xl overflow-hidden bg-gray-50 p-3 border border-gray-100 transition-all duration-500 ${expanded ? 'opacity-100' : 'opacity-0 h-0'}`}>
              <div className="flex flex-wrap gap-2">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Preview ${index}`}
                      className="w-24 h-24 object-cover rounded-lg shadow-sm border border-gray-200"
                    />
                    <button 
                      type="button" 
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      onClick={() => {
                        const newImages = [...images];
                        newImages.splice(index, 1);
                        setImages(newImages);
                        
                        const newPreviewUrls = [...previewUrls];
                        URL.revokeObjectURL(newPreviewUrls[index]);
                        newPreviewUrls.splice(index, 1);
                        setPreviewUrls(newPreviewUrls);
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              {videoPreviewUrl && (
                <div className="relative">
                  <video
                    src={videoPreviewUrl}
                    className="w-full max-h-96 object-contain rounded-lg shadow-sm"
                    controls
                  />
                  <button 
                    type="button" 
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-70 hover:opacity-100 transition-opacity duration-200"
                    onClick={() => {
                      if (videoPreviewUrl) {
                        URL.revokeObjectURL(videoPreviewUrl);
                        setVideoPreviewUrl("");
                        setVideo(null);
                      }
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={`flex justify-between items-center transition-all duration-300 ${expanded ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
          <div className="flex gap-4 items-center">
            <label className="cursor-pointer bg-gray-50 hover:bg-blue-50 rounded-full p-2 transition-colors duration-200 group">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                disabled={!!video || isLoading}
              />
              <svg
                className="w-6 h-6 text-gray-400 group-hover:text-blue-500 transition-colors duration-200"
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
            </label>

            <label className="cursor-pointer bg-gray-50 hover:bg-blue-50 rounded-full p-2 transition-colors duration-200 group">
              <input
                type="file"
                accept="video/mp4,video/quicktime"
                onChange={handleVideoChange}
                className="hidden"
                disabled={images.length > 0 || isLoading}
              />
              <svg
                className="w-6 h-6 text-gray-400 group-hover:text-blue-500 transition-colors duration-200"
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
            
            {expanded && (
              <button 
                type="button" 
                onClick={() => setExpanded(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || (!content && !video && images.length === 0)}
            className={`px-6 py-2.5 rounded-full font-medium text-white transition-all duration-300 transform
              ${
                isLoading || (!content && !video && images.length === 0)
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-500 to-purple-600 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
              }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                <span>Posting...</span>
              </div>
            ) : (
              <span>Post</span>
            )}
          </button>
        </div>
      </form>

      {isLoading && progress > 0 && (
        <div className="mt-4">
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-center mt-1 text-gray-500">Uploading: {progress}%</p>
        </div>
      )}

      {content && expanded && (
        <div className="mt-4 border-t pt-4 animate-fade-in">
          <h3 className="text-sm font-semibold mb-2 text-gray-500 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            Preview
          </h3>
          <div className="bg-gradient-to-br from-white to-gray-50 p-4 rounded-lg shadow-sm border border-gray-100">
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
