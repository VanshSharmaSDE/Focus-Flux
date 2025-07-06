import React, { useState, useEffect } from 'react';
import { useTodos } from '../../context/TodoContext';
import { XMarkIcon, BellIcon, BellSlashIcon } from '@heroicons/react/24/outline';
import notificationService from '../../services/notifications';

const TodoModal = ({ todo, onClose }) => {
  const { createTodo, updateTodo } = useTodos();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    reminderTime: '',
    hasReminder: false,
  });
  const [showReminderTime, setShowReminderTime] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Initialize form data when todo changes
  useEffect(() => {
    if (todo) {
      setFormData({
        title: todo.title || '',
        description: todo.description || '',
        priority: todo.priority || 'medium',
        dueDate: todo.dueDate ? new Date(todo.dueDate).toISOString().split('T')[0] : '',
        reminderTime: todo.reminderTime || '',
        hasReminder: !!todo.reminderTime,
      });
      setShowReminderTime(!!todo.reminderTime);
    } else {
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        dueDate: '',
        reminderTime: '',
        hasReminder: false,
      });
      setShowReminderTime(false);
    }
  }, [todo]);

  // Check if notifications are enabled
  useEffect(() => {
    const checkNotificationPermission = async () => {
      const isSupported = 'Notification' in window;
      const isGranted = isSupported && Notification.permission === 'granted';
      setNotificationsEnabled(isGranted);
    };
    checkNotificationPermission();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleReminderToggle = async () => {
    // Request notification permission if toggling on
    if (!formData.hasReminder) {
      const permissionGranted = await notificationService.requestPermission();
      setNotificationsEnabled(permissionGranted);
      
      // Only proceed if permission was granted
      if (!permissionGranted) {
        return;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      hasReminder: !prev.hasReminder,
      reminderTime: !prev.hasReminder ? prev.reminderTime || getCurrentTimeString() : '',
    }));
    setShowReminderTime(!formData.hasReminder);
  };

  const getCurrentTimeString = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      return;
    }

    try {
      setLoading(true);
      
      const todoData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        dueDate: formData.dueDate || null,
        reminderTime: formData.hasReminder && formData.reminderTime ? formData.reminderTime : null,
      };

      if (todo) {
        // Update existing todo
        await updateTodo(todo.$id, todoData);
      } else {
        // Create new todo
        await createTodo(todoData);
      }

      onClose();
    } catch (error) {
      console.error('Error saving todo:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                {todo ? 'Edit Todo' : 'Create New Todo'}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter todo title..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter description (optional)..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
                />
              </div>

              {/* Priority and Due Date Row */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Priority */}
                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Priority
                  </label>
                  <select
                    name="priority"
                    id="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                {/* Due Date */}
                <div>
                  <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    id="dueDate"
                    value={formData.dueDate}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
                  />
                </div>
              </div>

              {/* Reminder Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={handleReminderToggle}
                    className="flex items-center text-sm text-gray-700 dark:text-gray-300"
                  >
                    {formData.hasReminder ? (
                      <BellIcon className="w-5 h-5 text-primary-500 mr-2" />
                    ) : (
                      <BellSlashIcon className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-2" />
                    )}
                    Reminder
                  </button>
                </div>
                
                {!notificationsEnabled && (
                  <span className="text-xs text-yellow-600 dark:text-yellow-400">
                    Notifications permission needed
                  </span>
                )}
              </div>

              {/* Reminder Time (conditionally shown) */}
              {showReminderTime && (
                <div>
                  <label htmlFor="reminderTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Reminder Time
                  </label>
                  <input
                    type="time"
                    name="reminderTime"
                    id="reminderTime"
                    value={formData.reminderTime}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    A notification will be sent at this time
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.title.trim()}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {loading ? 'Saving...' : (todo ? 'Update Todo' : 'Create Todo')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TodoModal;
