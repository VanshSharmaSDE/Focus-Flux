import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import settingsService from '../services/settings';

export const useAnalyticsSettings = () => {
  const { user } = useAuth();
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true); // Default to true
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkAnalyticsSettings();
    } else {
      setLoading(false);
    }
  }, [user]);

  const checkAnalyticsSettings = async () => {
    try {
      setLoading(true);
      const enabled = await settingsService.isAnalyticsEnabled(user.$id);
      setAnalyticsEnabled(enabled);
    } catch (error) {
      console.error('Error checking analytics settings:', error);
      // Default to true on error
      setAnalyticsEnabled(true);
    } finally {
      setLoading(false);
    }
  };

  const refreshSettings = () => {
    if (user) {
      checkAnalyticsSettings();
    }
  };

  return {
    analyticsEnabled,
    loading,
    refreshSettings
  };
};
