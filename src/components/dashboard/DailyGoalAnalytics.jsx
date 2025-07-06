import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
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
  ArcElement,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import dailyGoalService from '../../services/dailyGoal';
import LoadingSpinner from '../common/LoadingSpinner';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const DailyGoalAnalytics = ({ isOpen = true, onClose, userId }) => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7days');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [userStats, setUserStats] = useState(null);

  const timeRanges = [
    { value: '7days', label: 'Last 7 Days' },
    { value: '30days', label: 'Last 30 Days' },
    { value: '90days', label: 'Last 90 Days' },
  ];

  useEffect(() => {
    if (userId) {
      loadAnalytics();
    }
  }, [userId, timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      const days = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 90;
      startDate.setDate(startDate.getDate() - days);
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      // Load range analytics and user stats
      const [rangeData, stats] = await Promise.all([
        dailyGoalService.getRangeAnalytics(userId, startDateStr, endDateStr),
        dailyGoalService.getUserStats(userId)
      ]);
      
      setAnalyticsData(rangeData);
      setUserStats(stats);
      
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateChartData = () => {
    if (!analyticsData || analyticsData.length === 0) return null;

    // Generate date range for the chart
    const endDate = new Date();
    const startDate = new Date();
    const days = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 90;
    startDate.setDate(startDate.getDate() - days);

    const dates = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Map analytics data to chart data
    const completionData = dates.map(date => {
      const dayData = analyticsData.find(d => d.date === date);
      return dayData ? dayData.completionPercentage : 0;
    });

    const taskData = dates.map(date => {
      const dayData = analyticsData.find(d => d.date === date);
      return dayData ? dayData.totalTasks : 0;
    });

    return {
      labels: dates.map(date => {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      }),
      datasets: [
        {
          label: 'Completion %',
          data: completionData,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          tension: 0.4,
        },
        {
          label: 'Total Tasks',
          data: taskData,
          backgroundColor: 'rgba(16, 185, 129, 0.6)',
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 1,
          type: 'bar',
          yAxisID: 'y1',
        },
      ],
    };
  };

  const generateTagAnalytics = () => {
    if (!analyticsData || analyticsData.length === 0) return null;

    const tagStats = {};
    
    analyticsData.forEach(dayData => {
      dayData.tasks.forEach(task => {
        if (task.tag) {
          if (!tagStats[task.tag]) {
            tagStats[task.tag] = { total: 0, completed: 0, color: task.tagColor || '#6B7280' };
          }
          tagStats[task.tag].total++;
          if (task.completed) {
            tagStats[task.tag].completed++;
          }
        }
      });
    });

    const tagEntries = Object.entries(tagStats);
    if (tagEntries.length === 0) return null;

    return {
      labels: tagEntries.map(([tag]) => tag),
      datasets: [
        {
          label: 'Tasks Completed',
          data: tagEntries.map(([, stats]) => stats.completed),
          backgroundColor: tagEntries.map(([, stats]) => stats.color),
          borderColor: tagEntries.map(([, stats]) => stats.color),
          borderWidth: 1,
        },
      ],
    };
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
        text: 'Daily Goal Completion Trends',
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
        type: 'linear',
        display: true,
        position: 'left',
        beginAtZero: true,
        max: 100,
        ticks: {
          color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280',
          callback: function(value) {
            return value + '%';
          },
        },
        grid: {
          color: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb',
        },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        beginAtZero: true,
        ticks: {
          color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151',
        },
      },
      title: {
        display: true,
        text: 'Completion by Category',
        color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151',
      },
    },
  };

  if (!isOpen) return null;

  // Render content without modal wrapper if no onClose function (used as tab content)
  const renderContent = () => (
    <div className="space-y-6">
      {/* Header - only show if not in modal */}
      {!onClose && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Analytics Dashboard
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Track your daily goal performance and trends
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="large" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Time Range Selector */}
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              {timeRanges.map(range => (
                <button
                  key={range.value}
                  onClick={() => setTimeRange(range.value)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    timeRange === range.value
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stats Cards */}
          {userStats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {userStats.totalPlans}
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-400">
                  Total Plans
                </div>
              </div>
              
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {userStats.overallCompletionRate}%
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">
                  Overall Completion
                </div>
              </div>
              
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {userStats.currentStreak}
                </div>
                <div className="text-sm text-purple-600 dark:text-purple-400">
                  Current Streak
                </div>
              </div>
              
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {userStats.averageTasksPerDay}
                </div>
                <div className="text-sm text-orange-600 dark:text-orange-400">
                  Avg Tasks/Day
                </div>
              </div>
            </div>
          )}

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Completion Trends */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              {generateChartData() ? (
                <Bar data={generateChartData()} options={chartOptions} />
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No data available for the selected time range
                </div>
              )}
            </div>

            {/* Tag Analytics */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              {generateTagAnalytics() ? (
                <Doughnut data={generateTagAnalytics()} options={doughnutOptions} />
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No tag data available
                </div>
              )}
            </div>
          </div>

          {/* Recent Performance */}
          {analyticsData && analyticsData.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
                Recent Performance
              </h4>
              <div className="space-y-2">
                {analyticsData.slice(0, 7).map((dayData, index) => (
                  <div key={dayData.date} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                    <div className="flex items-center space-x-3">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(dayData.date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {dayData.planTitle}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {dayData.completedTasks}/{dayData.totalTasks}
                      </div>
                      <div className={`text-sm font-medium ${
                        dayData.completionPercentage >= 80 ? 'text-green-600' :
                        dayData.completionPercentage >= 50 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {dayData.completionPercentage}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // If onClose is provided, render as modal
  if (onClose) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />
          
          <div className="inline-block w-full max-w-6xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Daily Goals Analytics
              </h3>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            {renderContent()}
          </div>
        </div>
      </div>
    );
  }

  // Otherwise render as regular content
  return renderContent();
};

export default DailyGoalAnalytics;
