import { account, databases, DATABASE_ID, COLLECTIONS } from './appwrite';
import { ID, Query } from 'appwrite';

class RecoveryService {
  // Get user profile
  async getUserProfile(userId) {
    try {
      return await databases.getDocument(DATABASE_ID, COLLECTIONS.USERS, userId);
    } catch (error) {
      throw error;
    }
  }

  // Update user profile
  async updateUserProfile(userId, data) {
    try {
      return await databases.updateDocument(DATABASE_ID, COLLECTIONS.USERS, userId, data);
    } catch (error) {
      throw error;
    }
  }

  // Check if email has a deleted account that can be restored - with case-insensitive search
  async checkEmailExists(email) {
    try {
      const trimmedEmail = email.trim();
      console.log(`Checking if email exists: ${trimmedEmail}`);
      
      // Find account by exact email match (case sensitive first)
      let response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.USERS,
        [Query.equal('email', trimmedEmail)]
      );
      
      // If not found with exact case, try case-insensitive search
      if (response.documents.length === 0) {
        console.log(`No exact match found, trying case-insensitive search for: ${trimmedEmail}`);
        
        // Get all users and filter manually for case-insensitive match
        const allUsers = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.USERS,
          [], // No query filters
          100 // Reasonable limit
        );
        
        // Filter manually for case-insensitive email match
        const matchingUsers = allUsers.documents.filter(user => 
          user.email && user.email.toLowerCase() === trimmedEmail.toLowerCase()
        );
        
        if (matchingUsers.length > 0) {
          response.documents = matchingUsers;
        }
      }
      
      if (response.documents.length > 0) {
        const profile = response.documents[0];
        console.log(`Email found in database: ${profile.email} (search: ${trimmedEmail})`);
        console.log(`Account isDeleted: ${profile.isDeleted}`);
        return {
          exists: true,
          isDeleted: profile.isDeleted === true,
          userId: profile.$id,
          profile: profile
        };
      }
      
      console.log(`Email not found in database: ${trimmedEmail}`);
      return {
        exists: false,
        isDeleted: false
      };
      
    } catch (error) {
      console.error('Error checking email existence:', error);
      throw new Error('Failed to check email existence. Please try again.');
    }
  }

  // No longer need to check Appwrite blocked status - only use isDeleted flag

  // Simple restoration flow - only check isDeleted flag, don't touch Appwrite auth at all
  async restoreAccountByEmail(email) {
    try {
      console.log('Starting simple account restoration process for:', email);

      // Check if email exists and is deleted
      const emailCheck = await this.checkEmailExists(email);
      
      if (!emailCheck.exists) {
        return {
          success: false,
          message: 'No account found with this email address. Please sign up to create a new account.',
          reason: 'email_not_found'
        };
      }

      // We only check if account is marked as deleted in our DB
      if (!emailCheck.isDeleted) {
        return {
          success: false,
          message: 'Your account is not deleted. Please try logging in normally.',
          reason: 'account_not_deleted',
          userId: emailCheck.userId
        };
      }

      // Account exists and is deleted - simply restore it by setting isDeleted = false
      console.log('Found deleted account, restoring:', emailCheck.userId);
      
      // Step 1: Simply mark account as not deleted - DON'T touch Appwrite auth at all
      const indianTime = new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"});
      const restoredAtISO = new Date(indianTime).toISOString();
      
      await this.updateUserProfile(emailCheck.userId, {
        isDeleted: false,  // Mark as not deleted
        deletedAt: "",     // Clear deletion timestamp  
        restoredAt: restoredAtISO, // Add restoration timestamp
        updatedAt: restoredAtISO
      });

      console.log('Account restored successfully in database (isDeleted set to false)');
      
      return {
        success: true,
        message: 'Account restored successfully! You can now log in with your original email and password.',
        email: email,
        userId: emailCheck.userId,
        canLoginNow: true
      };

    } catch (error) {
      console.error('Restore account error:', error);
      return {
        success: false,
        message: error.message || 'Failed to restore account. Please try again.'
      };
    }
  }

  // No longer need complex email verification for restoration
}

const recoveryService = new RecoveryService();
export default recoveryService;
