import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTodos } from '../../context/TodoContext';
import { useAnalyticsTracking } from '../../utils/analytics';
import { 
  PlusIcon, 
  FunnelIcon, 
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import TodoItem from '../../components/dashboard/TodoItem';
import TodoModal from '../../components/dashboard/TodoModal';
import TodoFilters from '../../components/dashboard/TodoFilters';

const Todos = () => {
  const { todos, loading, filters, setFilters } = useTodos();
  const { trackEvent, trackPageView, analyticsEnabled } = useAnalyticsTracking();
  const location = useLocation();
  const [showModal, setShowModal] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Handle navigation state (auto-open modal when navigating from dashboard)
  useEffect(() => {
    if (location.state?.openModal) {
      setEditingTodo(null);
      setShowModal(true);
      // Clear the state after using it
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Track page view when component mounts
  useEffect(() => {
    trackPageView('Todos');
  }, [trackPageView]);

  const handleCreateTodo = () => {
    setEditingTodo(null);
    setShowModal(true);
  };

  const handleEditTodo = (todo) => {
    setEditingTodo(todo);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTodo(null);
  };

  // Filter todos based on search
  const filteredTodos = todos.filter(todo => {
    if (filters.search) {
      return todo.title.toLowerCase().includes(filters.search.toLowerCase()) ||
             todo.description?.toLowerCase().includes(filters.search.toLowerCase());
    }
    return true;
  });

  // Group todos
  const completedTodos = filteredTodos.filter(todo => todo.completed);
  const pendingTodos = filteredTodos.filter(todo => !todo.completed);

  const getStats = () => {
    const total = todos.length;
    const completed = todos.filter(todo => todo.completed).length;
    const pending = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, pending, completionRate };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Todos</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your tasks and track your progress
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={handleCreateTodo}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            New Todo
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg transition-colors duration-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-gray-400 dark:text-gray-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Tasks</dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">{stats.total}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg transition-colors duration-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Completed</dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">{stats.completed}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg transition-colors duration-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Pending</dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">{stats.pending}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg transition-colors duration-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-primary-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Completion Rate</dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">{stats.completionRate}%</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg transition-colors duration-200">
        <div className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="text"
                  placeholder="Search todos..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors duration-200"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
            >
              <FunnelIcon className="-ml-1 mr-2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              Filters
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
              <TodoFilters />
            </div>
          )}
        </div>
      </div>

      {/* Todo Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Todos */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg transition-colors duration-200">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
              Pending Tasks ({pendingTodos.length})
            </h3>
            
            {pendingTodos.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircleIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No pending tasks</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Great job! You've completed all your tasks.
                </p>
                <div className="mt-6">
                  <button
                    onClick={handleCreateTodo}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                    Add New Task
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingTodos.map((todo) => (
                  <TodoItem
                    key={todo.$id}
                    todo={todo}
                    onEdit={handleEditTodo}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Completed Todos */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg transition-colors duration-200">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
              Completed Tasks ({completedTodos.length})
            </h3>
            
            {completedTodos.length === 0 ? (
              <div className="text-center py-8">
                <ClockIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No completed tasks yet</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Complete some tasks to see them here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {completedTodos.map((todo) => (
                  <TodoItem
                    key={todo.$id}
                    todo={todo}
                    onEdit={handleEditTodo}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Todo Modal */}
      {showModal && (
        <TodoModal
          todo={editingTodo}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default Todos;
