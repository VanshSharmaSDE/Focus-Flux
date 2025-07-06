import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import todoService from '../services/todo';
import settingsService from '../services/settings';
import notificationService from '../services/notifications';
import toast from 'react-hot-toast';

const TodoContext = createContext({});

export const useTodos = () => {
  const context = useContext(TodoContext);
  if (!context) {
    throw new Error('useTodos must be used within a TodoProvider');
  }
  return context;
};

export const TodoProvider = ({ children }) => {
  const { user } = useAuth();
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [filters, setFilters] = useState({
    completed: undefined,
    priority: '',
    search: '',
  });

  // Load todos when user changes or filters change
  useEffect(() => {
    if (user) {
      loadTodos();
    } else {
      setTodos([]);
    }
  }, [user, filters]);
  
  // Check for notification permissions and settings
  useEffect(() => {
    const checkNotificationSettings = async () => {
      if (user) {
        try {
          // Check notification permission
          const hasPermission = await notificationService.isNotificationSupported();
          
          // Check user settings
          const settings = await settingsService.getUserSettings(user.$id);
          const settingsEnabled = settings?.notifications?.reminders !== false;
          
          const isEnabled = hasPermission && settingsEnabled;
          setRemindersEnabled(isEnabled);
          
          // Reschedule or clear reminders based on settings
          if (hasPermission) {
            todoService.rescheduleAllReminders(user.$id, isEnabled);
          }
        } catch (error) {
          console.error('Error checking notification settings:', error);
        }
      }
    };
    
    checkNotificationSettings();
  }, [user]);

  const loadTodos = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await todoService.getTodos(user.$id, {
        completed: filters.completed,
        priority: filters.priority,
      });
      
      let filteredTodos = response.documents;
      
      // Apply search filter locally
      if (filters.search) {
        filteredTodos = filteredTodos.filter(todo =>
          todo.title.toLowerCase().includes(filters.search.toLowerCase()) ||
          todo.description?.toLowerCase().includes(filters.search.toLowerCase())
        );
      }
      
      setTodos(filteredTodos);
    } catch (error) {
      console.error('Load todos error:', error);
      toast.error('Failed to load todos');
    } finally {
      setLoading(false);
    }
  };

  const createTodo = async (todoData) => {
    if (!user) return;
    
    try {
      const newTodo = await todoService.createTodo({
        ...todoData,
        userId: user.$id,
      });
      
      setTodos(prev => [newTodo, ...prev]);
      toast.success('Todo created successfully!');
      return { success: true, todo: newTodo };
    } catch (error) {
      console.error('Create todo error:', error);
      toast.error('Failed to create todo');
      return { success: false, error: error.message };
    }
  };

  const updateTodo = async (todoId, updates) => {
    try {
      const updatedTodo = await todoService.updateTodo(todoId, updates);
      
      setTodos(prev =>
        prev.map(todo => todo.$id === todoId ? updatedTodo : todo)
      );
      
      toast.success('Todo updated successfully!');
      return { success: true, todo: updatedTodo };
    } catch (error) {
      console.error('Update todo error:', error);
      toast.error('Failed to update todo');
      return { success: false, error: error.message };
    }
  };

  const toggleTodo = async (todoId, completed) => {
    // Optimistic update - update UI immediately
    setTodos(prev =>
      prev.map(todo => 
        todo.$id === todoId 
          ? { 
              ...todo, 
              completed, 
              completedAt: completed ? new Date().toISOString() : null,
              updatedAt: new Date().toISOString()
            }
          : todo
      )
    );
    
    try {
      const updatedTodo = await todoService.toggleTodo(todoId, completed);
      
      // Update with actual data from server
      setTodos(prev =>
        prev.map(todo => todo.$id === todoId ? updatedTodo : todo)
      );
      
      toast.success(completed ? 'Todo completed!' : 'Todo marked as pending');
      return { success: true, todo: updatedTodo };
    } catch (error) {
      console.error('Toggle todo error:', error);
      
      // Rollback optimistic update on error
      setTodos(prev =>
        prev.map(todo => 
          todo.$id === todoId 
            ? { ...todo, completed: !completed, completedAt: !completed ? new Date().toISOString() : null }
            : todo
        )
      );
      
      toast.error('Failed to update todo');
      return { success: false, error: error.message };
    }
  };

  const deleteTodo = async (todoId) => {
    try {
      await todoService.deleteTodo(todoId);
      
      setTodos(prev => prev.filter(todo => todo.$id !== todoId));
      toast.success('Todo deleted successfully!');
      return { success: true };
    } catch (error) {
      console.error('Delete todo error:', error);
      toast.error('Failed to delete todo');
      return { success: false, error: error.message };
    }
  };

  const getAnalytics = async (startDate, endDate) => {
    if (!user) return null;
    
    try {
      const response = await todoService.getAnalytics(user.$id, startDate, endDate);
      return response.documents;
    } catch (error) {
      console.error('Get analytics error:', error);
      toast.error('Failed to load analytics');
      return null;
    }
  };

  const getDailyStats = async (date) => {
    if (!user) return null;
    
    try {
      return await todoService.getDailyStats(user.$id, date);
    } catch (error) {
      console.error('Get daily stats error:', error);
      return null;
    }
  };
  
  // Handle reminder settings change
  const updateReminderSettings = async (enabled) => {
    if (!user) return;
    
    try {
      setRemindersEnabled(enabled);
      
      // Reschedule or clear reminders based on new setting
      await todoService.rescheduleAllReminders(user.$id, enabled);
      
      return { success: true };
    } catch (error) {
      console.error('Update reminder settings error:', error);
      return { success: false, error: error.message };
    }
  };
  
  // Test notification functionality
  const testNotification = async () => {
    try {
      const result = await notificationService.testNotification();
      return { success: result };
    } catch (error) {
      console.error('Test notification error:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    todos,
    loading,
    filters,
    remindersEnabled,
    setFilters,
    createTodo,
    updateTodo,
    toggleTodo,
    deleteTodo,
    loadTodos,
    getAnalytics,
    getDailyStats,
    updateReminderSettings,
    testNotification
  };

  return (
    <TodoContext.Provider value={value}>
      {children}
    </TodoContext.Provider>
  );
};

export default TodoContext;
