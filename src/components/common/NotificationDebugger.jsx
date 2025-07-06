import React, { useState } from 'react';
import { forceShowNotification, checkNotificationPermissions, registerServiceWorker } from '../../utils/notificationUtils';

const NotificationDebugger = () => {
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  
  const hasNotificationApi = 'Notification' in window;
  const currentPermission = hasNotificationApi ? Notification.permission : 'API not available';
  const serviceWorkerAvailable = 'serviceWorker' in navigator;
  
  const requestPermission = async () => {
    setLoading(true);
    setTestResult('Testing permissions...');
    
    try {
      const result = await checkNotificationPermissions();
      console.log('Permission check result:', result);
      
      setTestResult(`Permission: ${result.permission}${result.error ? `, Error: ${result.error}` : ''}`);
      
      // Force refresh the component
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Error requesting permission:', error);
      setTestResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const showTestNotification = async () => {
    setLoading(true);
    setTestResult('Sending test notification...');
    
    try {
      const now = new Date().toLocaleTimeString();
      
      // Try to force a notification
      const result = await forceShowNotification(
        `Direct Test at ${now}`, 
        {
          body: 'This is a direct test using the Notification API',
          icon: '/src/assets/logo.png',
          tag: 'test-notification',
        }
      );
      
      console.log('Force notification result:', result);
      setTestResult(`Success: ${result.success}, Method: ${result.method}${result.error ? `, Error: ${result.error}` : ''}`);
    } catch (error) {
      console.error('Error showing notification:', error);
      setTestResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const setupServiceWorker = async () => {
    setLoading(true);
    setTestResult('Setting up service worker...');
    
    try {
      const result = await registerServiceWorker();
      console.log('Service worker registration:', result);
      
      setTestResult(`Success: ${result.success}${result.error ? `, Error: ${result.error}` : ''}`);
    } catch (error) {
      console.error('Service worker error:', error);
      setTestResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
      <h3 className="text-sm font-medium mb-2">Notification System Diagnostics</h3>
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span>Notification API Available:</span>
          <span className={hasNotificationApi ? 'text-green-500' : 'text-red-500'}>
            {hasNotificationApi ? 'Yes' : 'No'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Current Permission:</span>
          <span className={
            currentPermission === 'granted' ? 'text-green-500' : 
            currentPermission === 'denied' ? 'text-red-500' : 'text-yellow-500'
          }>
            {currentPermission}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Service Worker Support:</span>
          <span className={serviceWorkerAvailable ? 'text-green-500' : 'text-yellow-500'}>
            {serviceWorkerAvailable ? 'Yes' : 'No'}
          </span>
        </div>
        
        {testResult && (
          <div className={`text-xs mt-2 p-2 rounded ${loading ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-100 dark:bg-gray-700'}`}>
            {loading ? 'Working...' : testResult}
          </div>
        )}
        
        <div className="pt-2 flex flex-wrap gap-2">
          <button
            onClick={requestPermission}
            disabled={loading}
            className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded border border-blue-200 dark:border-blue-800 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors duration-200 disabled:opacity-50"
          >
            Request Permission
          </button>
          
          <button
            onClick={showTestNotification}
            disabled={loading || currentPermission !== 'granted'}
            className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded border border-green-200 dark:border-green-800 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors duration-200 disabled:opacity-50"
          >
            Force Notification
          </button>
          
          <button
            onClick={setupServiceWorker}
            disabled={loading || !serviceWorkerAvailable}
            className="px-2 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded border border-purple-200 dark:border-purple-800 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors duration-200 disabled:opacity-50"
          >
            Setup SW
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationDebugger;
