import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import settingsService from '../services/settings';

const AnalyticsContext = createContext({});

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};

export const AnalyticsProvider = ({ children }) => {
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Load analytics settings when user changes
  useEffect(() => {
    if (user) {
      checkAnalyticsSettings(user.$id);
    } else {
      // Reset to default when no user
      setAnalyticsEnabled(true);
    }
  }, [user]);

  const checkAnalyticsSettings = async (userId) => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const enabled = await settingsService.isAnalyticsEnabled(userId);
      setAnalyticsEnabled(enabled);
    } catch (error) {
      console.error('Error checking analytics settings:', error);
      // Default to enabled on error
      setAnalyticsEnabled(true);
    } finally {
      setLoading(false);
    }
  };

  const refreshAnalyticsSettings = () => {
    if (user) {
      checkAnalyticsSettings(user.$id);
    }
  };

  // Analytics tracking methods that respect the user's setting
  const trackEvent = (eventName, eventData = {}) => {
    if (!analyticsEnabled) {
      console.log('Analytics disabled, not tracking event:', eventName);
      return;
    }
    
    // Only track if analytics is enabled
    console.log('Analytics Event:', eventName, eventData);
    // Here you would implement actual analytics tracking
    // e.g., Google Analytics, Mixpanel, etc.
  };

  const trackPageView = (pageName) => {
    if (!analyticsEnabled) {
      console.log('Analytics disabled, not tracking page view:', pageName);
      return;
    }
    
    console.log('Analytics Page View:', pageName);
    // Implement page view tracking
  };

  const trackUserAction = (action, details = {}) => {
    if (!analyticsEnabled) {
      console.log('Analytics disabled, not tracking user action:', action);
      return;
    }
    
    console.log('Analytics User Action:', action, details);
    // Implement user action tracking
  };

  const value = {
    analyticsEnabled,
    loading,
    refreshAnalyticsSettings,
    trackEvent,
    trackPageView,
    trackUserAction,
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export default AnalyticsProvider;
