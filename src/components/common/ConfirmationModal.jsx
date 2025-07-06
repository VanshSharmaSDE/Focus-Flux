import React from 'react';
import { XMarkIcon, ExclamationTriangleIcon, CheckCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from './LoadingSpinner';

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Confirm", 
  cancelText = "Cancel", 
  type = "warning", // warning, danger, success, info
  isLoading = false 
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />;
      case 'success':
        return <CheckCircleIcon className="h-6 w-6 text-green-600" />;
      case 'info':
        return <InformationCircleIcon className="h-6 w-6 text-blue-600" />;
      default:
        return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'danger':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          confirmBtn: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
          icon: 'text-red-600'
        };
      case 'success':
        return {
          bg: 'bg-green-50 dark:bg-green-900/20',
          confirmBtn: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
          icon: 'text-green-600'
        };
      case 'info':
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          confirmBtn: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
          icon: 'text-blue-600'
        };
      default:
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          confirmBtn: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
          icon: 'text-yellow-600'
        };
    }
  };

  const colors = getColors();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75" 
          onClick={onClose}
        />
        
        {/* Modal panel */}
        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`flex-shrink-0 ${colors.bg} rounded-full p-2`}>
                {getIcon()}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Message */}
          <div className="mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {message}
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white ${colors.confirmBtn} focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50`}
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="small" />
                  <span className="ml-2">Loading...</span>
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
