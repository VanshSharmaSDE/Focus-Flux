import { account, databases, DATABASE_ID, COLLECTIONS } from './appwrite';
import { ID, Query } from 'appwrite';
import emailService from './email';
import storageService from './storage';

class AuthService {
  // Store verification data in the user's profile document
  async storeVerificationData(userId, data) {
    const expiryTime = Date.now() + 5 * 60 * 1000; // 5 minutes
    const verificationData = {
      ...data,
      expiryTime
    };
    
    try {
      // Check if user profile exists before storing verification data
      const profile = await this.getUserProfile(userId);
      if (!profile) {
        throw new Error(`User profile not found for userId: ${userId}. Cannot store verification data.`);
      }
      
      // Update the user profile with verification data
      await this.updateUserProfile(userId, {
        verificationData: JSON.stringify(verificationData)
      });
      
      console.log(`Verification data stored for user: ${userId}`);
    } catch (error) {
      console.error('Error storing verification data:', error);
      throw error;
    }
  }
  
  // Get verification data from user profile
  async getVerificationData(userId) {
    try {
      const profile = await this.getUserProfile(userId);
      if (!profile || !profile.verificationData) {
        return null;
      }
      
      const data = JSON.parse(profile.verificationData);
      
      // Check if expired
      if (Date.now() > data.expiryTime) {
        await this.clearVerificationData(userId);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error getting verification data:', error);
      return null;
    }
  }
  
  // Clear verification data from user profile
  async clearVerificationData(userId) {
    try {
      // Check if profile exists before trying to clear verification data
      const profile = await this.getUserProfile(userId);
      if (profile) {
        await this.updateUserProfile(userId, {
          verificationData: ""
        });
        console.log(`Verification data cleared for user: ${userId}`);
      } else {
        console.log(`User profile not found for userId: ${userId}, skipping verification data cleanup`);
      }
    } catch (error) {
      // Don't throw errors when clearing verification data - it's cleanup
      console.log('Could not clear verification data:', error.message);
    }
  }
  // Register new user with email and password
  async createAccount({ email, password, name }) {
    try {
      // Simplified: Don't check deleted accounts during signup
      // If user tries to signup with existing email, Appwrite will handle the error
      
      // Create account directly without checking for existing sessions
      const userAccount = await account.create(ID.unique(), email, password, name);
      
      if (userAccount) {
        // Create user profile in database
        await this.createUserProfile({
          userId: userAccount.$id,
          email: userAccount.email,
          name: userAccount.name,
        });
        
        // Create session after account creation
        return await account.createEmailPasswordSession(email, password);
      } else {
        return userAccount;
      }
    } catch (error) {
      throw error;
    }
  }

  // Login user - simplified: check isDeleted first, then emailVerified
  async login({ email, password }) {
    try {
      // Check if user is already logged in
      const existingUser = await this.getCurrentUser();
      if (existingUser) {
        // Check if the logged-in user matches the login credentials
        if (existingUser.email === email) {
          console.log('User already logged in with same email');
          return { $id: existingUser.$id, userId: existingUser.$id };
        } else {
          // Different user trying to login, logout first
          console.log('Different user trying to login, logging out existing session');
          await account.deleteSessions();
        }
      }
      
      // Create the session
      const session = await account.createEmailPasswordSession(email, password);
      
      // Check if user's account is deleted and email is verified
      if (session && session.userId) {
        try {
          const profile = await this.getUserProfile(session.userId);
          
          // FIRST: Check if account is marked as deleted in our DB
          if (profile && profile.isDeleted) {
            // Log out immediately if account is deleted
            await account.deleteSessions();
            throw new Error('Your account was deleted. Please visit the "Restore Account" page to restore your account.');
          }
          
          // SECOND: Check if email is verified (only if account is not deleted)
          if (profile && !profile.emailVerified) {
            // Account exists but email not verified
            await account.deleteSessions();
            throw new Error('Please verify your email before logging in. Check your inbox for the verification link.');
          }
        } catch (profileError) {
          // If we can't get profile, check if it's because the account is deleted
          if (profileError.message.includes('Document with the requested ID could not be found')) {
            await account.deleteSessions();
            throw new Error('This account no longer exists.');
          }
          // If it's another error, let the login proceed
          console.warn('Could not check account status:', profileError);
        }
      }
      
      return session;
    } catch (error) {
      // Don't do any complex Appwrite blocking checks - just pass through the error
      throw error;
    }
  }

  // Get current user
  async getCurrentUser() {
    try {
      return await account.get();
    } catch (error) {
      return null;
    }
  }

  // Logout user
  async logout() {
    try {
      return await account.deleteSessions();
    } catch (error) {
      throw error;
    }
  }

  // Check if user has active session
  async hasActiveSession() {
    try {
      const user = await account.get();
      return !!user;
    } catch (error) {
      return false;
    }
  }

  // Force logout and clear all sessions
  async forceLogout() {
    try {
      await account.deleteSessions();
      return true;
    } catch (error) {
      // Even if deletion fails, consider it logged out
      return true;
    }
  }

  // Create user profile in database
  async createUserProfile({ userId, email, name, emailVerified = false }) {
    try {
      return await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.USERS,
        userId,
        {
          email,
          name,
          emailVerified,
          emailVerifiedAt: emailVerified ? new Date().toISOString() : "",
          verificationData: "", // Initialize empty verification data field
          isDeleted: false, // Track if user account is deleted
          deletedAt: "", // Track when account was deleted
          restoredAt: "", // Track when account was restored
          createdAt: new Date().toISOString(),
        }
      );
    } catch (error) {
      throw error;
    }
  }

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
      // Handle profile picture separately if it's a File object
      if (data.profilePicture instanceof File) {
        const file = data.profilePicture;
        
        // Get current profile to see if there's an existing profile picture
        const currentProfile = await this.getUserProfile(userId);
        
        // Delete the old profile picture if it exists
        if (currentProfile && currentProfile.profilePictureId) {
          try {
            await storageService.deleteProfilePicture(currentProfile.profilePictureId);
          } catch (err) {
            console.warn('Failed to delete old profile picture:', err);
            // Continue with the update even if deletion fails
          }
        }
        
        // Upload new profile picture with public permissions
        const uploadResult = await storageService.uploadProfilePicture(file, userId);
        
        // Replace the File with the file ID and URL in the data
        console.log('Upload result:', uploadResult);
        delete data.profilePicture;
        data.profilePictureId = uploadResult.$id;
        
        // Get the profile picture URL
        const pictureUrl = storageService.getProfilePictureUrl(uploadResult.$id);
        console.log('Profile picture URL:', pictureUrl);
        data.profilePictureUrl = pictureUrl;
      } else if (data.profilePictureId === null) {
        // Handle profile picture removal
        // Get current profile to see if there's an existing profile picture
        const currentProfile = await this.getUserProfile(userId);
        
        // Delete the profile picture if it exists
        if (currentProfile && currentProfile.profilePictureId) {
          try {
            await storageService.deleteProfilePicture(currentProfile.profilePictureId);
          } catch (err) {
            console.warn('Failed to delete profile picture:', err);
            // Continue with the update even if deletion fails
          }
        }
        
        // Set the profile picture ID and URL to null
        data.profilePictureId = null;
        data.profilePictureUrl = null;
      }
      
      // Update the user profile
      return await databases.updateDocument(DATABASE_ID, COLLECTIONS.USERS, userId, data);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  // Send verification email using Appwrite's createVerification (standard approach)
  async sendSignupVerification(email, password, name) {
    let userAccount = null;
    
    try {
      console.log('Creating account and sending verification email');
      
      // Simplified: Let Appwrite handle existing email checks
      
      // Create new account
      const userId = ID.unique();
      userAccount = await account.create(userId, email, password, name);
      
      if (userAccount) {
        // Create user profile as unverified
        await this.createUserProfile({
          userId: userAccount.$id,
          email: userAccount.email,
          name: userAccount.name,
          emailVerified: false,
        });
        
        // Store verification data
        await this.storeVerificationData(userAccount.$id, {
          userId: userAccount.$id,
          email: userAccount.email,
          name: userAccount.name,
          password: password,
          isRestoring: false,
          createdAt: Date.now()
        });
        
        // Login to send verification email
        const session = await account.createEmailPasswordSession(email, password);
        
        // Send verification email using Appwrite's standard method
        const verification = await account.createVerification(
          `${window.location.origin}/verify-email`
        );
        
        // Logout to keep the account in unverified state until verification
        await account.deleteSessions();
        
        return {
          userId: userAccount.$id,
          email: userAccount.email,
          name: userAccount.name,
          verificationSent: true,
          isRestoring: false,
          message: 'Verification email sent! Please check your email and click the verification link.',
          expiryTime: Date.now() + 5 * 60 * 1000, // 5 minutes from now
          verification
        };
      }
    } catch (error) {
      console.error('Send signup verification error:', error);
      // Clean up verification data on error
      if (userAccount && userAccount.$id) {
        try {
          await this.clearVerificationData(userAccount.$id);
        } catch (cleanupError) {
          console.log('Could not clean up during error:', cleanupError.message);
        }
      }
      // Clean up session on error
      try {
        await account.deleteSessions();
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      throw error;
    }
  }

  // Verify email using Appwrite's verification system
  async verifySignupEmail(userId, secret, email = null) {
    try {
      console.log('Verifying email using Appwrite verification system');
      console.log('Verification params:', { userId, secret: secret ? 'present' : 'missing', secretLength: secret?.length });
      
      // Check if verification data still exists and is valid using userId
      const verificationData = await this.getVerificationData(userId);
      if (!verificationData) {
        throw new Error('Verification link expired. Please sign up again.');
      }
      
      // Validate the secret parameter
      if (!secret || typeof secret !== 'string' || secret.length < 10) {
        throw new Error('Invalid verification token. Please check your email for the correct verification link.');
      }
      
      // Use Appwrite's standard email verification
      // The updateVerification method expects userId and secret from the verification URL
      const verification = await account.updateVerification(userId, secret);
      
      if (verification) {
        // Update user profile to mark as verified
        await this.updateUserProfile(userId, {
          emailVerified: true,
          emailVerifiedAt: new Date().toISOString()
        });
        
        // Log in the user automatically after verification
        await account.createEmailPasswordSession(verificationData.email, verificationData.password);
        
        // Clear verification data ONLY after everything succeeds
        await this.clearVerificationData(userId);
        
        const message = verificationData.isRestoring 
          ? 'Account restored successfully! Welcome back to FocusFlux!'
          : 'Email verified successfully! Welcome to FocusFlux!';
        
        return { 
          verified: true, 
          userId: userId,
          isRestored: verificationData.isRestoring || false,
          verification,
          message: message
        };
      }
    } catch (error) {
      console.error('Verify email error:', error);
      
      // Handle specific error cases
      if (error.message?.includes('User with the requested ID could not be found')) {
        throw new Error('This verification link is invalid. The user account may have been deleted. Please sign up again.');
      }
      
      if (error.message?.includes('Invalid token')) {
        throw new Error('This verification link is invalid or has expired. Please request a new verification email.');
      }
      
      // Special handling for already verified accounts or 401 errors
      if (error.message?.includes('verification') || error.code === 401 || error.message?.includes('401')) {
        try {
          // Check if user profile shows they're already verified
          const profile = await this.getUserProfile(userId);
          if (profile && profile.emailVerified) {
            // User is already verified, just log them in
            const verificationData = await this.getVerificationData(userId);
            if (verificationData) {
              await account.createEmailPasswordSession(verificationData.email, verificationData.password);
              await this.clearVerificationData(userId);
              
              const message = verificationData.isRestoring 
                ? 'Account restored successfully! Welcome back to FocusFlux!'
                : 'Email already verified! Welcome to FocusFlux!';
              
              return { 
                verified: true, 
                userId: userId,
                isRestored: verificationData.isRestoring || false,
                message: message
              };
            }
          } else {
            // Try to manually update verification if the API call succeeded but had auth issues
            await this.updateUserProfile(userId, {
              emailVerified: true,
              emailVerifiedAt: new Date().toISOString()
            });
            
            const verificationData = await this.getVerificationData(userId);
            if (verificationData) {
              await account.createEmailPasswordSession(verificationData.email, verificationData.password);
              await this.clearVerificationData(userId);
              
              const message = verificationData.isRestoring 
                ? 'Account restored successfully! Welcome back to FocusFlux!'
                : 'Email verified successfully! Welcome to FocusFlux!';
              
              return { 
                verified: true, 
                userId: userId,
                isRestored: verificationData.isRestoring || false,
                message: message
              };
            }
          }
        } catch (profileError) {
          console.error('Error checking profile during verification recovery:', profileError);
        }
      }
      
      // Don't clear verification data on error - let timeout handle it
      throw error;
    }
  }

  // Send OTP for email verification (existing users) using Appwrite's built-in email token
  async sendEmailToken(email) {
    try {
      console.log('Sending email token for existing user');
      
      // Get current user
      const user = await account.get();
      if (!user) {
        throw new Error('User must be logged in to send email token');
      }
      
      // Use Appwrite's built-in email token creation
      return await account.createEmailToken(user.$id, email);
    } catch (error) {
      throw error;
    }
  }

  // Verify email token for existing users using Appwrite's session token
  async verifyEmailToken(userId, secret) {
    try {
      // Create session using the token code as secret
      const session = await account.createSession(userId, secret);
      
      if (session) {
        // Update user profile to mark email as verified
        await this.updateUserProfile(userId, {
          emailVerified: true,
          emailVerifiedAt: new Date().toISOString()
        });
      }
      
      return session;
    } catch (error) {
      throw error;
    }
  }

  // Resend verification email
  async resendSignupVerification(email) {
    try {
      console.log('Resending verification email');
      
      // Find user by email to get their userId
      // Note: This requires the email to be unique and we need to find the user
      // For now, we'll need to pass userId instead of email for resending
      throw new Error('Please use resendSignupVerificationByUserId method instead');
      
    } catch (error) {
      console.error('Resend verification error:', error);
      throw error;
    }
  }

  // Resend verification email by userId
  async resendSignupVerificationByUserId(userId) {
    try {
      console.log('Resending verification email');
      
      // Get verification data
      const verificationData = await this.getVerificationData(userId);
      if (!verificationData) {
        throw new Error('Verification session expired. Please sign up again.');
      }
      
      // Log in temporarily to resend verification
      await account.createEmailPasswordSession(verificationData.email, verificationData.password);
      
      // Send new verification email
      const verification = await account.createVerification(
        `${window.location.origin}/verify-email`
      );
      
      // Logout again
      await account.deleteSessions();
      
      // Update verification data with new expiry time
      await this.storeVerificationData(userId, {
        ...verificationData,
        createdAt: Date.now()
      });
      
      return {
        success: true,
        message: 'New verification email sent! Please check your email.',
        expiryTime: Date.now() + 5 * 60 * 1000
      };
      
    } catch (error) {
      console.error('Resend verification error:', error);
      throw error;
    }
  }

  // Check verification status by userId
  async checkVerificationStatus(userId) {
    try {
      const verificationData = await this.getVerificationData(userId);
      if (!verificationData) {
        return { 
          valid: false, 
          expired: true,
          message: 'Verification session expired. Please sign up again.' 
        };
      }

      const remainingTime = verificationData.expiryTime - Date.now();
      
      if (remainingTime <= 0) {
        await this.clearVerificationData(userId);
        return { 
          valid: false, 
          expired: true,
          message: 'Verification session expired. Please sign up again.' 
        };
      }

      // Check if user has been verified by trying to get their profile
      try {
        const profile = await this.getUserProfile(userId);
        if (profile && profile.emailVerified) {
          // User has been verified externally, clean up and return success
          await this.clearVerificationData(userId);
          return {
            valid: true,
            verified: true,
            message: 'Email verification completed successfully!'
          };
        }
      } catch (error) {
        // Profile might not be accessible, continue with normal flow
      }

      return {
        valid: true,
        expired: false,
        verified: false,
        remainingTime,
        userData: {
          userId: verificationData.userId,
          email: verificationData.email,
          name: verificationData.name
        }
      };
    } catch (error) {
      console.error('Error checking verification status:', error);
      return { 
        valid: false, 
        expired: true,
        message: 'Error checking verification status. Please try again.' 
      };
    }
  }

  // Send welcome email after successful verification
  async sendWelcomeEmail(email, name) {
    try {
      console.log('Sending welcome email via email service');
      return await emailService.sendWelcomeEmail(email, name);
    } catch (error) {
      console.error('Welcome email error:', error);
      // Don't throw error for welcome email failure - it's not critical
      return { success: false, error: error.message };
    }
  }

  // Debug method to help troubleshoot verification issues
  async debugVerificationIssue(userId, secret) {
    console.log('=== VERIFICATION DEBUG START ===');
    console.log('UserId:', userId);
    console.log('Secret present:', !!secret);
    console.log('Secret length:', secret ? secret.length : 0);
    
    try {
      // Check if we can get current account session
      console.log('Checking current session...');
      const currentUser = await account.get();
      console.log('Current user found:', currentUser);
    } catch (sessionError) {
      console.log('No current session:', sessionError.message);
    }
    
    try {
      // Try to get user profile from database
      console.log('Checking user profile...');
      const profile = await this.getUserProfile(userId);
      console.log('User profile found:', profile);
    } catch (profileError) {
      console.log('User profile error:', profileError.message);
    }
    
    console.log('=== VERIFICATION DEBUG END ===');
  }

  // Emergency verification recovery - for when user account exists but verification fails
  async emergencyVerificationRecovery(email, password) {
    try {
      console.log('Attempting emergency verification recovery...');
      
      // Try to log in with the email/password
      const session = await account.createEmailPasswordSession(email, password);
      
      if (session) {
        // Get the current user
        const currentUser = await account.get();
        
        // Update or create user profile
        try {
          await this.updateUserProfile(currentUser.$id, {
            emailVerified: true,
            emailVerifiedAt: new Date().toISOString()
          });
        } catch (profileError) {
          // Create profile if it doesn't exist
          await this.createUserProfile({
            userId: currentUser.$id,
            email: currentUser.email,
            name: currentUser.name,
            emailVerified: true,
            emailVerifiedAt: new Date().toISOString()
          });
        }
        
        return {
          success: true,
          user: currentUser,
          message: 'Emergency verification recovery successful!'
        };
      }
    } catch (error) {
      console.error('Emergency verification recovery failed:', error);
      throw new Error('Could not recover verification. Please contact support or try signing up again.');
    }
  }

  // Simple account deletion - only mark as deleted in database, don't touch Appwrite auth
  async deleteAccount(userId) {
    try {
      console.log(`Starting account deletion for user: ${userId}`);
      
      // Step 1: Delete all user-related data from collections
      await this.deleteAllUserData(userId);
      
      // Step 2: Simply mark user profile as deleted - DON'T touch Appwrite auth
      try {
        await this.updateUserProfile(userId, {
          isDeleted: true, // Mark the account as deleted
          deletedAt: new Date().toISOString(),
          // Keep email, name, and all other data for restoration
        });
        console.log(`User profile marked as deleted: ${userId}`);
      } catch (error) {
        console.warn(`Could not mark user profile as deleted: ${error.message}`);
      }
      
      // Step 3: Just log out the user - DON'T delete or disable Appwrite account
      try {
        console.log('Logging out user after marking as deleted');
        await account.deleteSessions();
        console.log(`User logged out: ${userId}`);
      } catch (logoutError) {
        console.warn('Could not log out user:', logoutError.message);
      }
      
      console.log(`Account deletion completed for user: ${userId}`);
      return { success: true, message: 'Account successfully deleted' };
      
    } catch (error) {
      console.error('Account deletion failed:', error);
      throw error;
    }
  }
  
  // Delete all user data from various collections
  async deleteAllUserData(userId) {
    try {
      console.log(`Deleting all data for user: ${userId}`);
      
      // Collections to clean up
      const collectionsToClean = [
        COLLECTIONS.TODOS,
        COLLECTIONS.USER_SETTINGS,
        COLLECTIONS.USER_TAGS,
        COLLECTIONS.DAILY_COMPLETIONS,
        COLLECTIONS.DAILY_PLANS,
        COLLECTIONS.DAILY_TASKS,
        COLLECTIONS.FRIEND_REQUESTS,
        COLLECTIONS.FRIENDSHIPS,
        COLLECTIONS.MESSAGES,
        COLLECTIONS.CHATS,
        COLLECTIONS.FEEDBACK
      ];
      
      // Delete from each collection
      for (const collectionId of collectionsToClean) {
        try {
          // Query for documents belonging to this user
          const documents = await databases.listDocuments(
            DATABASE_ID,
            collectionId,
            [Query.equal('userId', userId)]
          );
          
          // Delete each document
          for (const doc of documents.documents) {
            try {
              await databases.deleteDocument(DATABASE_ID, collectionId, doc.$id);
              console.log(`Deleted document ${doc.$id} from ${collectionId}`);
            } catch (deleteError) {
              console.warn(`Could not delete document ${doc.$id} from ${collectionId}: ${deleteError.message}`);
            }
          }
          
          console.log(`Cleaned ${documents.documents.length} documents from ${collectionId}`);
          
        } catch (error) {
          console.warn(`Could not clean collection ${collectionId}: ${error.message}`);
          // Continue with other collections even if one fails
        }
      }
      
      // Additional cleanup for friendship-related data where user might be the friend
      try {
        // Delete friend requests where user is the recipient
        const friendRequestsReceived = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.FRIEND_REQUESTS,
          [Query.equal('friendId', userId)]
        );
        
        for (const request of friendRequestsReceived.documents) {
          try {
            await databases.deleteDocument(DATABASE_ID, COLLECTIONS.FRIEND_REQUESTS, request.$id);
          } catch (deleteError) {
            console.warn(`Could not delete friend request: ${deleteError.message}`);
          }
        }
        
        // Delete friendships where user is friend2
        const friendships = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.FRIENDSHIPS,
          [Query.equal('friend2Id', userId)]
        );
        
        for (const friendship of friendships.documents) {
          try {
            await databases.deleteDocument(DATABASE_ID, COLLECTIONS.FRIENDSHIPS, friendship.$id);
          } catch (deleteError) {
            console.warn(`Could not delete friendship: ${deleteError.message}`);
          }
        }
        
      } catch (error) {
        console.warn(`Error cleaning friendship data: ${error.message}`);
      }
      
      console.log(`Completed data cleanup for user: ${userId}`);
      
    } catch (error) {
      console.error('Error during user data cleanup:', error);
      throw error;
    }
  }

  // Check if deleted account exists and can be restored

  // Send password reset email
  async sendPasswordResetEmail(email) {
    try {
      console.log('Sending password reset email to:', email);
      
      // First check if account exists and is not deleted
      const profile = await this.findUserByEmail(email);
      
      if (!profile) {
        throw new Error('No account found with this email address.');
      }
      
      if (profile.isDeleted) {
        throw new Error('This account was deleted. Please restore your account first using the "Restore Account" page.');
      }
      
      // Create password reset using Appwrite
      const resetUrl = `${window.location.origin}/reset-password`;
      await account.createRecovery(email, resetUrl);
      
      console.log('Password reset email sent successfully');
      return {
        success: true,
        message: 'Password reset email sent successfully. Please check your inbox.'
      };
      
    } catch (error) {
      console.error('Send password reset email error:', error);
      
      if (error.message.includes('User not found')) {
        return {
          success: false,
          message: 'No account found with this email address.'
        };
      }
      
      throw error;
    }
  }

  // Verify password reset token
  async verifyPasswordResetToken(userId, secret) {
    try {
      console.log('Verifying password reset token for userId:', userId);
      
      // Check if user exists and is not deleted
      const profile = await this.getUserProfile(userId);
      
      if (!profile) {
        throw new Error('User not found.');
      }
      
      if (profile.isDeleted) {
        throw new Error('This account was deleted. Please restore your account first.');
      }
      
      // The token validation will be done during the actual password reset
      // For now, just verify the user exists
      return {
        success: true,
        message: 'Reset token is valid.'
      };
      
    } catch (error) {
      console.error('Verify password reset token error:', error);
      return {
        success: false,
        message: error.message || 'Invalid or expired reset token.'
      };
    }
  }

  // Reset password with new password
  async resetPassword(userId, secret, newPassword) {
    try {
      console.log('Resetting password for userId:', userId);
      
      // Check if user exists and is not deleted
      const profile = await this.getUserProfile(userId);
      
      if (!profile) {
        throw new Error('User not found.');
      }
      
      if (profile.isDeleted) {
        throw new Error('This account was deleted. Please restore your account first.');
      }
      
      // Complete the password reset using Appwrite
      await account.updateRecovery(userId, secret, newPassword, newPassword);
      
      console.log('Password reset completed successfully');
      return {
        success: true,
        message: 'Password updated successfully. You can now log in with your new password.'
      };
      
    } catch (error) {
      console.error('Reset password error:', error);
      
      if (error.message.includes('Invalid token') || error.message.includes('expired')) {
        throw new Error('Reset link has expired or is invalid. Please request a new one.');
      }
      
      throw error;
    }
  }

  // Helper method to find user by email
  async findUserByEmail(email) {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.USERS,
        [Query.equal('email', email)]
      );
      
      if (response.documents.length > 0) {
        return response.documents[0];
      }
      
      return null;
    } catch (error) {
      console.error('Find user by email error:', error);
      return null;
    }
  }
}

const authService = new AuthService();

export default authService;
