import { storage } from './appwrite';
import { ID, Permission, Role } from 'appwrite';

// Storage bucket for profile pictures - support multiple env var names for backward compatibility
const PROFILE_PICTURE_BUCKET_ID = import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID || 
                                 import.meta.env.VITE_APPWRITE_PROFILE_PICTURES_BUCKET_ID || 
                                 'profilepicture';

// Log the bucket ID being used for debugging
console.log('Using profile picture bucket ID:', PROFILE_PICTURE_BUCKET_ID);

class StorageService {
  /**
   * Upload a profile picture to Appwrite Storage
   * @param {File} file - The image file to upload
   * @param {string} userId - The user ID to associate with the image
   * @returns {Promise<Object>} - The uploaded file data
   */
  async uploadProfilePicture(file, userId) {
    try {
      // Create a unique ID based on the user ID and current timestamp to ensure uniqueness
      const fileId = `${userId}_${Date.now()}`;
      
      // Upload the file to the storage bucket with public read permissions
      const result = await storage.createFile(
        PROFILE_PICTURE_BUCKET_ID,
        fileId,
        file,
        [
          Permission.read(Role.any()) // Make the file publicly accessible
        ]
      );
      
      console.log('File uploaded with public permissions:', result);
      
      // Return the file data
      return result;
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      throw error;
    }
  }

  /**
   * Delete a profile picture from Appwrite Storage
   * @param {string} fileId - The ID of the file to delete
   * @returns {Promise<void>}
   */
  async deleteProfilePicture(fileId) {
    try {
      await storage.deleteFile(PROFILE_PICTURE_BUCKET_ID, fileId);
    } catch (error) {
      console.error('Error deleting profile picture:', error);
      throw error;
    }
  }

  /**
   * Get the view URL for a profile picture without any transformations
   * @param {string} fileId - The ID of the file
   * @returns {string} - The file view URL
   */
  getProfilePictureUrl(fileId) {
    if (!fileId) {
      console.log('No fileId provided to getProfilePictureUrl');
      return null;
    }
    
    try {
      console.log('Getting profile picture URL for fileId:', fileId);
      
      // Get the direct file view URL without any transformations
      // This works on all Appwrite plans including free tier
      const url = storage.getFileView(
        PROFILE_PICTURE_BUCKET_ID,
        fileId
      );
      
      console.log('Generated profile picture URL:', url);
      return url;
    } catch (error) {
      console.error('Error generating profile picture URL:', error);
      return null;
    }
  }

  /**
   * Update file permissions to make a file public
   * Useful for making existing files accessible without authentication
   * @param {string} fileId - The ID of the file to update permissions for
   * @returns {Promise<Object>} - The updated file data
   */
  async makeFilePublic(fileId) {
    try {
      if (!fileId) {
        console.warn('No fileId provided to makeFilePublic');
        return null;
      }
      
      console.log('Making file public, fileId:', fileId);
      
      const result = await storage.updateFile(
        PROFILE_PICTURE_BUCKET_ID,
        fileId,
        [
          Permission.read(Role.any()) // Make the file publicly accessible
        ]
      );
      
      console.log('File permissions updated to public:', result);
      return result;
    } catch (error) {
      console.error('Error updating file permissions:', error);
      throw error;
    }
  }

  /**
   * Check if a file exists and is publicly accessible
   * If not public, attempt to make it public
   * @param {string} fileId - The ID of the file to check
   * @returns {Promise<boolean>} - Whether the file is publicly accessible
   */
  async ensureFileIsPublic(fileId) {
    if (!fileId) {
      console.log('No fileId provided to ensureFileIsPublic');
      return false;
    }
    
    try {
      // Try to get the file to see if it exists
      const fileInfo = await storage.getFile(PROFILE_PICTURE_BUCKET_ID, fileId);
      console.log('File exists:', fileInfo);
      
      // Check if file permissions include public read access
      let isPublic = false;
      
      if (fileInfo.$permissions && Array.isArray(fileInfo.$permissions)) {
        isPublic = fileInfo.$permissions.some(permission => 
          permission.includes('read("any")')
        );
      }
      
      // If not public, make it public
      if (!isPublic) {
        console.log('File is not public, updating permissions...');
        await this.makeFilePublic(fileId);
        return true;
      } else {
        console.log('File is already public');
        return true;
      }
    } catch (error) {
      console.error('Error checking file access:', error);
      return false;
    }
  }
}

const storageService = new StorageService();
export default storageService;
