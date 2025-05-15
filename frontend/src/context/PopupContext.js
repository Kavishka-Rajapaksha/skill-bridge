import React, { createContext, useState, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PopupContext = createContext();

export const PopupProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmationConfig, setConfirmationConfig] = useState({
    title: "",
    message: "",
    onConfirm: () => {},
    onCancel: () => {},
    confirmText: "Confirm",
    cancelText: "Cancel",
  });
  
  // For toast/popup notifications
  const [notification, setNotification] = useState({
    visible: false,
    message: "",
    type: "success",
    duration: 3000,
    icon: null,
    animation: "fade"
  });

  const showConfirmation = (config) => {
    setConfirmationConfig({
      ...confirmationConfig,
      ...config,
    });
    setIsOpen(true);
  };

  // Adding support for enhanced popup notifications
  const showPopup = (config) => {
    if (typeof config === "string") {
      // Support for legacy usage with just a message
      setNotification({
        visible: true,
        message: config,
        type: "success",
        duration: 3000,
        animation: "fade"
      });
    } else {
      // Enhanced configuration object
      setNotification({
        visible: true,
        message: config.message,
        type: config.type || "success",
        duration: config.duration || 3000,
        icon: config.icon,
        animation: config.animation || "fade"
      });
    }
    
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, visible: false }));
    }, notification.duration);
  };

  const handleConfirm = () => {
    confirmationConfig.onConfirm();
    setIsOpen(false);
  };

  const handleCancel = () => {
    confirmationConfig.onCancel();
    setIsOpen(false);
  };

  const closePopup = () => {
    setIsOpen(false);
    setNotification((prev) => ({ ...prev, visible: false }));
  };

  // Animation variants for different entry styles
  const animations = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 }
    },
    "slide-up": {
      initial: { opacity: 0, y: 50 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -50 }
    },
    "slide-down": {
      initial: { opacity: 0, y: -50 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 50 }
    }
  };

  return (
    <PopupContext.Provider
      value={{
        showConfirmation,
        showPopup, // Both methods now available
        closePopup,
      }}
    >
      {children}
      
      {/* Confirmation Dialog */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center overflow-y-auto">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">{confirmationConfig.title}</h2>
            <p className="mb-6">{confirmationConfig.message}</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
              >
                {confirmationConfig.cancelText}
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {confirmationConfig.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Toast Notification */}
      <AnimatePresence>
        {notification.visible && (
          <motion.div 
            className="fixed bottom-5 right-5 z-50"
            {...animations[notification.animation]}
            transition={{ duration: 0.3 }}
          >
            <div className={`rounded-lg shadow-lg p-4 flex items-center space-x-3 ${
              notification.type === 'success' ? 'bg-green-50 border-l-4 border-green-500' :
              notification.type === 'error' ? 'bg-red-50 border-l-4 border-red-500' :
              notification.type === 'info' ? 'bg-blue-50 border-l-4 border-blue-500' :
              'bg-gray-50 border-l-4 border-gray-500'
            }`}>
              {notification.icon ? (
                <div className="flex-shrink-0">
                  {notification.icon}
                </div>
              ) : (
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  notification.type === 'success' ? 'bg-green-100' :
                  notification.type === 'error' ? 'bg-red-100' :
                  'bg-blue-100'
                }`}>
                  {notification.type === 'success' && (
                    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {notification.type === 'error' && (
                    <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  {notification.type === 'info' && (
                    <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
              )}
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  notification.type === 'success' ? 'text-green-800' :
                  notification.type === 'error' ? 'text-red-800' :
                  'text-blue-800'
                }`}>
                  {notification.message}
                </p>
              </div>
              <button 
                onClick={() => setNotification((prev) => ({ ...prev, visible: false }))}
                className="flex-shrink-0 text-gray-400 hover:text-gray-500 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Animated progress bar */}
            <motion.div 
              className={`h-1 rounded-b-lg ${
                notification.type === 'success' ? 'bg-green-500' :
                notification.type === 'error' ? 'bg-red-500' :
                'bg-blue-500'
              }`}
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: notification.duration / 1000, ease: "linear" }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </PopupContext.Provider>
  );
};

export const usePopup = () => {
  const context = useContext(PopupContext);
  if (!context) {
    throw new Error("usePopup must be used within a PopupProvider");
  }
  return context;
};

export default PopupContext;
