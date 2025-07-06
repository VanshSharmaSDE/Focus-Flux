// notification-worker.js - Service worker for handling notifications
self.addEventListener('install', event => {
  console.log('Notification Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('Notification Service Worker activated');
  return self.clients.claim();
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  // Focus or open window when notification is clicked
  event.waitUntil(
    clients.matchAll({type: 'window'}).then(clientList => {
      // If a window client is available, focus it
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      // Otherwise open a new window
      return clients.openWindow('/');
    })
  );
});

// Listen for push events (for future push notification support)
self.addEventListener('push', event => {
  console.log('Push notification received:', event);
  
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    
    const notificationOptions = {
      body: data.message || 'New notification',
      icon: '/src/assets/logo.png',
      badge: '/src/assets/favicon.ico',
      tag: data.tag || 'default-notification',
      data: data
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'FocusFlux Notification', notificationOptions)
    );
  } catch (error) {
    console.error('Error handling push notification:', error);
  }
});

console.log('Notification Service Worker loaded');
