import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { 
  CalendarIcon, 
  ClockIcon, 
  TrophyIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  FireIcon,
  ArrowPathIcon,
  PlusIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { useTodos } from '../../context/TodoContext';
import { 
  getStartOfWeek, 
  getEndOfWeek, 
  getStartOfMonth, 
  getEndOfMonth,
  getStartOfYear,
  getEndOfYear,
  formatDate,
  getWeekDays,
  generateDateRange
} from '../../utils/dateUtils';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AnalyticsDisabled from '../../components/common/AnalyticsDisabled';
import { useAnalytics } from '../../context/AnalyticsContext';
import { useNavigate } from 'react-router-dom';
import inspirationalQuotes from 'inspirational-quotes';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const DashboardHome = () => {
  const { user } = useAuth();
  const { getAnalytics, getDailyStats, getDailyAnalytics, getStreakData } = useTodos();
  const { analyticsEnabled, loading: analyticsLoading } = useAnalytics();
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dailyTip, setDailyTip] = useState(null);
  const [stats, setStats] = useState({
    today: { completed: 0, total: 0, percentage: 0 },
    week: { completed: 0, total: 0, percentage: 0 },
    month: { completed: 0, total: 0, percentage: 0 },
  });
  const [dailyStats, setDailyStats] = useState({
    completions: 0,
    totalDailyTodos: 0,
    completionRate: 0
  });
  const [streakData, setStreakData] = useState([]);

  const periods = [
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'year', label: 'This Year' },
  ];

  // Enhanced daily tips system combining productivity tips and inspirational quotes
  const productivityTips = [
    {
      category: "Productivity",
      emoji: "💡",
      title: "Focus Tip",
      content: "Try the Pomodoro Technique: Work for 25 minutes, then take a 5-minute break.",
      color: "blue"
    },
    {
      category: "Productivity",
      emoji: "📈",
      title: "Progress Tip", 
      content: "Set 3 priority tasks each morning to maintain focus throughout the day.",
      color: "green"
    },
    {
      category: "Productivity",
      emoji: "⚡",
      title: "Energy Tip",
      content: "Schedule demanding tasks during your peak energy hours for better results.",
      color: "purple"
    },
    {
      category: "Productivity",
      emoji: "🎯",
      title: "Goal Setting",
      content: "Break large goals into smaller, actionable steps to avoid overwhelm.",
      color: "indigo"
    },
    {
      category: "Productivity",
      emoji: "🚀",
      title: "Momentum Tip",
      content: "Start with the easiest task to build momentum for the day.",
      color: "pink"
    },
    {
      category: "Wellness",
      emoji: "🧘",
      title: "Mindfulness",
      content: "Take 5 minutes to practice deep breathing before starting work.",
      color: "emerald"
    },
    {
      category: "Wellness",
      emoji: "💧",
      title: "Hydration",
      content: "Drink a glass of water every hour to stay hydrated and alert.",
      color: "cyan"
    },
    {
      category: "Wellness",
      emoji: "🌱",
      title: "Growth Mindset",
      content: "View challenges as opportunities to learn and grow.",
      color: "teal"
    },
    {
      category: "Innovation",
      emoji: "💭",
      title: "Creative Thinking",
      content: "Change your environment when stuck - sometimes a new perspective helps.",
      color: "orange"
    },
    {
      category: "Time Management",
      emoji: "⏰",
      title: "Time Blocking",
      content: "Block specific times for specific tasks to improve focus.",
      color: "slate"
    }
  ];

  // Get daily tip combining productivity tips and inspirational quotes
  const getDailyTip = () => {
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    
    // Alternate between productivity tips and inspirational quotes
    const useQuote = dayOfYear % 3 === 0; // Show quote every 3rd day
    
    if (useQuote) {
      try {
        const quote = inspirationalQuotes.getQuote();
        return {
          category: "Inspiration",
          emoji: "✨",
          title: "Daily Inspiration",
          content: `"${quote.text}" - ${quote.author}`,
          color: "yellow",
          isQuote: true
        };
      } catch (error) {
        console.log('Fallback to productivity tip:', error);
        // Fallback to productivity tip if quote fails
        const tipIndex = dayOfYear % productivityTips.length;
        return productivityTips[tipIndex];
      }
    } else {
      const tipIndex = dayOfYear % productivityTips.length;
      return productivityTips[tipIndex];
    }
  };

  // Function to get a random tip/quote for manual refresh
  const getRandomTip = () => {
    const randomChoice = Math.random();
    
    if (randomChoice < 0.4) { // 40% chance for inspirational quote
      try {
        const quote = inspirationalQuotes.getQuote();
        return {
          category: "Inspiration",
          emoji: "✨",
          title: "Random Inspiration",
          content: `"${quote.text}" - ${quote.author}`,
          color: "yellow",
          isQuote: true
        };
      } catch (error) {
        // Fallback to random productivity tip
        const randomIndex = Math.floor(Math.random() * productivityTips.length);
        return productivityTips[randomIndex];
      }
    } else { // 60% chance for productivity tip
      const randomIndex = Math.floor(Math.random() * productivityTips.length);
      return productivityTips[randomIndex];
    }
  };

  // Quick actions configuration
  const quickActions = [
    {
      id: 'add-task',
      title: 'Add New Task',
      icon: PlusIcon,
      color: 'green',
      action: () => navigate('/dashboard/todos', { state: { openModal: true } })
    },
    {
      id: 'chat-friends',
      title: 'Chat with Friends',
      icon: ChatBubbleLeftRightIcon,
      color: 'blue',
      action: () => {
        // Navigate to social page and set the chat tab as active
        navigate('/dashboard/social', { state: { activeTab: 'chat' } });
      }
    },
    {
      id: 'profile',
      title: 'View Profile',
      icon: UserIcon,
      color: 'purple',
      action: () => navigate('/dashboard/profile')
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: CogIcon,
      color: 'gray',
      action: () => navigate('/dashboard/settings')
    }
  ];

  useEffect(() => {
    if (user && !analyticsLoading) {
      if (analyticsEnabled) {
        loadAnalytics();
        loadStats();
        loadDailyStats();
        loadStreakData();
      } else {
        // If analytics is disabled, set loading to false immediately
        setLoading(false);
      }
    }
    // Load daily tip
    setDailyTip(getDailyTip());
  }, [user, selectedPeriod, analyticsEnabled, analyticsLoading]);

  // Reset loading state when analytics settings change
  useEffect(() => {
    if (!analyticsLoading && !analyticsEnabled) {
      setLoading(false);
    }
  }, [analyticsEnabled, analyticsLoading]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const now = new Date();
      let startDate, endDate;

      switch (selectedPeriod) {
        case 'week':
          startDate = getStartOfWeek(now);
          endDate = getEndOfWeek(now);
          break;
        case 'month':
          startDate = getStartOfMonth(now);
          endDate = getEndOfMonth(now);
          break;
        case 'year':
          startDate = getStartOfYear(now);
          endDate = getEndOfYear(now);
          break;
        default:
          startDate = getStartOfWeek(now);
          endDate = getEndOfWeek(now);
      }

      const data = await getAnalytics(startDate.toISOString(), endDate.toISOString());
      processAnalyticsData(data, startDate, endDate);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const today = new Date();
      const weekStart = getStartOfWeek(today);
      const monthStart = getStartOfMonth(today);

      const [todayStats, weekStats, monthStats] = await Promise.all([
        getDailyStats(today),
        getAnalytics(weekStart.toISOString(), today.toISOString()),
        getAnalytics(monthStart.toISOString(), today.toISOString()),
      ]);

      setStats({
        today: todayStats || { completed: 0, total: 0, percentage: 0 },
        week: weekStats ? { completed: weekStats.length, total: weekStats.length, percentage: 100 } : { completed: 0, total: 0, percentage: 0 },
        month: monthStats ? { completed: monthStats.length, total: monthStats.length, percentage: 100 } : { completed: 0, total: 0, percentage: 0 },
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadDailyStats = async () => {
    try {
      const today = new Date();
      const dailyAnalytics = await getDailyAnalytics(user.id, today);
      setDailyStats({
        completions: dailyAnalytics.completedCount,
        totalDailyTodos: dailyAnalytics.totalDailyTodos,
        completionRate: dailyAnalytics.completionRate
      });
    } catch (error) {
      console.error('Error loading daily stats:', error);
    }
  };

  const loadStreakData = async () => {
    try {
      const streaks = await getStreakData(user.id);
      setStreakData(streaks.slice(0, 5)); // Top 5 streaks
    } catch (error) {
      console.error('Error loading streak data:', error);
    }
  };

  const processAnalyticsData = (data, startDate, endDate) => {
    if (!data) {
      setAnalyticsData(null);
      return;
    }

    let labels = [];
    let completedCounts = [];

    if (selectedPeriod === 'week') {
      // Generate week days
      const weekDays = getWeekDays(startDate);
      labels = weekDays.map(day => day.toLocaleDateString('en-US', { weekday: 'short' }));
      
      // Count completed tasks per day
      completedCounts = weekDays.map(day => {
        const dayStr = day.toISOString().split('T')[0];
        return data.filter(task => 
          task.completedAt && task.completedAt.split('T')[0] === dayStr
        ).length;
      });
    } else if (selectedPeriod === 'month') {
      // Generate days of month
      const days = generateDateRange(startDate, endDate);
      labels = days.map(day => day.getDate().toString());
      
      completedCounts = days.map(day => {
        const dayStr = day.toISOString().split('T')[0];
        return data.filter(task => 
          task.completedAt && task.completedAt.split('T')[0] === dayStr
        ).length;
      });
    } else {
      // Generate months of year
      labels = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      
      completedCounts = labels.map((_, monthIndex) => {
        return data.filter(task => {
          if (!task.completedAt) return false;
          const taskDate = new Date(task.completedAt);
          return taskDate.getMonth() === monthIndex;
        }).length;
      });
    }

    setAnalyticsData({
      labels,
      datasets: [
        {
          label: 'Completed Tasks',
          data: completedCounts,
          backgroundColor: document.documentElement.classList.contains('dark') 
            ? 'rgba(96, 165, 250, 0.5)' 
            : 'rgba(59, 130, 246, 0.5)',
          borderColor: document.documentElement.classList.contains('dark') 
            ? 'rgb(96, 165, 250)' 
            : 'rgb(59, 130, 246)',
          borderWidth: 2,
        },
      ],
    });
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151',
        },
      },
      title: {
        display: true,
        text: `Tasks Completed - ${periods.find(p => p.key === selectedPeriod)?.label}`,
        color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151',
      },
    },
    scales: {
      x: {
        ticks: {
          color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280',
        },
        grid: {
          color: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb',
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280',
        },
        grid: {
          color: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb',
        },
      },
    },
  };

  // Wait for analytics settings to load first
  if (analyticsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // Show analytics disabled message if analytics is turned off
  if (!analyticsEnabled) {
    return (
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary-600 to-accent-600 rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-primary-100">
            Enable analytics in your settings to view your productivity insights.
          </p>
        </div>

        <AnalyticsDisabled 
          title="Dashboard Analytics Disabled"
          showSettingsLink={true}
        />
      </div>
    );
  }

  // Show loading spinner while analytics data is being fetched
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-accent-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-primary-100">
          Here's your productivity overview for today and beyond.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <CalendarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Today</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.today.completed}/{stats.today.total}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{stats.today.percentage}% complete</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <ChartBarIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">This Week</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.week.completed}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">tasks completed</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <TrophyIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">This Month</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.month.completed}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">tasks completed</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <ArrowPathIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Daily Todos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {dailyStats.completions}/{dailyStats.totalDailyTodos}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{dailyStats.completionRate}% today</p>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Chart */}
      {analyticsEnabled ? (
        <div className="card">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 sm:mb-0">
              Productivity Analytics
            </h2>
            <div className="flex space-x-2">
              {periods.map((period) => (
                <button
                  key={period.key}
                  onClick={() => setSelectedPeriod(period.key)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    selectedPeriod === period.key
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>

          {analyticsData ? (
            <div className="h-80">
              <Bar data={analyticsData} options={chartOptions} />
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <ChartBarIcon className="h-12 w-12 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
                <p>No data available for this period</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <AnalyticsDisabled />
      )}

      {/* Daily Streaks Section */}
      {streakData.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <FireIcon className="h-5 w-5 text-orange-500 mr-2" />
            Daily Streaks
          </h3>
          <div className="space-y-3">
            {streakData.map((streak, index) => (
              <div key={streak.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{streak.title}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {streak.totalCompletions} total completions
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center">
                    <FireIcon className="h-4 w-4 text-orange-500 mr-1" />
                    <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                      {streak.streak}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {streak.lastCompletedDate ? `Last: ${new Date(streak.lastCompletedDate).toLocaleDateString()}` : 'No completions yet'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="space-y-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              const colorClasses = {
                green: 'text-green-600 dark:text-green-400',
                blue: 'text-blue-600 dark:text-blue-400', 
                purple: 'text-purple-600 dark:text-purple-400',
                gray: 'text-gray-600 dark:text-gray-400'
              };
              
              return (
                <button 
                  key={action.id}
                  onClick={action.action}
                  className="w-full flex items-center justify-between p-3 text-left bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                >
                  <div className="flex items-center">
                    <Icon className={`h-5 w-5 ${colorClasses[action.color]} mr-3`} />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{action.title}</span>
                  </div>
                  <span className="text-gray-400 dark:text-gray-500">→</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Daily {dailyTip?.category || 'Tip'}
          </h3>
          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
            {dailyTip && (
              <div className={`p-4 bg-${dailyTip.color}-50 dark:bg-${dailyTip.color}-900/20 rounded-lg border border-${dailyTip.color}-100 dark:border-${dailyTip.color}-800`}>
                <p className={`font-medium text-${dailyTip.color}-900 dark:text-${dailyTip.color}-300 mb-2 flex items-center`}>
                  <span className="text-lg mr-2">{dailyTip.emoji}</span>
                  {dailyTip.title}
                </p>
                <p className={`text-${dailyTip.color}-800 dark:text-${dailyTip.color}-200 leading-relaxed ${dailyTip.isQuote ? 'italic' : ''}`}>
                  {dailyTip.content}
                </p>
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    💡 {dailyTip.isQuote ? 'Quote' : 'Tip'} refreshes daily • Today: {new Date().toLocaleDateString()}
                  </p>
                  <button 
                    onClick={() => setDailyTip(getRandomTip())}
                    className="mt-2 text-xs text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    🔄 Get New {dailyTip.isQuote ? 'Quote' : 'Tip'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
