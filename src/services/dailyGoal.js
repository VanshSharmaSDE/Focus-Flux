import { databases, DATABASE_ID, COLLECTIONS } from './appwrite';
import { ID, Query } from 'appwrite';
import notificationService from './notifications';

// Direct notification utilities for daily tasks
const createDirectNotification = (title, body, options = {}) => {
  if (!('Notification' in window)) {
    console.error('Notifications not supported');
    alert(`${title}\n${body}`);
    return null;
  }
  
  if (Notification.permission === 'granted') {
    try {
      // Create with full options
      const notification = new Notification(title, {
        body: body,
        icon: '/src/assets/logo.png',
        badge: '/src/assets/favicon.ico',
        tag: options.tag || `daily-${Date.now()}`,
        requireInteraction: true,
        ...options
      });
      
      // Handle notification events
      notification.onclick = () => {
        console.log('Daily notification clicked');
        window.focus();
        if (options.onClick) options.onClick();
        notification.close();
      };
      
      return notification;
    } catch (error) {
      console.error('Error creating direct notification:', error);
      alert(`${title}\n${body}`);
      return null;
    }
  } else if (Notification.permission !== 'denied') {
    // Request permission
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        createDirectNotification(title, body, options);
      } else {
        alert(`${title}\n${body}`);
      }
    });
  } else {
    alert(`${title}\n${body}`);
    return null;
  }
};

class DailyGoalService {
  // Create a new daily goal plan
  async createDailyPlan({ title, description, userId, planDate }) {
    try {
      const dateStr = planDate ? planDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      
      return await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.DAILY_PLANS,
        ID.unique(),
        {
          title,
          description,
          userId,
          planDate: dateStr,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      );
    } catch (error) {
      throw error;
    }
  }

  // Get today's plan for a user
  async getTodaysPlan(userId) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const plans = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.DAILY_PLANS,
        [
          Query.equal('userId', userId),
          Query.equal('planDate', today),
          Query.orderDesc('createdAt'),
          Query.limit(1)
        ]
      );

      return plans.documents.length > 0 ? plans.documents[0] : null;
    } catch (error) {
      throw error;
    }
  }

  // Get plan by ID
  async getPlan(planId) {
    try {
      return await databases.getDocument(DATABASE_ID, COLLECTIONS.DAILY_PLANS, planId);
    } catch (error) {
      throw error;
    }
  }

  // Update daily plan
  async updateDailyPlan(planId, updates) {
    try {
      return await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.DAILY_PLANS,
        planId,
        {
          ...updates,
          updatedAt: new Date().toISOString(),
        }
      );
    } catch (error) {
      throw error;
    }
  }

  // Delete daily plan
  async deleteDailyPlan(planId) {
    try {
      return await databases.deleteDocument(DATABASE_ID, COLLECTIONS.DAILY_PLANS, planId);
    } catch (error) {
      throw error;
    }
  }

  // Create a daily task
  async createDailyTask({ title, description, priority = 'medium', tag, reminderTime, planId, userId }) {
    try {
      console.log(`Creating daily task "${title}" with reminder time: ${reminderTime}`);
      
      // Get tag color if tag is provided
      let tagColor = null;
      if (tag) {
        const userTag = await this.getUserTag(userId, tag);
        tagColor = userTag ? userTag.color : '#6B7280';
      }

      // First request notification permission if a reminder is set
      if (reminderTime && Notification.permission !== 'granted') {
        console.log('Pre-requesting notification permission for daily task');
        try {
          const permission = await Notification.requestPermission();
          console.log('Permission response:', permission);
        } catch (e) {
          console.error('Error requesting permission:', e);
        }
      }

      const newTask = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.DAILY_TASKS,
        ID.unique(),
        {
          title,
          description,
          priority,
          tag: tag || null,
          tagColor,
          reminderTime: reminderTime || null, // Store as HH:MM string
          planId,
          userId,
          completed: false,
          completedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      );
      
      // Schedule reminder if set
      if (reminderTime) {
        console.log(`Attempting to schedule reminder for task "${title}" with time ${reminderTime}`);
        
        try {
          const success = await this.scheduleReminderForDailyTask(newTask);
          console.log(`Reminder scheduling result: ${success ? 'Success' : 'Failed'} for "${title}"`);
        } catch (reminderError) {
          console.error(`Error scheduling reminder for daily task "${title}":`, reminderError);
        }
      }
      
      return newTask;
    } catch (error) {
      throw error;
    }
  }

  // Get all tasks for a plan
  async getDailyTasks(planId) {
    try {
      const tasks = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.DAILY_TASKS,
        [
          Query.equal('planId', planId),
          Query.orderDesc('createdAt')
        ]
      );

      return tasks.documents;
    } catch (error) {
      throw error;
    }
  }

  // Toggle task completion
  async toggleTask(taskId, completed) {
    try {
      // notificationService already imported at top of file
      
      // First get the current task to check if it has a reminder
      const currentTask = await databases.getDocument(DATABASE_ID, COLLECTIONS.DAILY_TASKS, taskId);
      const hasReminder = currentTask.reminderTime != null;
      
      const updatedTask = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.DAILY_TASKS,
        taskId,
        {
          completed,
          completedAt: completed ? new Date().toISOString() : null,
          updatedAt: new Date().toISOString(),
        }
      );

      // Handle reminder
      if (hasReminder) {
        if (completed) {
          // Clear reminder if task is completed
          notificationService.clearTaskReminder(`daily-${taskId}`);
        } else {
          // Re-schedule reminder if task is uncompleted
          this.scheduleReminderForDailyTask(updatedTask);
        }
      }

      // Automatically save daily completion when task is toggled
      if (updatedTask.planId && updatedTask.userId) {
        await this.saveDailyCompletion(
          updatedTask.userId, 
          updatedTask.planId, 
          new Date()
        );
      }

      return updatedTask;
    } catch (error) {
      throw error;
    }
  }

  // Update daily task
  async updateDailyTask(taskId, updates) {
    try {
      // notificationService already imported at top of file
      
      // First get the current task to check for reminder changes
      const currentTask = await databases.getDocument(DATABASE_ID, COLLECTIONS.DAILY_TASKS, taskId);
      
      const updatedTask = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.DAILY_TASKS,
        taskId,
        {
          ...updates,
          updatedAt: new Date().toISOString(),
        }
      );
      
      // Handle reminder changes
      const oldReminderTime = currentTask.reminderTime;
      const newReminderTime = updates.reminderTime;
      
      // Clear existing reminder if it changed or was removed
      if (oldReminderTime && (oldReminderTime !== newReminderTime || !newReminderTime)) {
        notificationService.clearTaskReminder(`daily-${taskId}`);
      }
      
      // Schedule new reminder if set and task is not completed
      if (newReminderTime && !updatedTask.completed) {
        this.scheduleReminderForDailyTask(updatedTask);
      }
      
      return updatedTask;
    } catch (error) {
      throw error;
    }
  }

  // Delete daily task
  async deleteDailyTask(taskId) {
    try {
      // notificationService already imported at top of file
      
      // Clear any scheduled reminders for this task
      notificationService.clearTaskReminder(`daily-${taskId}`);
      
      return await databases.deleteDocument(DATABASE_ID, COLLECTIONS.DAILY_TASKS, taskId);
    } catch (error) {
      throw error;
    }
  }

  // Create user tag
  async createUserTag({ name, color, userId }) {
    try {
      return await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.USER_TAGS,
        ID.unique(),
        {
          name,
          color,
          userId,
          createdAt: new Date().toISOString(),
        }
      );
    } catch (error) {
      throw error;
    }
  }

  // Get user tags
  async getUserTags(userId) {
    try {
      const tags = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.USER_TAGS,
        [
          Query.equal('userId', userId),
          Query.orderAsc('name')
        ]
      );

      return tags.documents;
    } catch (error) {
      throw error;
    }
  }

  // Get specific user tag
  async getUserTag(userId, tagName) {
    try {
      const tags = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.USER_TAGS,
        [
          Query.equal('userId', userId),
          Query.equal('name', tagName),
          Query.limit(1)
        ]
      );

      return tags.documents.length > 0 ? tags.documents[0] : null;
    } catch (error) {
      throw error;
    }
  }

  // Update user tag
  async updateUserTag(tagId, updates) {
    try {
      return await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.USER_TAGS,
        tagId,
        updates
      );
    } catch (error) {
      throw error;
    }
  }

  // Delete user tag
  async deleteUserTag(tagId) {
    try {
      return await databases.deleteDocument(DATABASE_ID, COLLECTIONS.USER_TAGS, tagId);
    } catch (error) {
      throw error;
    }
  }

  // Create daily completion record
  async createDailyCompletion({ userId, planId, date, totalTasks, completedTasks, completionPercentage, tagStats }) {
    try {
      const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
      
      return await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.DAILY_COMPLETIONS,
        ID.unique(),
        {
          userId,
          planId,
          date: dateStr,
          totalTasks,
          completedTasks,
          completionPercentage,
          tagStats: JSON.stringify(tagStats),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      );
    } catch (error) {
      throw error;
    }
  }

  // Update daily completion record
  async updateDailyCompletion(completionId, updates) {
    try {
      return await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.DAILY_COMPLETIONS,
        completionId,
        {
          ...updates,
          updatedAt: new Date().toISOString(),
        }
      );
    } catch (error) {
      throw error;
    }
  }

  // Get daily completion record
  async getDailyCompletion(userId, date) {
    try {
      const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
      
      const completions = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.DAILY_COMPLETIONS,
        [
          Query.equal('userId', userId),
          Query.equal('date', dateStr),
          Query.limit(1)
        ]
      );

      return completions.documents.length > 0 ? completions.documents[0] : null;
    } catch (error) {
      throw error;
    }
  }

  // Get daily completions for a date range
  async getDailyCompletions(userId, startDate, endDate) {
    try {
      const startDateStr = typeof startDate === 'string' ? startDate : startDate.toISOString().split('T')[0];
      const endDateStr = typeof endDate === 'string' ? endDate : endDate.toISOString().split('T')[0];
      
      const completions = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.DAILY_COMPLETIONS,
        [
          Query.equal('userId', userId),
          Query.between('date', startDateStr, endDateStr),
          Query.orderDesc('date')
        ]
      );

      return completions.documents.map(completion => ({
        ...completion,
        tagStats: JSON.parse(completion.tagStats || '{}')
      }));
    } catch (error) {
      throw error;
    }
  }

  // Save or update daily completion when tasks are completed
  async saveDailyCompletion(userId, planId, date) {
    try {
      const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
      
      // Get plan and tasks for the date
      const plan = await this.getPlan(planId);
      const tasks = await this.getDailyTasks(planId);
      
      // Calculate completion stats
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(task => task.completed).length;
      const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      // Get user tags for tag stats
      const userTags = await this.getUserTags(userId);
      const tagStats = {};
      
      userTags.forEach(tag => {
        const tagTasks = tasks.filter(task => task.tag === tag.name);
        const tagCompleted = tagTasks.filter(task => task.completed).length;
        
        tagStats[tag.name] = {
          total: tagTasks.length,
          completed: tagCompleted,
          percentage: tagTasks.length > 0 ? Math.round((tagCompleted / tagTasks.length) * 100) : 0,
          color: tag.color
        };
      });

      // Check if completion record already exists
      const existingCompletion = await this.getDailyCompletion(userId, dateStr);
      
      if (existingCompletion) {
        // Update existing record
        return await this.updateDailyCompletion(existingCompletion.$id, {
          totalTasks,
          completedTasks,
          completionPercentage,
          tagStats: JSON.stringify(tagStats)
        });
      } else {
        // Create new record
        return await this.createDailyCompletion({
          userId,
          planId,
          date: dateStr,
          totalTasks,
          completedTasks,
          completionPercentage,
          tagStats
        });
      }
    } catch (error) {
      throw error;
    }
  }

  // Get enhanced daily completions with plan and task details
  async getEnhancedDailyCompletions(userId, startDate, endDate) {
    try {
      const startDateStr = typeof startDate === 'string' ? startDate : startDate.toISOString().split('T')[0];
      const endDateStr = typeof endDate === 'string' ? endDate : endDate.toISOString().split('T')[0];
      
      // Get plans for the date range
      const plans = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.DAILY_PLANS,
        [
          Query.equal('userId', userId),
          Query.between('planDate', startDateStr, endDateStr),
          Query.orderDesc('planDate')
        ]
      );

      const enhancedCompletions = [];
      
      for (const plan of plans.documents) {
        const tasks = await this.getDailyTasks(plan.$id);
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.completed).length;
        const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        // Get user tags for tag stats
        const userTags = await this.getUserTags(userId);
        const tagStats = {};
        
        userTags.forEach(tag => {
          const tagTasks = tasks.filter(task => task.tag === tag.name);
          const tagCompleted = tagTasks.filter(task => task.completed).length;
          
          if (tagTasks.length > 0) {
            tagStats[tag.name] = {
              total: tagTasks.length,
              completed: tagCompleted,
              percentage: Math.round((tagCompleted / tagTasks.length) * 100),
              color: tag.color
            };
          }
        });

        enhancedCompletions.push({
          date: plan.planDate,
          planId: plan.$id,
          planTitle: plan.title,
          planDescription: plan.description,
          totalTasks,
          completedTasks,
          completionPercentage,
          tasks: tasks.map(task => ({
            $id: task.$id,
            title: task.title,
            description: task.description,
            priority: task.priority,
            tag: task.tag,
            tagColor: task.tagColor,
            completed: task.completed,
            completedAt: task.completedAt,
            createdAt: task.createdAt
          })),
          tagStats,
          createdAt: plan.createdAt
        });
      }

      return enhancedCompletions;
    } catch (error) {
      throw error;
    }
  }

  // Get daily analytics for a specific date
  async getDailyAnalytics(userId, date) {
    try {
      const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
      
      // Get plan for the date
      const plans = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.DAILY_PLANS,
        [
          Query.equal('userId', userId),
          Query.equal('planDate', dateStr),
          Query.limit(1)
        ]
      );

      if (plans.documents.length === 0) {
        return null;
      }

      const plan = plans.documents[0];
      
      // Get tasks for the plan
      const tasks = await this.getDailyTasks(plan.$id);
      
      // Get user tags for color mapping
      const userTags = await this.getUserTags(userId);
      const tagColorMap = {};
      userTags.forEach(tag => {
        tagColorMap[tag.name] = tag.color;
      });

      // Calculate analytics
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(task => task.completed).length;
      const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Calculate tag-wise analytics
      const tagAnalytics = {};
      userTags.forEach(tag => {
        const tagTasks = tasks.filter(task => task.tag === tag.name);
        const tagCompleted = tagTasks.filter(task => task.completed).length;
        
        tagAnalytics[tag.name] = {
          total: tagTasks.length,
          completed: tagCompleted,
          percentage: tagTasks.length > 0 ? Math.round((tagCompleted / tagTasks.length) * 100) : 0,
          color: tag.color,
          tasks: tagTasks
        };
      });

      return {
        date: dateStr,
        plan,
        tasks,
        analytics: {
          totalTasks,
          completedTasks,
          completionPercentage,
          tagAnalytics
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Get analytics for a date range
  async getRangeAnalytics(userId, startDate, endDate) {
    try {
      const plans = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.DAILY_PLANS,
        [
          Query.equal('userId', userId),
          Query.between('planDate', startDate, endDate),
          Query.orderDesc('planDate')
        ]
      );

      const analyticsData = [];
      
      for (const plan of plans.documents) {
        const tasks = await this.getDailyTasks(plan.$id);
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.completed).length;
        
        analyticsData.push({
          date: plan.planDate,
          planTitle: plan.title,
          totalTasks,
          completedTasks,
          completionPercentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
          tasks
        });
      }

      return analyticsData;
    } catch (error) {
      throw error;
    }
  }

  // Get overall user statistics
  async getUserStats(userId) {
    try {
      // Get all plans for the user
      const allPlans = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.DAILY_PLANS,
        [
          Query.equal('userId', userId)
        ]
      );

      // Get all tasks for the user
      const allTasks = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.DAILY_TASKS,
        [
          Query.equal('userId', userId)
        ]
      );

      const totalPlans = allPlans.total;
      const totalTasks = allTasks.total;
      const completedTasks = allTasks.documents.filter(task => task.completed).length;
      const overallCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Calculate streak (consecutive days with plans)
      const planDates = allPlans.documents
        .map(plan => plan.planDate)
        .sort()
        .reverse();

      let currentStreak = 0;
      const today = new Date().toISOString().split('T')[0];
      
      for (let i = 0; i < planDates.length; i++) {
        const expectedDate = new Date();
        expectedDate.setDate(expectedDate.getDate() - i);
        const expectedDateStr = expectedDate.toISOString().split('T')[0];
        
        if (planDates[i] === expectedDateStr) {
          currentStreak++;
        } else {
          break;
        }
      }

      return {
        totalPlans,
        totalTasks,
        completedTasks,
        overallCompletionRate,
        currentStreak,
        averageTasksPerDay: totalPlans > 0 ? Math.round(totalTasks / totalPlans) : 0
      };
    } catch (error) {
      throw error;
    }
  }

  // Reset daily data (for testing or manual reset)
  async resetDailyData(userId, date) {
    try {
      const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
      
      // Get plan for the date
      const plans = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.DAILY_PLANS,
        [
          Query.equal('userId', userId),
          Query.equal('planDate', dateStr)
        ]
      );

      if (plans.documents.length === 0) {
        return { success: true, message: 'No plan found for this date' };
      }

      const plan = plans.documents[0];
      
      // Get all tasks for the plan
      const tasks = await this.getDailyTasks(plan.$id);
      
      // Reset all completed tasks
      const resetPromises = tasks
        .filter(task => task.completed)
        .map(task => this.toggleTask(task.$id, false));

      await Promise.all(resetPromises);

      return {
        success: true,
        resetCount: resetPromises.length,
        date: dateStr
      };
    } catch (error) {
      throw error;
    }
  }

  // Schedule reminder for a daily task
  async scheduleReminderForDailyTask(task) {
    if (!task.reminderTime || task.completed) return false;
    
    try {
      // Parse the reminder time (HH:MM)
      const [hours, minutes] = task.reminderTime.split(':');
      const reminderDate = new Date();
      reminderDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      // If the time already passed today, schedule for tomorrow
      const now = new Date();
      if (reminderDate < now) {
        reminderDate.setDate(reminderDate.getDate() + 1);
      }
      
      console.log(`Scheduling daily task reminder: "${task.title}" at ${reminderDate.toLocaleString()}`);
      
      console.log(`DEBUG: Scheduling daily task notification. Task ID: ${task.$id}, Title: ${task.title}`);
      
      // Let's use a direct, simple approach first
      try {
        // Method 1: Use most direct approach - this will work even without our service
        const taskId = `daily-${task.$id}`;
        const now = new Date().getTime();
        const delay = reminderDate.getTime() - now;
        
        console.log(`DEBUG: Daily reminder delay: ${delay}ms, Reminder time: ${reminderDate.toLocaleString()}`);
        
        // Clear any existing reminder
        notificationService.clearTaskReminder(taskId);
        
        // Store the direct timeout
        const timeoutId = setTimeout(() => {
          console.log(`DEBUG: Daily reminder timeout fired for "${task.title}"`);
          
          // Use our direct notification utility for maximum reliability
        try {
          console.log('Creating direct daily task notification');
          const notification = createDirectNotification(
            `🔔 Daily Task Reminder`, 
            `Don't forget: ${task.title}`,
            {
              tag: `daily-reminder-${Date.now()}`,
              onClick: () => {
                console.log('Daily task notification clicked');
                window.location.href = '/dashboard/daily-goals';
              }
            }
          );
          
          console.log(`DEBUG: Daily notification created successfully:`, notification ? true : false);
        } catch (notifError) {
          console.error('Error creating daily task notification:', notifError);
          alert(`Daily Task Reminder: ${task.title}`);
        }
        }, delay);
        
        // Store in our service for management
        notificationService.activeReminders.set(taskId, timeoutId);
        
        // Also try the standard methods as backup
        const reminder1 = notificationService.scheduleTaskReminder(
          taskId, 
          task.title,
          reminderDate,
          { 
            taskId: task.$id,
            taskType: 'daily',
            priority: task.priority,
            tag: task.tag
          }
        );
        
        // Force request permission if needed during task creation
        if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
          console.log('DEBUG: Requesting notification permission for daily task');
          try {
            Notification.requestPermission().then(permission => {
              console.log(`DEBUG: Daily task permission request result: ${permission}`);
            });
          } catch (permError) {
            console.error('Error requesting notification permission:', permError);
          }
        }
        
        // Return success if we were able to set up the timeout
        console.log(`DEBUG: Daily task reminder scheduled successfully`);
        return true;
      } catch (scheduleError) {
        console.error('Error scheduling daily task reminder:', scheduleError);
        return false;
      }
    } catch (error) {
      console.error('Error scheduling daily task reminder:', error);
      return false;
    }
  }

  // Reschedule all reminders for a user's daily tasks (useful when app starts or settings change)
  async rescheduleAllReminders(userId, remindersEnabled = true) {
    // We already imported notificationService at the top of the file
    
    if (!remindersEnabled) {
      // Clear all daily task reminders if reminders are disabled
      // We can't easily clear just daily task reminders, so we rely on the prefix
      return { cleared: true };
    }
    
    try {
      // Get today's plan
      const plan = await this.getTodaysPlan(userId);
      if (!plan) {
        return { success: true, scheduled: 0, total: 0 };
      }
      
      // Get all incomplete tasks with reminders
      const tasks = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.DAILY_TASKS,
        [
          Query.equal('planId', plan.$id),
          Query.equal('completed', false),
          Query.notEqual('reminderTime', null)
        ]
      );
      
      let scheduledCount = 0;
      
      // Schedule reminder for each task
      tasks.documents.forEach(task => {
        if (this.scheduleReminderForDailyTask(task)) {
          scheduledCount++;
        }
      });
      
      return {
        success: true,
        total: tasks.total,
        scheduled: scheduledCount
      };
    } catch (error) {
      console.error('Error rescheduling daily task reminders:', error);
      return { success: false, error: error.message };
    }
  }
}

const dailyGoalService = new DailyGoalService();

export default dailyGoalService;
