import { databases, DATABASE_ID, COLLECTIONS } from './appwrite';
import { ID, Query } from 'appwrite';
import notificationService from './notifications';

class TodoService {
  // Create new todo
  async createTodo({ title, description, priority = 'medium', dueDate, reminderTime, userId }) {
    try {
      const todoData = {
        title,
        description,
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        reminderTime, // Store as HH:MM string
        completed: false,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const newTodo = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.TODOS,
        ID.unique(),
        todoData
      );
      
      // Schedule reminder if set
      if (reminderTime) {
        this.scheduleReminderForTodo(newTodo);
      }
      
      return newTodo;
    } catch (error) {
      throw error;
    }
  }

  // Get all todos for a user
  async getTodos(userId, filters = {}) {
    try {
      const queries = [Query.equal('userId', userId)];
      
      // Add filters
      if (filters.completed !== undefined) {
        queries.push(Query.equal('completed', filters.completed));
      }
      
      if (filters.priority) {
        queries.push(Query.equal('priority', filters.priority));
      }
      
      if (filters.startDate && filters.endDate) {
        queries.push(Query.between('createdAt', filters.startDate, filters.endDate));
      }

      // Sort by creation date (newest first)
      queries.push(Query.orderDesc('createdAt'));

      return await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.TODOS,
        queries
      );
    } catch (error) {
      throw error;
    }
  }

  // Get single todo
  async getTodo(todoId) {
    try {
      return await databases.getDocument(DATABASE_ID, COLLECTIONS.TODOS, todoId);
    } catch (error) {
      throw error;
    }
  }

  // Update todo
  async updateTodo(todoId, updates) {
    try {
      // First, get the current todo to check for reminder changes
      const currentTodo = await this.getTodo(todoId);
      
      const updatedTodo = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.TODOS,
        todoId,
        {
          ...updates,
          updatedAt: new Date().toISOString(),
        }
      );
      
      // Handle reminder changes
      const oldReminderTime = currentTodo.reminderTime;
      const newReminderTime = updates.reminderTime;
      
      // Clear existing reminder if it changed or was removed
      if (oldReminderTime && (oldReminderTime !== newReminderTime || !newReminderTime)) {
        notificationService.clearTaskReminder(todoId);
      }
      
      // Schedule new reminder if set and todo is not completed
      if (newReminderTime && !updatedTodo.completed) {
        this.scheduleReminderForTodo(updatedTodo);
      }
      
      return updatedTodo;
    } catch (error) {
      throw error;
    }
  }

  // Toggle todo completion
  async toggleTodo(todoId, completed) {
    try {
      const updateData = {
        completed,
        completedAt: completed ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString(),
      };

      const updatedTodo = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.TODOS,
        todoId,
        updateData
      );
      
      // Clear reminder if task is completed
      if (completed && updatedTodo.reminderTime) {
        notificationService.clearTaskReminder(todoId);
      }
      // Re-schedule reminder if task is un-completed and has a reminder
      else if (!completed && updatedTodo.reminderTime) {
        this.scheduleReminderForTodo(updatedTodo);
      }
      
      return updatedTodo;
    } catch (error) {
      throw error;
    }
  }

  // Delete todo
  async deleteTodo(todoId) {
    try {
      // Clear any scheduled reminders for this todo
      notificationService.clearTaskReminder(todoId);
      
      return await databases.deleteDocument(DATABASE_ID, COLLECTIONS.TODOS, todoId);
    } catch (error) {
      throw error;
    }
  }

  // Schedule reminder for a todo
  scheduleReminderForTodo(todo) {
    if (!todo.reminderTime || todo.completed) return false;
    
    try {
      // Parse the reminder time (HH:MM)
      const [hours, minutes] = todo.reminderTime.split(':');
      if (!hours || !minutes) {
        console.log(`Invalid reminder time format for task ${todo.$id}:`, todo.reminderTime);
        return false;
      }
      
      // Create a due date for today with the specified time
      const dueDate = new Date();
      dueDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      // If the time already passed today, schedule for tomorrow
      const now = new Date();
      if (dueDate < now) {
        dueDate.setDate(dueDate.getDate() + 1);
      }
      
      console.log(`Setting reminder for task "${todo.title}" at ${dueDate.toLocaleString()}`);
      
      // Try both scheduling methods to maximize chances of success
      const reminder1 = notificationService.scheduleTaskReminder(
        todo.$id, 
        todo.title,
        dueDate,
        { 
          taskId: todo.$id,
          taskDueDate: todo.dueDate,
          priority: todo.priority
        }
      );
      
      // Also try our enhanced method
      const reminder2 = notificationService.scheduleReminder(
        todo.$id,
        todo.title,
        dueDate,
        {
          priority: todo.priority,
          onClick: () => {
            window.focus();
            window.location.href = '/dashboard/todos';
          }
        }
      );
      
      return reminder1 || reminder2;
    } catch (error) {
      console.error('Error scheduling reminder:', error);
      return false;
    }
  }

  // Get todos for analytics (completed tasks by date range)
  async getAnalytics(userId, startDate, endDate) {
    try {
      const queries = [
        Query.equal('userId', userId),
        Query.equal('completed', true),
        Query.between('completedAt', startDate, endDate),
        Query.orderDesc('completedAt')
      ];

      return await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.TODOS,
        queries
      );
    } catch (error) {
      throw error;
    }
  }

  // Get daily stats
  async getDailyStats(userId, date) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const completedTodos = await this.getAnalytics(
        userId,
        startOfDay.toISOString(),
        endOfDay.toISOString()
      );

      const allTodos = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.TODOS,
        [
          Query.equal('userId', userId),
          Query.between('createdAt', startOfDay.toISOString(), endOfDay.toISOString())
        ]
      );

      return {
        completed: completedTodos.total,
        total: allTodos.total,
        percentage: allTodos.total > 0 ? Math.round((completedTodos.total / allTodos.total) * 100) : 0
      };
    } catch (error) {
      throw error;
    }
  }

  // Reschedule all reminders for a user (useful when app starts or settings change)
  async rescheduleAllReminders(userId, remindersEnabled = true) {
    if (!remindersEnabled) {
      // Clear all reminders if reminders are disabled
      notificationService.clearAllReminders();
      return { cleared: true };
    }
    
    try {
      // Get all incomplete todos with reminders
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.TODOS,
        [
          Query.equal('userId', userId),
          Query.equal('completed', false),
          Query.notEqual('reminderTime', null)
        ]
      );
      
      let scheduledCount = 0;
      
      // Schedule reminder for each todo
      response.documents.forEach(todo => {
        if (this.scheduleReminderForTodo(todo)) {
          scheduledCount++;
        }
      });
      
      return {
        success: true,
        total: response.total,
        scheduled: scheduledCount
      };
    } catch (error) {
      console.error('Error rescheduling reminders:', error);
      return { success: false, error: error.message };
    }
  }
}

const todoService = new TodoService();

export default todoService;
