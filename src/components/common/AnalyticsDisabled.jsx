import React from 'react';
import { Link } from 'react-router-dom';
import { ChartBarIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

const AnalyticsDisabled = ({ title = "Analytics Disabled", showSettingsLink = true }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 border-dashed border-gray-200 dark:border-gray-600 p-8 text-center">
      <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-6">
        <ChartBarIcon className="h-10 w-10 text-blue-600 dark:text-blue-400" />
      </div>
      
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
        {title}
      </h3>
      
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto leading-relaxed">
        📊 Analytics and activity tracking are currently disabled. Turn them on to unlock:
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-sm">
        <div className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <span className="text-2xl mb-2">📈</span>
          <span className="font-medium text-gray-900 dark:text-white">Progress Charts</span>
          <span className="text-gray-500 dark:text-gray-400 text-xs">Visual task completion</span>
        </div>
        <div className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <span className="text-2xl mb-2">🎯</span>
          <span className="font-medium text-gray-900 dark:text-white">Goal Tracking</span>
          <span className="text-gray-500 dark:text-gray-400 text-xs">Daily achievements</span>
        </div>
        <div className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <span className="text-2xl mb-2">🔍</span>
          <span className="font-medium text-gray-900 dark:text-white">Insights</span>
          <span className="text-gray-500 dark:text-gray-400 text-xs">Productivity patterns</span>
        </div>
      </div>
      
      {showSettingsLink && (
        <Link
          to="/dashboard/settings"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <Cog6ToothIcon className="h-5 w-5 mr-2" />
          Enable Analytics in Settings
        </Link>
      )}
    </div>
  );
};

export default AnalyticsDisabled;
