import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  ChartBarIcon, 
  TagIcon, 
  ChartPieIcon,
  TrophyIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AnalyticsDisabled from '../../components/common/AnalyticsDisabled';
import { useAnalytics } from '../../context/AnalyticsContext';
import dailyGoalService from '../../services/dailyGoal';
import notificationService from '../../services/notifications';
import settingsService from '../../services/settings';
import DailyGoalModal from '../../components/dashboard/DailyGoalModal';
import DailyGoalAnalytics from '../../components/dashboard/DailyGoalAnalytics';
import TagManager from '../../components/dashboard/TagManager';
import ConfirmationModal from '../../components/common/ConfirmationModal';

const DailyGoals = () => {
  const { user } = useAuth();
  const { analyticsEnabled, loading: analyticsLoading } = useAnalytics();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('today');
  const [showModal, setShowModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  
  // Daily Goal Plan State
  const [dailyPlan, setDailyPlan] = useState(null);
  const [dailyTasks, setDailyTasks] = useState([]);
  const [userTags, setUserTags] = useState([]);
  const [todayStats, setTodayStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    completionPercentage: 0,
    tagStats: {}
  });
  
  // Daily Completions State
  const [completionsData, setCompletionsData] = useState([]);
  const [completionsLoading, setCompletionsLoading] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState('7days');
  const [togglingTasks, setTogglingTasks] = useState(new Set());
  
  // Confirmation modals state
  const [showDeletePlanConfirm, setShowDeletePlanConfirm] = useState(false);
  const [showDeleteTaskConfirm, setShowDeleteTaskConfirm] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const tabs = [
    { key: 'today', label: "Today's Goals", icon: CalendarIcon },
    { key: 'create', label: 'Create Plan', icon: PlusIcon },
    { key: 'completions', label: 'Daily Completions', icon: TrophyIcon },
    ...(analyticsEnabled ? [{ key: 'analytics', label: 'Analytics', icon: ChartBarIcon }] : []),
    { key: 'tags', label: 'Manage Tags', icon: TagIcon },
  ];

  useEffect(() => {
    if (user) {
      loadTodaysPlan();
      loadUserTags();
    }
  }, [user]);
  
  useEffect(() => {
    if (user && dailyPlan) {
      checkAndScheduleReminders();
    }
  }, [dailyPlan]);

  // Reset tab if analytics is disabled and analytics tab is selected
  useEffect(() => {
    if (!analyticsEnabled && activeTab === 'analytics') {
      setActiveTab('today');
    }
  }, [analyticsEnabled, activeTab]);

  const loadTodaysPlan = async () => {
    try {
      setLoading(true);
      const plan = await dailyGoalService.getTodaysPlan(user.$id);
      setDailyPlan(plan);
      
      if (plan) {
        const tasks = await dailyGoalService.getDailyTasks(plan.$id);
        setDailyTasks(tasks);
        calculateTodayStats(tasks);
      }
    } catch (error) {
      console.error('Error loading today\'s plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserTags = async () => {
    try {
      const tags = await dailyGoalService.getUserTags(user.$id);
      setUserTags(tags);
    } catch (error) {
      console.error('Error loading user tags:', error);
    }
  };

  const calculateTodayStats = (tasks) => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // Calculate tag-wise stats
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

    setTodayStats({
      totalTasks,
      completedTasks,
      completionPercentage,
      tagStats
    });
  };

  const handleTaskToggle = async (taskId, completed) => {
    // Add task to toggling set
    setTogglingTasks(prev => new Set(prev).add(taskId));
    
    // Optimistic update - update UI immediately
    const updatedTasks = dailyTasks.map(task => 
      task.$id === taskId ? { ...task, completed } : task
    );
    setDailyTasks(updatedTasks);
    calculateTodayStats(updatedTasks);
    
    try {
      await dailyGoalService.toggleTask(taskId, completed);
      // Task is already updated in the UI, no need to update again
    } catch (error) {
      console.error('Error toggling task:', error);
      
      // Rollback optimistic update on error
      const rolledBackTasks = dailyTasks.map(task => 
        task.$id === taskId ? { ...task, completed: !completed } : task
      );
      setDailyTasks(rolledBackTasks);
      calculateTodayStats(rolledBackTasks);
    } finally {
      // Remove task from toggling set after a short delay
      setTimeout(() => {
        setTogglingTasks(prev => {
          const newSet = new Set(prev);
          newSet.delete(taskId);
          return newSet;
        });
      }, 300);
    }
  };

  const handleCreatePlan = () => {
    setEditingGoal(null);
    setShowModal(true);
  };

  const handleEditPlan = () => {
    setEditingGoal(dailyPlan);
    setShowModal(true);
  };

  const handlePlanSaved = () => {
    setShowModal(false);
    loadTodaysPlan();
  };

  const handleDeletePlan = () => {
    setShowDeletePlanConfirm(true);
  };

  const handleConfirmDeletePlan = async () => {
    setIsDeleting(true);
    try {
      await dailyGoalService.deleteDailyPlan(dailyPlan.$id);
      setDailyPlan(null);
      setDailyTasks([]);
      setTodayStats({
        totalTasks: 0,
        completedTasks: 0,
        completionPercentage: 0,
        tagStats: {}
      });
      setShowDeletePlanConfirm(false);
    } catch (error) {
      console.error('Error deleting plan:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDeletePlan = () => {
    setShowDeletePlanConfirm(false);
  };

  const handleDeleteTask = (task) => {
    setTaskToDelete(task);
    setShowDeleteTaskConfirm(true);
  };

  const handleConfirmDeleteTask = async () => {
    if (!taskToDelete) return;
    
    setIsDeleting(true);
    try {
      await dailyGoalService.deleteDailyTask(taskToDelete.$id);
      const updatedTasks = dailyTasks.filter(task => task.$id !== taskToDelete.$id);
      setDailyTasks(updatedTasks);
      calculateTodayStats(updatedTasks);
      setShowDeleteTaskConfirm(false);
      setTaskToDelete(null);
    } catch (error) {
      console.error('Error deleting task:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDeleteTask = () => {
    setShowDeleteTaskConfirm(false);
    setTaskToDelete(null);
  };

  const loadCompletionsData = async () => {
    try {
      setCompletionsLoading(true);
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      const days = selectedDateRange === '7days' ? 7 : selectedDateRange === '30days' ? 30 : 90;
      startDate.setDate(startDate.getDate() - days);
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      // Use enhanced completions function
      const enhancedData = await dailyGoalService.getEnhancedDailyCompletions(user.$id, startDateStr, endDateStr);
      setCompletionsData(enhancedData);
      
    } catch (error) {
      console.error('Error loading completions data:', error);
    } finally {
      setCompletionsLoading(false);
    }
  };

  // Load completions data when tab changes to completions or date range changes
  useEffect(() => {
    if (user && activeTab === 'completions') {
      loadCompletionsData();
    }
  }, [user, activeTab, selectedDateRange]);

  const renderTodayView = () => {
    if (!dailyPlan) {
      return (
        <div className="text-center py-12">
          <ChartPieIcon className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Daily Plan Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Create your first daily goal plan to get started!
          </p>
          <button
            onClick={handleCreatePlan}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 transform hover:scale-105"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Today's Plan
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Plan Header */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {dailyPlan.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                {dailyPlan.description}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={testNotification}
                className="inline-flex items-center px-4 py-2 border border-blue-300 dark:border-blue-600 text-sm font-medium rounded-lg text-blue-700 dark:text-blue-400 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Test Notification
              </button>
              <button
                onClick={handleEditPlan}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit Plan
              </button>
              <button
                onClick={handleDeletePlan}
                className="inline-flex items-center px-4 py-2 border border-red-300 dark:border-red-600 text-sm font-medium rounded-lg text-red-700 dark:text-red-400 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete Plan
              </button>
            </div>
          </div>
          
          {/* Today's Progress */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Today's Progress
              </span>
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {todayStats.completionPercentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${todayStats.completionPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mt-1">
              <span>{todayStats.completedTasks} completed</span>
              <span>{todayStats.totalTasks} total tasks</span>
            </div>
          </div>
        </div>

        {/* Tag Stats */}
        {Object.keys(todayStats.tagStats).length > 0 && (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Category Progress
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(todayStats.tagStats).map(([tagName, stats]) => (
                <div key={tagName} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: stats.color }}
                      />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {tagName}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-gray-600 dark:text-gray-300">
                      {stats.percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${stats.percentage}%`,
                        backgroundColor: stats.color
                      }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {stats.completed}/{stats.total} tasks
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Daily Tasks */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Today's Tasks
          </h3>
          <div className="space-y-3">
            {dailyTasks.map((task) => (
              <div
                key={task.$id}
                className={`group flex items-start p-4 rounded-lg border-2 transition-all duration-200 ${
                  task.completed
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-md'
                }`}
              >
                <button
                  onClick={() => handleTaskToggle(task.$id, !task.completed)}
                  disabled={togglingTasks.has(task.$id)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                    task.completed
                      ? 'bg-green-500 border-green-500 text-white shadow-lg'
                      : 'border-gray-300 dark:border-gray-500 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
                  } ${togglingTasks.has(task.$id) ? 'opacity-70 scale-95' : ''}`}
                >
                  {togglingTasks.has(task.$id) ? (
                    <LoadingSpinner size="small" />
                  ) : (
                    task.completed && <CheckCircleIcon className="h-4 w-4" />
                  )}
                </button>
                
                <div className="flex-1 ml-4">
                  <div className="flex items-center justify-between">
                    <h4 className={`font-medium text-base transition-all duration-200 ${
                      task.completed
                        ? 'text-gray-500 dark:text-gray-400 line-through'
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {task.title}
                    </h4>
                    <div className="flex items-center space-x-2 ml-4">
                      {task.tag && (
                        <span
                          className="px-3 py-1 text-xs font-medium rounded-full text-white shadow-sm"
                          style={{ backgroundColor: task.tagColor }}
                        >
                          {task.tag}
                        </span>
                      )}
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        task.priority === 'high'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          : task.priority === 'medium'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}>
                        {task.priority}
                      </span>
                      {task.reminderTime && (
                        <span 
                          className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 cursor-pointer"
                          onClick={() => handleSetReminder(task)}
                          title="Click to change reminder time"
                        >
                          🔔 {task.reminderTime}
                        </span>
                      )}
                      <button
                        onClick={() => handleSetReminder(task)}
                        className={`p-1 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-all duration-200 ${task.reminderTime ? '' : 'opacity-0 group-hover:opacity-100'}`}
                        title={task.reminderTime ? "Update reminder" : "Set reminder"}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task)}
                        className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100"
                        title="Delete task"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {task.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                      {task.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderCreateView = () => (
    <div className="text-center py-12">
      <ChartPieIcon className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Create Your Daily Goal Plan
      </h3>
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        Set up your daily goals and tasks to track your progress
      </p>
      <button
        onClick={handleCreatePlan}
        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 transform hover:scale-105"
      >
        <PlusIcon className="h-5 w-5 mr-2" />
        Create New Plan
      </button>
    </div>
  );

  const renderCompletionsView = () => {
    const dateRangeOptions = [
      { value: '7days', label: 'Last 7 Days' },
      { value: '30days', label: 'Last 30 Days' },
      { value: '90days', label: 'Last 90 Days' },
    ];

    if (completionsLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="large" />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Header with Date Range Selector */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Daily Completions Overview
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              View all your daily goals and their completion status
            </p>
          </div>
          <div className="flex space-x-2">
            {dateRangeOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setSelectedDateRange(option.value)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  selectedDateRange === option.value
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Completions Data */}
        {completionsData.length === 0 ? (
          <div className="text-center py-12">
            <TrophyIcon className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Daily Goals Found
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              No daily goals found for the selected time period.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {completionsData.map((dayData, index) => (
              <div key={dayData.date} className="card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <CalendarIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                        {new Date(dayData.date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {dayData.planTitle}
                      </p>
                      {dayData.planDescription && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {dayData.planDescription}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                        {dayData.completionPercentage}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {dayData.completedTasks}/{dayData.totalTasks} completed
                      </div>
                    </div>
                    <div className="w-16 h-16 relative">
                      <svg className="w-16 h-16 transform -rotate-90">
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                          className="text-gray-200 dark:text-gray-700"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 28}`}
                          strokeDashoffset={`${2 * Math.PI * 28 * (1 - dayData.completionPercentage / 100)}`}
                          className="text-primary-600 dark:text-primary-400"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Tasks for this day */}
                <div className="space-y-4">
                  {/* Tag Statistics */}
                  {Object.keys(dayData.tagStats || {}).length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                        Category Progress
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {Object.entries(dayData.tagStats).map(([tagName, stats]) => (
                          <div key={tagName} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center">
                                <div
                                  className="w-3 h-3 rounded-full mr-2"
                                  style={{ backgroundColor: stats.color }}
                                />
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {tagName}
                                </span>
                              </div>
                              <span className="text-sm font-bold text-gray-600 dark:text-gray-300">
                                {stats.percentage}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                              <div
                                className="h-2 rounded-full transition-all duration-300"
                                style={{ 
                                  width: `${stats.percentage}%`,
                                  backgroundColor: stats.color
                                }}
                              />
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {stats.completed}/{stats.total} tasks
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tasks List */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                      Tasks ({dayData.tasks.length})
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {dayData.tasks.map((task, taskIndex) => (
                        <div
                          key={taskIndex}
                          className={`p-3 rounded-lg border ${
                            task.completed
                              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                              : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                task.completed
                                  ? 'bg-green-500 border-green-500'
                                  : 'border-gray-300 dark:border-gray-500'
                              }`}>
                                {task.completed && (
                                  <CheckCircleIcon className="h-3 w-3 text-white" />
                                )}
                              </div>
                              <span className={`text-sm font-medium ${
                                task.completed
                                  ? 'text-gray-500 dark:text-gray-400 line-through'
                                  : 'text-gray-900 dark:text-white'
                              }`}>
                                {task.title}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              {task.tag && (
                                <span
                                  className="px-2 py-1 text-xs font-medium rounded-full text-white"
                                  style={{ backgroundColor: task.tagColor }}
                                >
                                  {task.tag}
                                </span>
                              )}
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                task.priority === 'high'
                                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                  : task.priority === 'medium'
                                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                              }`}>
                                {task.priority}
                              </span>
                            </div>
                          </div>
                          {task.description && (
                            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 ml-6">
                              {task.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const handleSetReminder = async (task) => {
    // Default to current time if no reminder is set
    const defaultTime = task.reminderTime || 
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    
    const time = prompt('Set reminder time (HH:MM):', defaultTime);
    
    if (time === null) return; // User cancelled
    
    // Validate time format
    const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
    if (time && !timeRegex.test(time)) {
      alert('Please enter a valid time in HH:MM format');
      return;
    }
    
    try {
      const reminderTime = time || null; // If empty string, set to null to remove reminder
      
      // Update task with new reminder time
      await dailyGoalService.updateDailyTask(task.$id, {
        reminderTime
      });
      
      // Update local state
      const updatedTasks = dailyTasks.map(t => 
        t.$id === task.$id ? { ...t, reminderTime } : t
      );
      setDailyTasks(updatedTasks);
      
      if (reminderTime) {
        toast.success(`Reminder set for ${task.title} at ${reminderTime}`);
      } else {
        toast.success(`Reminder removed for ${task.title}`);
      }
    } catch (error) {
      console.error('Error setting reminder:', error);
      toast.error('Failed to set reminder');
    }
  };

  const checkAndScheduleReminders = async () => {
    try {
      // Check if reminders are enabled in settings
      const settings = await settingsService.getUserSettings(user.$id);
      const remindersEnabled = settings?.notifications?.reminders !== false;
      
      if (remindersEnabled) {
        // Reschedule all reminders for daily tasks
        const result = await dailyGoalService.rescheduleAllReminders(user.$id, true);
        console.log(`Scheduled ${result.scheduled} daily task reminders`);
      }
    } catch (error) {
      console.error('Error checking reminder settings:', error);
    }
  };

  const testNotification = async () => {
    try {
      // Use the imported notification service
      const result = await notificationService.showImmediateTestNotification();
      
      if (result) {
        toast.success('Test notification sent! Check that you received it.');
      } else {
        toast.error('Failed to show notification. Please check your browser settings.');
      }
    } catch (error) {
      console.error('Error testing notification:', error);
      toast.error('Error testing notification system');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Daily Goals
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Plan, track, and analyze your daily goals
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {analyticsEnabled && (
            <button
              onClick={() => setShowAnalytics(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200"
            >
              <EyeIcon className="h-4 w-4 mr-2" />
              View Analytics
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center py-3 px-4 border-b-2 font-medium text-sm transition-all duration-200 rounded-t-lg ${
                  activeTab === tab.key
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <Icon className="h-5 w-5 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'today' && renderTodayView()}
        {activeTab === 'create' && renderCreateView()}
        {activeTab === 'analytics' && (
          analyticsEnabled ? (
            <DailyGoalAnalytics userId={user.$id} />
          ) : (
            <AnalyticsDisabled 
              title="Daily Goals Analytics Disabled"
              showSettingsLink={true}
            />
          )
        )}
        {activeTab === 'tags' && (
          <TagManager />
        )}
        {activeTab === 'completions' && renderCompletionsView()}
      </div>

      {/* Modals */}
      {showModal && (
        <DailyGoalModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSave={handlePlanSaved}
          editingGoal={editingGoal}
          userId={user.$id}
          userTags={userTags}
        />
      )}

      {showAnalytics && analyticsEnabled && (
        <DailyGoalAnalytics
          isOpen={showAnalytics}
          onClose={() => setShowAnalytics(false)}
          userId={user.$id}
        />
      )}

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={showDeletePlanConfirm}
        onClose={handleCancelDeletePlan}
        onConfirm={handleConfirmDeletePlan}
        title="Delete Daily Plan"
        message={`Are you sure you want to delete the plan "${dailyPlan?.title}"? This will also delete all associated tasks. This action cannot be undone.`}
        confirmText="Delete Plan"
        cancelText="Cancel"
        type="danger"
        isLoading={isDeleting}
      />

      <ConfirmationModal
        isOpen={showDeleteTaskConfirm}
        onClose={handleCancelDeleteTask}
        onConfirm={handleConfirmDeleteTask}
        title="Delete Task"
        message={`Are you sure you want to delete the task "${taskToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete Task"
        cancelText="Cancel"
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default DailyGoals;
