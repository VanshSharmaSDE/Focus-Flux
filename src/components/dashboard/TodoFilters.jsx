import React from 'react';
import { useTodos } from '../../context/TodoContext';
import { XMarkIcon } from '@heroicons/react/24/outline';

const TodoFilters = () => {
  const { filters, setFilters } = useTodos();

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      completed: undefined,
      priority: '',
      search: '',
    });
  };

  const hasActiveFilters = filters.completed !== undefined || filters.priority || filters.search;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Filters</h4>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Status Filter */}
        <div>
          <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Status
          </label>
          <select
            id="status-filter"
            value={filters.completed === undefined ? 'all' : filters.completed ? 'completed' : 'pending'}
            onChange={(e) => {
              const value = e.target.value;
              if (value === 'all') {
                handleFilterChange('completed', undefined);
              } else {
                handleFilterChange('completed', value === 'completed');
              }
            }}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
          >
            <option value="all">All Tasks</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div>
          <label htmlFor="priority-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Priority
          </label>
          <select
            id="priority-filter"
            value={filters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
          >
            <option value="">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Date Filter - Placeholder for future implementation */}
        <div>
          <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Date Range
          </label>
          <select
            id="date-filter"
            disabled
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-600 text-gray-900 dark:text-gray-400 cursor-not-allowed transition-colors duration-200"
          >
            <option>All Dates</option>
            <option>Today</option>
            <option>This Week</option>
            <option>This Month</option>
          </select>
        </div>
      </div>

      {/* Active Filter Tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-2">
          {filters.completed !== undefined && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300">
              {filters.completed ? 'Completed' : 'Pending'}
              <button
                onClick={() => handleFilterChange('completed', undefined)}
                className="ml-1 text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          )}
          
          {filters.priority && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300">
              Priority: {filters.priority}
              <button
                onClick={() => handleFilterChange('priority', '')}
                className="ml-1 text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          )}

          {filters.search && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300">
              Search: "{filters.search}"
              <button
                onClick={() => handleFilterChange('search', '')}
                className="ml-1 text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default TodoFilters;
