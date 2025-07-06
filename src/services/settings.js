import { databases, DATABASE_ID, COLLECTIONS } from './appwrite';
import { ID, Query } from 'appwrite';

class SettingsService {
  // Create or update user settings
  async saveUserSettings(userId, settingsData) {
    try {
      // First, try to get existing settings directly without parsing
      const existingSettings = await this.getRawUserSettings(userId);
      
      // Convert settings to JSON strings for storage
      const settingsForStorage = {
        userId,
        notifications: JSON.stringify(settingsData.notifications || {}),
        privacy: JSON.stringify(settingsData.privacy || {}),
        preferences: JSON.stringify(settingsData.preferences || {}),
        updatedAt: new Date().toISOString(),
      };
      
      if (existingSettings) {
        // Update existing settings
        return await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.USER_SETTINGS,
          existingSettings.$id,
          settingsForStorage
        );
      } else {
        // Create new settings
        return await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.USER_SETTINGS,
          ID.unique(),
          {
            ...settingsForStorage,
            createdAt: new Date().toISOString(),
          }
        );
      }
    } catch (error) {
      console.error('Error saving user settings:', error);
      throw error;
    }
  }

  // Get raw user settings without parsing (used internally)
  async getRawUserSettings(userId) {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.USER_SETTINGS,
        [Query.equal('userId', userId)]
      );
      
      return response.documents.length > 0 ? response.documents[0] : null;
    } catch (error) {
      console.error('Error getting raw user settings:', error);
      throw error;
    }
  }

  // Get user settings
  async getUserSettings(userId) {
    try {
      const doc = await this.getRawUserSettings(userId);
      
      if (doc) {
        // Parse JSON strings back to objects with error handling
        try {
          const defaultSettings = this.getDefaultSettings();
          return {
            ...doc,
            notifications: doc.notifications ? JSON.parse(doc.notifications) : defaultSettings.notifications,
            privacy: doc.privacy ? JSON.parse(doc.privacy) : defaultSettings.privacy,
            preferences: doc.preferences ? JSON.parse(doc.preferences) : defaultSettings.preferences,
          };
        } catch (parseError) {
          console.error('Error parsing settings JSON:', parseError);
          // Return default settings if JSON parsing fails
          return this.getDefaultSettings();
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user settings:', error);
      throw error;
    }
  }

  // Get default settings structure
  getDefaultSettings() {
    return {
      notifications: {
        email: true,
        push: false,
        reminders: true,
      },
      privacy: {
        profileVisibility: 'private',
        activityTracking: true, // Analytics enabled by default
      },
      preferences: {
        language: 'en',
        timezone: 'UTC',
        theme: 'system',
      }
    };
  }

  // Update specific setting
  async updateSetting(userId, category, setting, value) {
    try {
      const currentSettings = await this.getUserSettings(userId);
      const defaultSettings = this.getDefaultSettings();
      
      const updatedSettings = {
        ...defaultSettings,
        ...currentSettings,
        [category]: {
          ...(currentSettings?.[category] || defaultSettings[category]),
          [setting]: value
        }
      };

      return await this.saveUserSettings(userId, updatedSettings);
    } catch (error) {
      console.error('Error updating setting:', error);
      throw error;
    }
  }

  // Check if analytics is enabled for user
  async isAnalyticsEnabled(userId) {
    try {
      const settings = await this.getUserSettings(userId);
      // Default to true if no settings found or if privacy settings don't exist
      if (!settings || !settings.privacy) {
        return true;
      }
      return settings.privacy.activityTracking !== false;
    } catch (error) {
      console.error('Error checking analytics status:', error);
      // Default to true on error
      return true;
    }
  }

  // Toggle analytics setting
  async toggleAnalytics(userId, enabled) {
    try {
      return await this.updateSetting(userId, 'privacy', 'activityTracking', enabled);
    } catch (error) {
      console.error('Error toggling analytics:', error);
      throw error;
    }
  }
}

const settingsService = new SettingsService();
export default settingsService;
