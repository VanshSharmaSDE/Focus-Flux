import React, { useState, useEffect } from 'react';
import { useTodos } from '../../context/TodoContext';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  PencilIcon, 
  TrashIcon,
  ExclamationCircleIcon,
  FlagIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { formatRelativeTime, isOverdue, isToday, isTomorrow } from '../../utils/dateUtils';
import ConfirmationModal from '../common/ConfirmationModal';
import notificationService from '../../services/notifications';
import { useAuth } from '../../context/AuthContext';
import settingsService from '../../services/settings';

const TodoItem = ({ todo, onEdit }) => {
  const { toggleTodo, deleteTodo } = useTodos();
  const { user } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [remindersEnabled, setRemindersEnabled] = useState(true);

  // Check user settings for reminders preference
  useEffect(() => {
    const checkReminderSettings = async () => {
      if (user) {
        try {
          const settings = await settingsService.getUserSettings(user.$id);
          if (settings && settings.notifications) {
            setRemindersEnabled(settings.notifications.reminders !== false);
          }
        } catch (error) {
          console.error('Error loading reminder settings:', error);
        }
      }
    };
    
    checkReminderSettings();
  }, [user]);

  useEffect(() => {
    // Schedule reminder for this todo if it has a reminderTime
    const scheduleReminder = async () => {
      if (todo.reminderTime && !todo.completed && remindersEnabled) {
        // Parse the reminder time
        const today = new Date();
        const [hours, minutes] = todo.reminderTime.split(':');
        const reminderDate = new Date();
        reminderDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        // If the time already passed today, schedule for tomorrow
        if (reminderDate < today) {
          reminderDate.setDate(reminderDate.getDate() + 1);
        }
        
        // Schedule the reminder
        notificationService.scheduleTaskReminder(
          todo.$id, 
          todo.title,
          reminderDate,
          { 
            taskDueDate: todo.dueDate,
            priority: todo.priority
          }
        );
      }
    };
    
    scheduleReminder();
    
    // Clean up reminder when component unmounts
    return () => {
      if (todo.reminderTime) {
        notificationService.clearTaskReminder(todo.$id);
      }
    };
  }, [todo, remindersEnabled]);

  const handleToggle = async () => {
    setIsToggling(true);
    await toggleTodo(todo.$id, !todo.completed);
    
    // If completing the todo, clear any scheduled reminder
    if (!todo.completed) {
      notificationService.clearTaskReminder(todo.$id);
    }
    
    // Small delay to show the toggle animation
    setTimeout(() => setIsToggling(false), 300);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      // Clear reminder before deleting
      notificationService.clearTaskReminder(todo.$id);
      await deleteTodo(todo.$id);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting todo:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const handleEdit = () => {
    onEdit(todo);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-500 dark:text-red-400';
      case 'medium':
        return 'text-yellow-500 dark:text-yellow-400';
      case 'low':
        return 'text-green-500 dark:text-green-400';
      default:
        return 'text-gray-400 dark:text-gray-500';
    }
  };

  const getDueDateStatus = (dueDate) => {
    if (!dueDate) return null;
    
    if (isOverdue(dueDate)) {
      return { text: 'Overdue', color: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20' };
    } else if (isToday(dueDate)) {
      return { text: 'Due Today', color: 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20' };
    } else if (isTomorrow(dueDate)) {
      return { text: 'Due Tomorrow', color: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20' };
    }
    
    return null;
  };

  const dueDateStatus = getDueDateStatus(todo.dueDate);

  const formatReminderTime = (timeString) => {
    if (!timeString) return '';
    
    try {
      const [hours, minutes] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes), 0);
      
      return date.toLocaleTimeString([], { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } catch (error) {
      return timeString;
    }
  };

  return (
    <div className={`border rounded-lg p-4 transition-all duration-200 hover:shadow-md ${
      todo.completed 
        ? 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600' 
        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-500'
    }`}>
      <div className="flex items-start space-x-3">
        {/* Checkbox */}
        <button
          onClick={handleToggle}
          disabled={isToggling}
          className={`flex-shrink-0 mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
            todo.completed
              ? 'bg-primary-600 border-primary-600 text-white'
              : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500'
          } ${isToggling ? 'opacity-70 scale-95' : ''}`}
        >
          {isToggling ? (
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            todo.completed && <CheckCircleIcon className="w-3 h-3" />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-medium flex items-center ${
            todo.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'
          }`}>
            {todo.title}
            {todo.reminderTime && !todo.completed && remindersEnabled && (
              <BellIcon className="ml-2 w-3 h-3 text-primary-500" />
            )}
          </h4>
          
          {todo.description && (
            <p className={`mt-1 text-sm ${
              todo.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-300'
            }`}>
              {todo.description}
            </p>
          )}

          {/* Meta information */}
          <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
            {/* Priority */}
            <div className="flex items-center">
              <FlagIcon className={`w-3 h-3 mr-1 ${getPriorityColor(todo.priority)}`} />
              <span className="capitalize">{todo.priority || 'medium'}</span>
            </div>

            {/* Due date */}
            {todo.dueDate && (
              <div className="flex items-center">
                <ClockIcon className="w-3 h-3 mr-1" />
                <span>{formatRelativeTime(todo.dueDate)}</span>
              </div>
            )}

            {/* Reminder time */}
            {todo.reminderTime && !todo.completed && remindersEnabled && (
              <div className="flex items-center">
                <BellIcon className="w-3 h-3 mr-1 text-primary-500" />
                <span>Reminder at {formatReminderTime(todo.reminderTime)}</span>
              </div>
            )}

            {/* Created date */}
            <div className="flex items-center">
              <span>Created {formatRelativeTime(todo.createdAt)}</span>
            </div>
          </div>

          {/* Due date status badge */}
          {dueDateStatus && (
            <div className="mt-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${dueDateStatus.color}`}>
                <ExclamationCircleIcon className="w-3 h-3 mr-1" />
                {dueDateStatus.text}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleEdit}
            className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
            title="Edit todo"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleDelete}
            className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200"
            title="Delete todo"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Todo"
        message={`Are you sure you want to delete "${todo.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default TodoItem;
