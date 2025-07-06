import { 
  getStartOfDay, 
  getEndOfDay, 
  getStartOfWeek, 
  getEndOfWeek,
  getStartOfMonth,
  getEndOfMonth,
  getStartOfYear,
  getEndOfYear,
  generateDateRange,
  formatDate
} from './dateUtils';
import { useAnalytics } from '../context/AnalyticsContext';

export const generateAnalyticsData = (todos, period = 'week') => {
  if (!todos || todos.length === 0) {
    return {
      labels: [],
      datasets: [],
      totalTasks: 0,
      completedTasks: 0,
      completionRate: 0,
      streakDays: 0
    };
  }

  const completedTodos = todos.filter(todo => todo.completed && todo.completedAt);
  
  let startDate, endDate, dateFormat;
  
  switch (period) {
    case 'day':
      startDate = getStartOfDay();
      endDate = getEndOfDay();
      dateFormat = 'HH:mm';
      break;
    case 'week':
      startDate = getStartOfWeek();
      endDate = getEndOfWeek();
      dateFormat = 'EEE';
      break;
    case 'month':
      startDate = getStartOfMonth();
      endDate = getEndOfMonth();
      dateFormat = 'MMM dd';
      break;
    case 'year':
      startDate = getStartOfYear();
      endDate = getEndOfYear();
      dateFormat = 'MMM';
      break;
    default:
      startDate = getStartOfWeek();
      endDate = getEndOfWeek();
      dateFormat = 'EEE';
  }

  // Generate date range
  const dateRange = generateDateRange(startDate, endDate);
  
  // Create labels based on period
  const labels = dateRange.map(date => {
    if (period === 'day') {
      // For daily view, create hourly labels
      const hours = [];
      for (let i = 0; i < 24; i += 2) {
        hours.push(`${i.toString().padStart(2, '0')}:00`);
      }
      return hours;
    } else if (period === 'week') {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else if (period === 'month') {
      return date.getDate().toString();
    } else if (period === 'year') {
      return date.toLocaleDateString('en-US', { month: 'short' });
    }
    return formatDate(date);
  }).flat();

  // Count completed tasks by date
  const completedByDate = {};
  const createdByDate = {};

  completedTodos.forEach(todo => {
    const date = new Date(todo.completedAt);
    let key;
    
    if (period === 'day') {
      key = `${date.getHours().toString().padStart(2, '0')}:00`;
    } else if (period === 'week') {
      key = date.toLocaleDateString('en-US', { weekday: 'short' });
    } else if (period === 'month') {
      key = date.getDate().toString();
    } else if (period === 'year') {
      key = date.toLocaleDateString('en-US', { month: 'short' });
    }

    completedByDate[key] = (completedByDate[key] || 0) + 1;
  });

  // Count created tasks by date
  todos.forEach(todo => {
    const date = new Date(todo.createdAt);
    let key;
    
    if (period === 'day') {
      key = `${date.getHours().toString().padStart(2, '0')}:00`;
    } else if (period === 'week') {
      key = date.toLocaleDateString('en-US', { weekday: 'short' });
    } else if (period === 'month') {
      key = date.getDate().toString();
    } else if (period === 'year') {
      key = date.toLocaleDateString('en-US', { month: 'short' });
    }

    createdByDate[key] = (createdByDate[key] || 0) + 1;
  });

  // Create datasets
  const completedData = labels.map(label => completedByDate[label] || 0);
  const createdData = labels.map(label => createdByDate[label] || 0);

  const datasets = [
    {
      label: 'Completed Tasks',
      data: completedData,
      backgroundColor: 'rgba(34, 197, 94, 0.5)',
      borderColor: 'rgba(34, 197, 94, 1)',
      borderWidth: 2,
      fill: true,
    },
    {
      label: 'Created Tasks',
      data: createdData,
      backgroundColor: 'rgba(59, 130, 246, 0.5)',
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 2,
      fill: false,
    }
  ];

  // Calculate stats
  const totalTasks = todos.length;
  const completedTasks = completedTodos.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  // Calculate streak (consecutive days with completed tasks)
  const streakDays = calculateStreak(completedTodos);

  return {
    labels,
    datasets,
    totalTasks,
    completedTasks,
    completionRate,
    streakDays
  };
};

export const calculateStreak = (completedTodos) => {
  if (!completedTodos || completedTodos.length === 0) return 0;

  // Group todos by date
  const todosByDate = {};
  completedTodos.forEach(todo => {
    const date = new Date(todo.completedAt);
    const dateKey = formatDate(date);
    todosByDate[dateKey] = true;
  });

  // Calculate streak from today backwards
  let streak = 0;
  let currentDate = new Date();
  
  while (true) {
    const dateKey = formatDate(currentDate);
    if (todosByDate[dateKey]) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
};

export const getProductivityInsights = (todos) => {
  if (!todos || todos.length === 0) {
    return {
      insights: [],
      recommendations: []
    };
  }

  const insights = [];
  const recommendations = [];
  
  const completedTodos = todos.filter(todo => todo.completed);
  const pendingTodos = todos.filter(todo => !todo.completed);
  const overdueTodos = pendingTodos.filter(todo => 
    todo.dueDate && new Date(todo.dueDate) < new Date()
  );

  const completionRate = Math.round((completedTodos.length / todos.length) * 100);

  // Completion rate insights
  if (completionRate >= 80) {
    insights.push({
      type: 'success',
      title: 'Excellent Productivity!',
      description: `You've completed ${completionRate}% of your tasks. Keep up the great work!`
    });
  } else if (completionRate >= 60) {
    insights.push({
      type: 'warning',
      title: 'Good Progress',
      description: `You've completed ${completionRate}% of your tasks. You're doing well!`
    });
    recommendations.push('Try breaking down larger tasks into smaller, manageable ones.');
  } else {
    insights.push({
      type: 'info',
      title: 'Room for Improvement',
      description: `You've completed ${completionRate}% of your tasks. Let's boost that productivity!`
    });
    recommendations.push('Consider setting realistic daily goals.');
    recommendations.push('Try the Pomodoro technique for better focus.');
  }

  // Overdue tasks insight
  if (overdueTodos.length > 0) {
    insights.push({
      type: 'warning',
      title: 'Overdue Tasks',
      description: `You have ${overdueTodos.length} overdue task${overdueTodos.length > 1 ? 's' : ''}.`
    });
    recommendations.push('Prioritize overdue tasks to get back on track.');
  }

  // Task priority distribution
  const highPriorityTasks = todos.filter(todo => todo.priority === 'high').length;
  const totalTasks = todos.length;
  
  if (highPriorityTasks / totalTasks > 0.5) {
    insights.push({
      type: 'info',
      title: 'High Priority Focus',
      description: 'Most of your tasks are high priority. Consider if all are truly urgent.'
    });
    recommendations.push('Review task priorities - not everything can be high priority.');
  }

  return { insights, recommendations };
};

export const generatePriorityDistribution = (todos) => {
  if (!todos || todos.length === 0) {
    return {
      labels: [],
      data: [],
      total: 0
    };
  }

  const priorityCounts = {
    high: 0,
    medium: 0,
    low: 0
  };

  todos.forEach(todo => {
    const priority = todo.priority || 'medium';
    priorityCounts[priority]++;
  });

  return {
    labels: ['High Priority', 'Medium Priority', 'Low Priority'],
    data: [priorityCounts.high, priorityCounts.medium, priorityCounts.low],
    backgroundColor: [
      'rgba(239, 68, 68, 0.8)',
      'rgba(245, 158, 11, 0.8)',
      'rgba(34, 197, 94, 0.8)'
    ],
    borderColor: [
      'rgba(239, 68, 68, 1)',
      'rgba(245, 158, 11, 1)',
      'rgba(34, 197, 94, 1)'
    ],
    total: todos.length
  };
};

export const generateCompletionTrend = (todos, days = 30) => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  const dateRange = generateDateRange(startDate, endDate);
  const labels = dateRange.map(date => formatDate(date, { month: 'short', day: 'numeric' }));

  const completionByDate = {};
  
  todos.filter(todo => todo.completed && todo.completedAt).forEach(todo => {
    const date = new Date(todo.completedAt);
    const key = formatDate(date, { month: 'short', day: 'numeric' });
    completionByDate[key] = (completionByDate[key] || 0) + 1;
  });

  const data = labels.map(label => completionByDate[label] || 0);

  return {
    labels,
    data,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 1)',
    borderWidth: 2,
    fill: true
  };
};

// Hook for tracking events in components
export const useAnalyticsTracking = () => {
  const { trackEvent, trackPageView, trackUserAction, analyticsEnabled } = useAnalytics();
  
  return {
    trackEvent,
    trackPageView, 
    trackUserAction,
    analyticsEnabled
  };
};

// Example usage in components:
// const { trackEvent, analyticsEnabled } = useAnalyticsTracking();
// 
// // Track when user creates a todo
// const handleCreateTodo = (todoData) => {
//   trackEvent('todo_created', { 
//     priority: todoData.priority,
//     category: todoData.category 
//   });
// };
//
// // Track page visits
// useEffect(() => {
//   trackPageView('Dashboard');
// }, []);
