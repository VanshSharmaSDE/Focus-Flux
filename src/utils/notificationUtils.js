/**
 * Utility functions for debugging and fixing notification issues
 */

// Force browser notification permissions and check status
export const checkNotificationPermissions = async () => {
  const results = {
    supported: false,
    permission: 'unknown',
    error: null
  };
  
  try {
    // Check if browser supports notifications
    if (!('Notification' in window)) {
      results.error = 'Browser does not support notifications';
      return results;
    }
    
    results.supported = true;
    results.permission = Notification.permission;
    
    // Try to request permission if not granted
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      results.permission = await Notification.requestPermission();
    }
    
    return results;
  } catch (error) {
    results.error = error.message;
    return results;
  }
};

// Show a notification using all possible methods
export const forceShowNotification = async (title, options = {}) => {
  const results = {
    success: false,
    method: null,
    error: null
  };
  
  try {
    // Check if browser supports notifications
    if (!('Notification' in window)) {
      results.error = 'Browser does not support notifications';
      alert(`${title}\n${options.body || ''}`);
      return results;
    }
    
    // Try direct notification first if permission granted
    if (Notification.permission === 'granted') {
      // Prepare absolute URLs for icons
      const iconUrl = options.icon ? new URL(options.icon, window.location.origin).href : undefined;
      
      // Create notification
      const notification = new Notification(title, {
        ...options,
        icon: iconUrl,
        requireInteraction: true,
        tag: options.tag || 'force-notification'
      });
      
      // Add notification handlers
      notification.onclick = () => {
        notification.close();
        window.focus();
        if (options.onClick) options.onClick();
      };
      
      results.success = true;
      results.method = 'direct';
      
      // Also try to play a sound
      try {
        const audio = new Audio();
        audio.volume = 0.2;
        audio.play().catch(e => console.log('Silent sound playback failed:', e));
      } catch (e) {
        console.log('Audio playback failed:', e);
      }
      
      return results;
    }
    
    // If not granted, request permission
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        // Create notification after permission granted
        const notification = new Notification(title, {
          ...options,
          requireInteraction: true
        });
        
        results.success = true;
        results.method = 'request-then-direct';
        return results;
      }
    }
    
    // If all else fails, use alert as fallback
    alert(`${title}\n${options.body || ''}`);
    results.method = 'alert-fallback';
    return results;
    
  } catch (error) {
    results.error = error.message;
    alert(`${title}\n${options.body || ''}`);
    return results;
  }
};

// Register a service worker for notification support
export const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    return { success: false, error: 'Service Worker not supported' };
  }
  
  try {
    const registration = await navigator.serviceWorker.register('/notification-worker.js');
    return { success: true, registration };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export default {
  checkNotificationPermissions,
  forceShowNotification,
  registerServiceWorker
};
