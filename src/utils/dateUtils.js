// Date formatting utilities
export const formatDate = (date, options = {}) => {
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  };
  
  return new Date(date).toLocaleDateString('en-US', defaultOptions);
};

export const formatDateTime = (date) => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatRelativeTime = (date) => {
  const now = new Date();
  const target = new Date(date);
  const diffInSeconds = Math.floor((now - target) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  } else {
    return formatDate(date);
  }
};

// Get start and end of day
export const getStartOfDay = (date = new Date()) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
};

export const getEndOfDay = (date = new Date()) => {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
};

// Get start and end of week
export const getStartOfWeek = (date = new Date()) => {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day;
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  return start;
};

export const getEndOfWeek = (date = new Date()) => {
  const end = new Date(date);
  const day = end.getDay();
  const diff = end.getDate() - day + 6;
  end.setDate(diff);
  end.setHours(23, 59, 59, 999);
  return end;
};

// Get start and end of month
export const getStartOfMonth = (date = new Date()) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  return start;
};

export const getEndOfMonth = (date = new Date()) => {
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  return end;
};

// Get start and end of year
export const getStartOfYear = (date = new Date()) => {
  const start = new Date(date.getFullYear(), 0, 1);
  start.setHours(0, 0, 0, 0);
  return start;
};

export const getEndOfYear = (date = new Date()) => {
  const end = new Date(date.getFullYear(), 11, 31);
  end.setHours(23, 59, 59, 999);
  return end;
};

// Get days in month
export const getDaysInMonth = (year, month) => {
  return new Date(year, month + 1, 0).getDate();
};

// Get week days
export const getWeekDays = (startDate) => {
  const days = [];
  const start = new Date(startDate);
  
  for (let i = 0; i < 7; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    days.push(day);
  }
  
  return days;
};

// Check if date is today
export const isToday = (date) => {
  const today = new Date();
  const target = new Date(date);
  
  return today.getDate() === target.getDate() &&
         today.getMonth() === target.getMonth() &&
         today.getFullYear() === target.getFullYear();
};

// Check if date is tomorrow
export const isTomorrow = (date) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const target = new Date(date);
  
  return tomorrow.getDate() === target.getDate() &&
         tomorrow.getMonth() === target.getMonth() &&
         tomorrow.getFullYear() === target.getFullYear();
};

// Check if date is overdue
export const isOverdue = (date) => {
  const today = new Date();
  const target = new Date(date);
  
  return target < today && !isToday(date);
};

// Generate date range array
export const generateDateRange = (startDate, endDate) => {
  const dates = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
};
