class NotificationService {
  constructor() {
    this.activeReminders = new Map(); // Store active timeout IDs
    this.permissionRequested = false;
    // Use absolute URLs for icon paths to avoid path resolution issues
    this.iconUrl = new URL('/src/assets/logo.png', window.location.origin).href;
    this.badgeUrl = new URL('/src/assets/favicon.ico', window.location.origin).href;
    
    // Log notification service initialization
    console.log('NotificationService initialized', { 
      notificationsSupported: 'Notification' in window,
      permission: 'Notification' in window ? Notification.permission : 'unsupported',
      iconUrl: this.iconUrl,
      badgeUrl: this.badgeUrl
    });
    
    // Check if service worker is available for better notification support
    this.serviceWorkerAvailable = 'serviceWorker' in navigator;
  }

  // Request notification permission from the browser
  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications');
      return false;
    }
    
    if (Notification.permission === 'granted') {
      return true;
    }
    
    if (Notification.permission !== 'denied') {
      try {
        const permission = await Notification.requestPermission();
        console.log('Notification permission status:', permission);
        return permission === 'granted';
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        return false;
      }
    }
    
    return false;
  }

  // Check if notifications are supported and permitted
  isNotificationSupported() {
    return 'Notification' in window && Notification.permission === 'granted';
  }

  // Show a browser notification
  async showNotification(title, options = {}) {
    console.log('Attempting to show notification:', title, 'Current permission:', Notification.permission);
    
    // First check browser compatibility
    if (!('Notification' in window)) {
      console.error('Browser does not support notifications');
      alert(`${title}\n${options.body || ''}`);
      return null;
    }
    
    // If notifications already granted, show notification
    if (Notification.permission === 'granted') {
      return this._createNotification(title, options);
    } 
    // If not denied, request permission
    else if (Notification.permission !== 'denied') {
      try {
        console.log('Requesting notification permission...');
        const permission = await Notification.requestPermission();
        console.log('Permission request result:', permission);
        
        if (permission === 'granted') {
          return this._createNotification(title, options);
        } else {
          console.log('Notification permission denied, using alert fallback');
          alert(`${title}\n${options.body || ''}`);
          return null;
        }
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        alert(`${title}\n${options.body || ''}`);
        return null;
      }
    } else {
      // Permission previously denied, use alert as fallback
      console.log('Notification permission previously denied, using alert fallback');
      alert(`${title}\n${options.body || ''}`);
      return null;
    }
  }
  
  // Private method to create notification
  _createNotification(title, options = {}) {
    const defaultOptions = {
      icon: this.iconUrl,
      badge: this.badgeUrl,
      tag: 'focusflux-reminder',
      requireInteraction: true,
      ...options
    };

    try {
      console.log('Creating notification with options:', {
        title,
        ...defaultOptions
      });
      
      // Force a silent sound to improve notification visibility on some platforms
      if (new Audio) {
        try {
          const audio = new Audio();
          audio.volume = 0.1;
          audio.play().catch(e => console.log('Silent sound playback failed:', e));
        } catch (e) {
          console.log('Audio creation failed:', e);
        }
      }
      
      const notification = new Notification(title, defaultOptions);
      
      // Log notification creation success
      console.log('Notification created successfully');
      
      // Handle notification events
      notification.onshow = () => console.log('Notification shown to user');
      notification.onclick = options.onClick || (() => {
        console.log('Notification clicked');
        window.focus();
        notification.close();
      });
      notification.onerror = (err) => console.error('Notification error:', err);
      
      // Auto-close after 10 seconds if not interacted with
      setTimeout(() => notification.close(), 10000);
      
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      alert(`${title}\n${options.body || ''}`);
      return null;
    }
  }

  // Schedule a task reminder
  scheduleTaskReminder(taskId, taskTitle, reminderTime, options = {}) {
    // Clear existing reminder for this task
    this.clearTaskReminder(taskId);

    const now = new Date().getTime();
    const reminderDate = new Date(reminderTime);
    const reminderTimestamp = reminderDate.getTime();
    const delay = reminderTimestamp - now;
    
    console.log(`Setting reminder for "${taskTitle}" at ${reminderDate.toLocaleTimeString()}`);
    
    // For immediate testing - if time is very close (within 30 seconds)
    if (delay > 0 && delay < 30000) {
      console.warn(`⚠️ IMMEDIATE REMINDER: "${taskTitle}" will show in ${Math.round(delay/1000)} seconds`);
    }
    // If time is already passed but within 2 minutes, show immediately for testing
    else if (delay <= 0 && delay > -120000) {
      console.log(`Time already passed, showing immediate test notification`);
      
      setTimeout(() => {
        if (Notification.permission === 'granted') {
          new Notification('🔔 Task Reminder', {
            body: `${taskTitle} (scheduled for ${reminderDate.toLocaleTimeString()})`,
            icon: '/src/assets/logo.png'
          });
        } else {
          alert(`Task Reminder: ${taskTitle}`);
        }
      }, 2000);
      return true;
    }
    // If time is too far in the past
    else if (delay <= 0) {
      console.warn(`Reminder time is in the past: ${reminderDate.toLocaleTimeString()}`);
      return false;
    }

    // Schedule the actual reminder
    const timeoutId = setTimeout(() => {
      console.log(`🔔 REMINDER TIME REACHED for "${taskTitle}"`);
      
      // Simple direct notification approach
      if (Notification.permission === 'granted') {
        const notification = new Notification('🔔 Task Reminder', {
          body: `Don't forget: ${taskTitle}`,
          icon: '/src/assets/logo.png',
          tag: `task-reminder-${Date.now()}`
        });
        
        notification.onclick = () => {
          window.focus();
          notification.close();
          if (options.onClick) options.onClick();
        };
      } else if (Notification.permission !== 'denied') {
        // Try to request permission at the time of the reminder
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('🔔 Task Reminder', {
              body: `Don't forget: ${taskTitle}`,
              icon: '/src/assets/logo.png'
            });
          } else {
            alert(`Task Reminder: ${taskTitle}`);
          }
        });
      } else {
        // Fallback to alert
        alert(`Task Reminder: ${taskTitle}`);
      }
      
      this.activeReminders.delete(taskId);
    }, delay);

    this.activeReminders.set(taskId, timeoutId);
    return true;
  }

  // Show task reminder notification
  showTaskReminder(taskTitle, options = {}) {
    console.log(`Showing task reminder for: ${taskTitle}`);
    
    if (Notification.permission === 'granted') {
      const notification = new Notification('🔔 Task Reminder - FocusFlux', {
        body: `Don't forget: ${taskTitle}`,
        icon: '/src/assets/logo.png',
        tag: `task-reminder-${Date.now()}`,
        requireInteraction: true
      });
      
      // Handle notification clicks
      notification.onclick = () => {
        window.focus();
        notification.close();
        if (options.onClick) {
          options.onClick();
        }
      };
      
      return notification;
    } 
    else if (Notification.permission !== 'denied') {
      // Try to request permission right when we need to show the notification
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          const notification = new Notification('🔔 Task Reminder - FocusFlux', {
            body: `Don't forget: ${taskTitle}`,
            icon: '/src/assets/logo.png'
          });
          
          notification.onclick = () => {
            window.focus();
            notification.close();
            if (options.onClick) {
              options.onClick();
            }
          };
          
          return notification;
        } else {
          alert(`Task Reminder: ${taskTitle}`);
          return null;
        }
      });
    } 
    else {
      // Fallback to alert if notifications are denied
      alert(`Task Reminder: ${taskTitle}`);
      return null;
    }
  }

  // Clear a specific task reminder - supports both old and new naming
  clearTaskReminder(taskId) {
    return this.clearReminder(taskId);
  }
  
  // Clear a reminder (unified method)
  clearReminder(taskId) {
    if (this.activeReminders.has(taskId)) {
      clearTimeout(this.activeReminders.get(taskId));
      this.activeReminders.delete(taskId);
      console.log(`Cleared reminder for task: ${taskId}`);
      return true;
    }
    return false;
  }

  // Clear all active reminders
  clearAllReminders() {
    this.activeReminders.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    this.activeReminders.clear();
    console.log('Cleared all active reminders');
  }

  // Get active reminders count
  getActiveRemindersCount() {
    return this.activeReminders.size;
  }

  // Schedule multiple reminders (for daily tasks, etc.)
  scheduleMultipleReminders(tasks, reminderMinutesBefore = 30) {
    let scheduled = 0;
    
    tasks.forEach(task => {
      if (task.dueTime && !task.completed) {
        const dueTime = new Date(task.dueTime);
        const reminderTime = new Date(dueTime.getTime() - (reminderMinutesBefore * 60 * 1000));
        
        if (this.scheduleTaskReminder(task.id, task.title, reminderTime, {
          taskId: task.id,
          type: task.type || 'task',
          onClick: () => {
            // Navigate to the task or show task details
            console.log(`Clicked on reminder for task: ${task.title}`);
          }
        })) {
          scheduled++;
        }
      }
    });

    console.log(`Scheduled ${scheduled} task reminders`);
    return scheduled;
  }

  // Parse reminder time from various formats
  parseReminderTime(input, taskDueTime = null) {
    const now = new Date();
    
    // If input is already a Date object or timestamp
    if (input instanceof Date) {
      return input;
    }
    
    if (typeof input === 'number') {
      return new Date(input);
    }

    // If input is a time string like "14:30" or "2:30 PM"
    if (typeof input === 'string') {
      // Try to parse as time today
      const timeRegex = /^(\d{1,2}):(\d{2})(\s*(AM|PM))?$/i;
      const match = input.match(timeRegex);
      
      if (match) {
        let hours = parseInt(match[1]);
        const minutes = parseInt(match[2]);
        const ampm = match[4];
        
        if (ampm) {
          if (ampm.toUpperCase() === 'PM' && hours !== 12) {
            hours += 12;
          } else if (ampm.toUpperCase() === 'AM' && hours === 12) {
            hours = 0;
          }
        }
        
        const reminderTime = new Date();
        reminderTime.setHours(hours, minutes, 0, 0);
        
        // If the time has passed today, schedule for tomorrow
        if (reminderTime.getTime() <= now.getTime()) {
          reminderTime.setDate(reminderTime.getDate() + 1);
        }
        
        return reminderTime;
      }
      
      // Try to parse as full date string
      const parsed = new Date(input);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    // If we have a task due time, default to 30 minutes before
    if (taskDueTime) {
      const dueTime = new Date(taskDueTime);
      return new Date(dueTime.getTime() - (30 * 60 * 1000));
    }

    return null;
  }

  // Test notification (for settings page)
  async testNotification() {
    console.log('Testing notification system using testNotification()');
    // Use the enhanced showNotification method that has proper error handling
    const notification = await this.showNotification('🔔 Test Notification', {
      body: 'Task reminders are working! You\'ll get notifications like this for your tasks.',
      requireInteraction: true,
      timestamp: Date.now()
    });
    
    return !!notification; // Return true if notification was created, false otherwise
  }

  // Show an immediate test notification with current time
  async showImmediateTestNotification() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    
    console.log('Testing notification system with immediate notification at', timeString);
    
    try {
      // Import utility for forcing notifications
      const { forceShowNotification } = await import('../utils/notificationUtils');
      
      // Try the force approach first
      console.log('Using force notification approach');
      const result = await forceShowNotification('🔔 Test Notification', {
        body: `This is a test notification sent at ${timeString}. If you see this, notifications are working!`,
        timestamp: Date.now(),
        requireInteraction: true,
        icon: this.iconUrl
      });
      
      console.log('Force notification result:', result);
      
      if (result.success) {
        return true;
      }
      
      // If force didn't work, try our standard approach
      console.log('Force notification failed, trying standard approach');
      const notification = await this.showNotification('🔔 Test Notification', {
        body: `This is a test notification sent at ${timeString}. If you see this, notifications are working!`,
        timestamp: Date.now(),
        requireInteraction: true
      });
      
      return !!notification;
    } catch (error) {
      console.error('Error showing test notification:', error);
      
      // Last resort: try direct Notification API
      try {
        if (Notification.permission === 'granted') {
          new Notification('🔔 Emergency Test Notification', {
            body: `This is a direct test notification at ${timeString}.`,
            icon: this.iconUrl
          });
          return true;
        }
      } catch (innerError) {
        console.error('Direct notification failed:', innerError);
      }
      
      alert(`Test Notification\nTime: ${timeString}\nError: ${error.message}`);
      return false;
    }
  }

  // Schedule a reminder with robust error handling and detailed logging
  async scheduleReminder(taskId, taskTitle, taskDueTime, options = {}) {
    // Don't schedule if notifications are not supported
    if (!('Notification' in window)) {
      console.log('Notifications not supported in this browser');
      return null;
    }
    
    // Clear any existing reminder for this task
    this.clearReminder(taskId);
    
    // Validate due time exists
    if (!taskDueTime) {
      console.log('No due time provided for task', taskId);
      return null;
    }
    
    try {
      // Calculate reminder time (30 minutes before due)
      const dueDateTime = new Date(taskDueTime);
      const reminderDateTime = new Date(dueDateTime.getTime() - (30 * 60 * 1000));
      
      // Don't schedule if reminder time is in the past
      const now = new Date();
      if (reminderDateTime < now) {
        console.log('Reminder time is in the past for task', taskId);
        return null;
      }
      
      // Log the scheduling attempt
      console.log(`Scheduling reminder for task ${taskId}:`, {
        taskTitle,
        dueTime: dueDateTime.toLocaleString(),
        reminderTime: reminderDateTime.toLocaleString(),
        delay: reminderDateTime.getTime() - now.getTime()
      });
      
      // Check current notification permission
      if (Notification.permission !== 'granted') {
        console.log('Notification permission not granted, reminder will not be scheduled');
        return null;
      }

      // Schedule the reminder
      const timeoutId = setTimeout(() => {
        // When timeout fires, make sure the reminder is still needed 
        // (task might have been completed or deleted)
        this.showNotification(
          `🔔 Reminder: ${taskTitle}`, 
          {
            body: `Due in 30 minutes at ${dueDateTime.toLocaleTimeString()}`,
            tag: `reminder-${taskId}`,
            data: { taskId, type: 'reminder' },
            ...options
          }
        );
        
        // Remove from active reminders after showing
        this.activeReminders.delete(taskId);
        
      }, reminderDateTime.getTime() - now.getTime());
      
      // Store the timeout ID for later cancellation if needed
      this.activeReminders.set(taskId, timeoutId);
      
      return timeoutId;
    } catch (error) {
      console.error('Error scheduling reminder:', error);
      return null;
    }
  }
}

// Create and export singleton instance
const notificationService = new NotificationService();
export default notificationService;
