import React, { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import dailyGoalService from '../../services/dailyGoal';
import notificationService from '../../services/notifications';

const DailyGoalModal = ({ isOpen, onClose, onSave, editingGoal, userId, userTags }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    planDate: new Date().toISOString().split('T')[0]
  });

  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    tag: '',
    reminderTime: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const priorities = [
    { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-700' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'high', label: 'High', color: 'bg-red-100 text-red-700' }
  ];

  useEffect(() => {
    if (editingGoal) {
      setFormData({
        title: editingGoal.title || '',
        description: editingGoal.description || '',
        planDate: editingGoal.planDate || new Date().toISOString().split('T')[0]
      });
      loadExistingTasks();
    } else {
      resetForm();
    }
    
    // Check for notification permission when modal opens
    if (isOpen) {
      checkNotificationPermission();
    }
  }, [editingGoal, isOpen]);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      planDate: new Date().toISOString().split('T')[0]
    });
    setTasks([]);
    setNewTask({
      title: '',
      description: '',
      priority: 'medium',
      tag: '',
      reminderTime: ''
    });
    setErrors({});
  };

  const loadExistingTasks = async () => {
    try {
      const existingTasks = await dailyGoalService.getDailyTasks(editingGoal.$id);
      setTasks(existingTasks.map(task => ({
        id: task.$id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        tag: task.tag || '',
        reminderTime: task.reminderTime || '',
        isExisting: true
      })));
    } catch (error) {
      console.error('Error loading existing tasks:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleTaskInputChange = (e) => {
    const { name, value } = e.target;
    setNewTask(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addTask = () => {
    if (!newTask.title.trim()) {
      setErrors(prev => ({ ...prev, taskTitle: 'Task title is required' }));
      return;
    }

    const task = {
      id: Date.now(),
      title: newTask.title,
      description: newTask.description,
      priority: newTask.priority,
      tag: newTask.tag,
      reminderTime: newTask.reminderTime,
      isExisting: false
    };

    setTasks(prev => [...prev, task]);
    setNewTask({
      title: '',
      description: '',
      priority: 'medium',
      tag: '',
      reminderTime: ''
    });
    setErrors(prev => ({ ...prev, taskTitle: '' }));
  };

  const removeTask = (taskId) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const updateTask = (taskId, field, value) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, [field]: value } : task
    ));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Plan title is required';
    }
    
    if (tasks.length === 0) {
      newErrors.tasks = 'At least one task is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      let plan;
      
      if (editingGoal) {
        // Update existing plan
        plan = await dailyGoalService.updateDailyPlan(editingGoal.$id, {
          title: formData.title,
          description: formData.description,
          planDate: formData.planDate
        });
      } else {
        // Create new plan
        plan = await dailyGoalService.createDailyPlan({
          title: formData.title,
          description: formData.description,
          planDate: new Date(formData.planDate),
          userId
        });
      }

      // Handle tasks
      for (const task of tasks) {
        if (!task.isExisting) {
          // Create new task
          console.log(`Creating daily task with reminder: ${task.title}, Time: ${task.reminderTime}`);
          try {
            const newTask = await dailyGoalService.createDailyTask({
              title: task.title,
              description: task.description,
              priority: task.priority,
              tag: task.tag || null,
              reminderTime: task.reminderTime || null,
              planId: plan.$id,
              userId
            });
            console.log(`Daily task created successfully: ${newTask.$id}`);
            
            // Extra log for reminder information
            if (task.reminderTime) {
              console.log(`Reminder time set for task ${newTask.$id}: ${task.reminderTime}`);
            }
          } catch (taskError) {
            console.error(`Error creating daily task: ${task.title}`, taskError);
            throw taskError;
          }
        } else {
          // Update existing task
          await dailyGoalService.updateDailyTask(task.id, {
            title: task.title,
            description: task.description,
            priority: task.priority,
            tag: task.tag || null,
            reminderTime: task.reminderTime || null
          });
        }
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving plan:', error);
      setErrors({ submit: 'Failed to save plan. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const getTagColor = (tagName) => {
    const tag = userTags.find(t => t.name === tagName);
    return tag ? tag.color : '#6B7280';
  };

  // Request notification permission if not already granted
  const checkNotificationPermission = async () => {
    try {
      console.log('Checking notification permission in DailyGoalModal');
      
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        console.log('Requesting notification permission');
        const permission = await Notification.requestPermission();
        console.log(`Notification permission result: ${permission}`);
      } else {
        console.log(`Current notification permission: ${Notification.permission}`);
      }
    } catch (error) {
      console.error('Error checking notification permission:', error);
    }
  };

  const testDailyNotification = async () => {
    try {
      console.log('Testing daily task notification');
      
      // First ensure we have permission
      if (Notification.permission !== 'granted') {
        console.log('Requesting notification permission for test');
        const permission = await Notification.requestPermission();
        console.log(`Permission result: ${permission}`);
        
        if (permission !== 'granted') {
          alert('Notification permission denied. Please enable notifications in your browser settings.');
          return;
        }
      }
      
      // Create a direct notification
      const now = new Date();
      const notification = new Notification('🔔 Daily Task Test', {
        body: `This is a test notification for daily tasks at ${now.toLocaleTimeString()}`,
        icon: '/src/assets/logo.png',
        tag: `daily-test-${Date.now()}`,
        requireInteraction: true
      });
      
      console.log('Daily task test notification created');
      
      // Also show a toast message
      alert(`Test notification sent! Check your browser notifications.\nTime: ${now.toLocaleTimeString()}`);
      
    } catch (error) {
      console.error('Error testing daily task notification:', error);
      alert(`Error testing notification: ${error.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />
        
        <div className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {editingGoal ? 'Edit Daily Goal Plan' : 'Create Daily Goal Plan'}
            </h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Plan Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Plan Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Monday's Goals"
                />
                {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  name="planDate"
                  value={formData.planDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="What do you want to achieve today?"
              />
            </div>

            {/* Add New Task */}
            <div className="border-t pt-6">
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                Add Tasks
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <input
                    type="text"
                    name="title"
                    value={newTask.title}
                    onChange={handleTaskInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      errors.taskTitle ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Task title"
                  />
                  {errors.taskTitle && <p className="mt-1 text-sm text-red-600">{errors.taskTitle}</p>}
                </div>

                <div>
                  <input
                    type="text"
                    name="description"
                    value={newTask.description}
                    onChange={handleTaskInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Task description (optional)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <select
                    name="priority"
                    value={newTask.priority}
                    onChange={handleTaskInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {priorities.map(priority => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <select
                    name="tag"
                    value={newTask.tag}
                    onChange={handleTaskInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">No Tag</option>
                    {userTags.map(tag => (
                      <option key={tag.$id} value={tag.name}>
                        {tag.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <input
                    type="time"
                    name="reminderTime"
                    value={newTask.reminderTime}
                    onChange={handleTaskInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Reminder time"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Set reminder (optional)</p>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={addTask}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Task
                  </button>
                  
                  {/* Add test notification button */}
                  <button
                    type="button"
                    onClick={testDailyNotification}
                    className="mt-2 w-full inline-flex items-center justify-center px-4 py-1 text-xs border border-blue-300 dark:border-blue-600 font-medium rounded-lg text-blue-700 dark:text-blue-300 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700 focus:outline-none transition-all duration-200"
                  >
                    🔔 Test Daily Notification
                  </button>
                </div>
              </div>
            </div>

            {/* Tasks List */}
            {tasks.length > 0 && (
              <div className="border-t pt-6">
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                  Tasks ({tasks.length})
                </h4>
                
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {tasks.map(task => (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h5 className="font-medium text-gray-900 dark:text-white">
                            {task.title}
                          </h5>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            task.priority === 'high' ? 'bg-red-100 text-red-700' :
                            task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {task.priority}
                          </span>
                          {task.tag && (
                            <span
                              className="px-2 py-1 text-xs rounded-full text-white"
                              style={{ backgroundColor: getTagColor(task.tag) }}
                            >
                              {task.tag}
                            </span>
                          )}
                          {task.reminderTime && (
                            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                              🔔 {task.reminderTime}
                            </span>
                          )}
                        </div>
                        {task.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            {task.description}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeTask(task.id)}
                        className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all duration-200"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {errors.tasks && <p className="text-sm text-red-600">{errors.tasks}</p>}
            {errors.submit && <p className="text-sm text-red-600">{errors.submit}</p>}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Saving...' : (editingGoal ? 'Update Plan' : 'Create Plan')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DailyGoalModal;
