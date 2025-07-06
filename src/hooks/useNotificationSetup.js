import { useEffect } from 'react';
import notificationService from '../services/notifications';

/**
 * Hook to initialize notification service and request permissions early
 */
export const useNotificationSetup = () => {
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        // Check if browser supports notifications
        if (!('Notification' in window)) {
          console.log('This browser does not support desktop notifications');
          return;
        }

        console.log('Initializing notification service, current permission:', Notification.permission);

        // If permission is already granted, we're good
        if (Notification.permission === 'granted') {
          console.log('Notification permission already granted');
          return;
        }
        
        // If permission is not denied, we'll request it when user interacts
        if (Notification.permission !== 'denied') {
          // Add event listener to ask for permissions on first user interaction
          const requestOnInteraction = () => {
            console.log('User interacted with the page, requesting notification permissions');
            Notification.requestPermission().then(permission => {
              console.log('Notification permission response:', permission);
              
              // Remove event listeners once we've requested permission
              document.removeEventListener('click', requestOnInteraction);
              document.removeEventListener('keydown', requestOnInteraction);
            });
          };
          
          // Request permission on user interaction to increase chance of approval
          document.addEventListener('click', requestOnInteraction, { once: true });
          document.addEventListener('keydown', requestOnInteraction, { once: true });
        }
      } catch (error) {
        console.error('Error initializing notifications:', error);
      }
    };

    initializeNotifications();
  }, []);
};
