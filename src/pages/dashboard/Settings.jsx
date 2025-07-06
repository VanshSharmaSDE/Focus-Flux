import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { 
  BellIcon,
  ShieldCheckIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  GlobeAltIcon,
  TrashIcon,
  ArrowRightOnRectangleIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import settingsService from '../../services/settings';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAnalytics } from '../../context/AnalyticsContext';
import NotificationDebugger from '../../components/common/NotificationDebugger';

const Settings = () => {
  const { user, logout, deleteAccount } = useAuth();
  const { theme, setTheme } = useTheme();
  const { refreshAnalyticsSettings, analyticsEnabled } = useAnalytics();
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const dropdownRef = useRef(null);
  const [settings, setSettings] = useState(null);

  const themeOptions = [
    { 
      value: 'light', 
      label: 'Light', 
      icon: SunIcon,
      description: 'Light theme'
    },
    { 
      value: 'dark', 
      label: 'Dark', 
      icon: MoonIcon,
      description: 'Dark theme'
    },
    { 
      value: 'system', 
      label: 'System', 
      icon: ComputerDesktopIcon,
      description: 'System preference'
    }
  ];

  const getCurrentThemeOption = () => {
    return themeOptions.find(option => option.value === theme) || themeOptions[0];
  };

  // Load user settings on component mount
  useEffect(() => {
    loadUserSettings();
  }, [user]);

  const loadUserSettings = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const userSettings = await settingsService.getUserSettings(user.$id);
      
      if (userSettings) {
        setSettings(userSettings);
      } else {
        // Use default settings if none exist
        const defaultSettings = settingsService.getDefaultSettings();
        setSettings(defaultSettings);
        // Save default settings to database
        await settingsService.saveUserSettings(user.$id, defaultSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      // Use default settings on error
      setSettings(settingsService.getDefaultSettings());
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowThemeDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const handleSettingChange = async (category, setting, value) => {
    if (!user || !settings) return;
    
    try {
      setSaving(true);
      
      // Update local state immediately (optimistic update)
      const updatedSettings = {
        ...settings,
        [category]: {
          ...settings[category],
          [setting]: value
        }
      };
      setSettings(updatedSettings);
      
      // Save to database
      await settingsService.updateSetting(user.$id, category, setting, value);
      
      // Special handling for analytics setting
      if (category === 'privacy' && setting === 'activityTracking') {
        // Refresh analytics settings across the app
        refreshAnalyticsSettings();
        toast.success(
          value 
            ? '🔍 Analytics enabled - We can now track usage to improve your experience' 
            : '🚫 Analytics disabled - No data will be collected or tracked'
        );
      } else {
        toast.success('Setting updated');
      }
    } catch (error) {
      console.error('Error updating setting:', error);
      // Rollback optimistic update
      loadUserSettings();
      toast.error('Failed to update setting');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setSaving(true);
      
      // Show confirmation and get final consent
      const confirmed = window.confirm(
        'FINAL CONFIRMATION: This will permanently delete your account and ALL your data. This action cannot be undone. Type "DELETE" in the next prompt to confirm.'
      );
      
      if (!confirmed) {
        setShowDeleteModal(false);
        return;
      }
      
      // Extra confirmation step
      const confirmText = prompt(
        'To confirm deletion, please type "DELETE" (all caps):'
      );
      
      if (confirmText !== 'DELETE') {
        toast.error('Account deletion cancelled - confirmation text did not match');
        setShowDeleteModal(false);
        return;
      }
      
      // Proceed with deletion
      toast.loading('Deleting account...', { id: 'delete-account' });
      
      const result = await deleteAccount();
      
      if (result.success) {
        toast.success('Account successfully deleted', { id: 'delete-account' });
        // User will be automatically redirected since auth state will change
        navigate('/');
      } else {
        throw new Error(result.error || 'Account deletion failed');
      }
      
    } catch (error) {
      console.error('Account deletion error:', error);
      toast.error(error.message || 'Failed to delete account', { id: 'delete-account' });
    } finally {
      setSaving(false);
      setShowDeleteModal(false);
    }
  };

  const handleTestNotification = async () => {
    // Show loading toast
    toast.loading('Sending test notification...', { id: 'test-notification' });
    
    try {
      // Import directly to ensure we have the latest implementation
      const notificationService = (await import('../../services/notifications')).default;
      
      // Log notification state
      console.log('Current notification state:', {
        supported: 'Notification' in window,
        permission: 'Notification' in window ? Notification.permission : 'unsupported'
      });
      
      // Try to send notification using the direct implementation
      const result = await notificationService.showImmediateTestNotification();
      
      if (result) {
        toast.success('Test notification sent! Check your notifications.', {
          id: 'test-notification',
          duration: 4000,
          icon: '📬',
        });
      } else {
        toast.error('Could not send notification. Please check browser permissions.', {
          id: 'test-notification',
          duration: 4000,
        });
      }
    } catch (error) {
      console.error('Test notification error:', error);
      toast.error(`Notification error: ${error.message || 'Unknown error'}`, {
        id: 'test-notification',
        duration: 4000,
      });
    }
  };

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="large" />
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg transition-colors duration-200">
            <div className="px-4 py-5 sm:p-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Manage your account settings and preferences
              </p>
            </div>
          </div>

      {/* Notifications */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg transition-colors duration-200">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center mb-4">
            <BellIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2" />
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Notifications
            </h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="email-notifications" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email Notifications
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Receive notifications via email</p>
              </div>
              <button
                onClick={() => handleSettingChange('notifications', 'email', !settings.notifications.email)}
                className={`${
                  settings.notifications.email ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'
                } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
              >
                <span
                  className={`${
                    settings.notifications.email ? 'translate-x-5' : 'translate-x-0'
                  } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                />
              </button>
            </div>

            {/* <div className="flex items-center justify-between">
              <div>
                <label htmlFor="push-notifications" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Push Notifications
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Receive push notifications in browser</p>
              </div>
              <button
                onClick={() => handleSettingChange('notifications', 'push', !settings.notifications.push)}
                className={`${
                  settings.notifications.push ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'
                } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
              >
                <span
                  className={`${
                    settings.notifications.push ? 'translate-x-5' : 'translate-x-0'
                  } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                />
              </button>
            </div> */}

            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="reminders" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Task Reminders
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Get reminded about due tasks</p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => handleTestNotification()}
                  className="text-xs px-3 py-1.5 flex items-center gap-1 bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 rounded border border-primary-200 dark:border-primary-800 hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors duration-200"
                >
                  <BellIcon className="h-3.5 w-3.5" /> Test Notification
                </button>
                <button
                  onClick={() => handleSettingChange('notifications', 'reminders', !settings.notifications.reminders)}
                  className={`${
                    settings.notifications.reminders ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'
                  } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
                >
                  <span
                    className={`${
                      settings.notifications.reminders ? 'translate-x-5' : 'translate-x-0'
                    } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add notification debugger */}
      {settings?.notifications?.reminders && <NotificationDebugger />}

      {/* Privacy & Security */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg transition-colors duration-200">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center mb-4">
            <ShieldCheckIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2" />
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Privacy & Security
            </h3>
            {!analyticsEnabled && (
              <span className="ml-3 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">
                <span className="w-1.5 h-1.5 bg-green-600 dark:bg-green-400 rounded-full mr-1"></span>
                Privacy Mode Active
              </span>
            )}
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="profile-visibility" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Profile Visibility
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Who can see your profile</p>
              </div>
              <select
                value={settings.privacy.profileVisibility}
                onChange={(e) => handleSettingChange('privacy', 'profileVisibility', e.target.value)}
                className="text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
              >
                <option value="private">Private</option>
                <option value="public">Public</option>
                <option value="friends">Friends Only</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center">
                  <label htmlFor="activity-tracking" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Activity Tracking
                  </label>
                  {!analyticsEnabled && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800">
                      <span className="w-1.5 h-1.5 bg-red-600 dark:bg-red-400 rounded-full mr-1"></span>
                      Disabled
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {analyticsEnabled 
                    ? 'Allow analytics and activity tracking'
                    : 'Analytics and activity tracking is currently disabled. No data will be collected.'
                  }
                </p>
              </div>
              <button
                onClick={() => handleSettingChange('privacy', 'activityTracking', !settings.privacy.activityTracking)}
                className={`${
                  settings.privacy.activityTracking ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'
                } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                  !analyticsEnabled ? 'opacity-75' : ''
                }`}
                title={analyticsEnabled ? 'Analytics enabled' : 'Analytics disabled'}
              >
                <span
                  className={`${
                    settings.privacy.activityTracking ? 'translate-x-5' : 'translate-x-0'
                  } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg transition-colors duration-200">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center mb-4">
            <GlobeAltIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2" />
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Preferences
            </h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="theme" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Theme
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Choose your preferred theme</p>
              </div>
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowThemeDropdown(!showThemeDropdown)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
                >
                  {React.createElement(getCurrentThemeOption().icon, { className: "h-4 w-4 mr-2" })}
                  {getCurrentThemeOption().label}
                  <ChevronDownIcon className="ml-2 h-4 w-4" />
                </button>
                
                {showThemeDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                    <div className="py-1">
                      {themeOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setTheme(option.value);
                            setShowThemeDropdown(false);
                            toast.success(`Theme changed to ${option.label}`);
                          }}
                          className={`${
                            theme === option.value 
                              ? 'bg-primary-50 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300' 
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                          } group flex items-center w-full px-4 py-2 text-sm transition-colors duration-200`}
                        >
                          {React.createElement(option.icon, { className: "h-4 w-4 mr-3" })}
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{option.label}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{option.description}</span>
                          </div>
                          {theme === option.value && (
                            <div className="ml-auto w-2 h-2 bg-primary-600 dark:bg-primary-400 rounded-full"></div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* <div className="flex items-center justify-between">
              <div>
                <label htmlFor="language" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Language
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Select your preferred language</p>
              </div>
              <select
                value={settings.preferences.language}
                onChange={(e) => handleSettingChange('preferences', 'language', e.target.value)}
                className="text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div> */}

            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="timezone" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Timezone
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Your local timezone</p>
              </div>
              <select
                value={settings.preferences.timezone}
                onChange={(e) => handleSettingChange('preferences', 'timezone', e.target.value)}
                className="text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
              >
                <option value="UTC">UTC</option>
                {/* <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option> */}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg transition-colors duration-200">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
            Account Actions
          </h3>
          
          <div className="space-y-4">
            <button
              onClick={handleLogout}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
            >
              <ArrowRightOnRectangleIcon className="-ml-1 mr-2 h-5 w-5" />
              Sign Out
            </button>

            <button
              onClick={() => !saving && setShowDeleteModal(true)}
              disabled={saving}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-red-300 dark:border-red-600 rounded-md shadow-sm text-sm font-medium text-red-700 dark:text-red-400 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <TrashIcon className="-ml-1 mr-2 h-5 w-5" />
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 transition-opacity" />
            
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 sm:mx-0 sm:h-10 sm:w-10">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      Delete Account - Permanent Action
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                        This action will permanently delete your account and <strong>cannot be undone</strong>. 
                        All of the following data will be permanently lost:
                      </p>
                      <ul className="text-sm text-gray-500 dark:text-gray-400 list-disc list-inside space-y-1 mb-3">
                        <li>Your profile and account information</li>
                        <li>All todos and tasks</li>
                        <li>Daily plans and completions</li>
                        <li>Settings and preferences</li>
                        <li>Friend connections and messages</li>
                        <li>All feedback and activity history</li>
                      </ul>
                      <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                        This data cannot be recovered after deletion.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse transition-colors duration-200">
                <button
                  onClick={handleDeleteAccount}
                  disabled={saving}
                  className="w-full inline-flex justify-center items-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Deleting...
                    </>
                  ) : (
                    'Delete My Account Permanently'
                  )}
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default Settings;
