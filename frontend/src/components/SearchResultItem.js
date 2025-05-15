import React from "react";

function SearchResultItem({ user, onSelect }) {
  if (!user) return null;

  // Handle different user object structures to make the component more robust
  const name = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}`
    : user.name || user.username || user.email || "Unknown User";
  
  const email = user.email || "";
  const avatar = user.profilePicture || user.avatar || "";
  
  // Extract first letter from name or email for avatar fallback
  const firstLetter = (name.charAt(0) || email.charAt(0) || "?").toUpperCase();
  
  const handleClick = () => {
    onSelect(user);
  };

  return (
    <div
      onClick={handleClick}
      className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
    >
      {avatar ? (
        <img
          src={avatar}
          alt={`${name}'s avatar`}
          className="h-8 w-8 rounded-full mr-3 object-cover border border-gray-200"
        />
      ) : (
        <div className="h-8 w-8 rounded-full bg-blue-500 text-white flex items-center justify-center mr-3">
          {firstLetter}
        </div>
      )}
      <div>
        <div className="text-sm font-medium text-gray-900">{name}</div>
        {email && <div className="text-xs text-gray-500">{email}</div>}
      </div>
    </div>
  );
}

export default SearchResultItem;
