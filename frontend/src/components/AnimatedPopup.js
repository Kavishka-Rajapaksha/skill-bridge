import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AnimatedPopup = ({ isOpen, onClose, message, type = 'success', duration = 3000 }) => {
  const [visible, setVisible] = useState(isOpen);
  
  useEffect(() => {
    setVisible(isOpen);
    
    if (isOpen && duration) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) {
          setTimeout(onClose, 300); // Allow animation to complete before calling onClose
        }
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose, duration]);
  
  // Define icon based on type
  const renderIcon = () => {
    if (type === 'success') {
      return (
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    } else if (type === 'error') {
      return (
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      );
    } else if (type === 'info') {
      return (
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
    }
  };
  
  return (
    <AnimatePresence>
      {visible && (
        <motion.div 
          className="fixed z-50 top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-20 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div 
            className="relative bg-white max-w-md w-full mx-4 rounded-xl shadow-2xl p-6 overflow-hidden"
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Progress bar animation */}
            {duration > 0 && (
              <motion.div 
                className={`absolute bottom-0 left-0 h-1 ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`}
                initial={{ width: "100%" }}
                animate={{ width: 0 }}
                transition={{ duration: duration / 1000, ease: "linear" }}
              />
            )}
            
            <div className="flex items-center">
              {renderIcon()}
              <div className="ml-4 flex-1">
                <h3 className={`text-lg font-medium ${
                  type === 'success' ? 'text-green-900' : 
                  type === 'error' ? 'text-red-900' : 
                  'text-blue-900'
                }`}>
                  {type === 'success' ? 'Success!' : type === 'error' ? 'Error!' : 'Information'}
                </h3>
                <p className="mt-1 text-gray-600">{message}</p>
              </div>
              <button 
                onClick={onClose} 
                className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AnimatedPopup;
