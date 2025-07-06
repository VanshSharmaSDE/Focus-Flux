import React, { createContext, useContext, useEffect, useState } from 'react';
import authService from '../services/auth';
import toast from 'react-hot-toast';

// Updated with email verification flow

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      const currentUser = await authService.getCurrentUser();
      
      if (currentUser) {
        setUser(currentUser);
        // Get user profile
        try {
          const profile = await authService.getUserProfile(currentUser.$id);
          
          // Check if user account is marked as disabled (show as "deleted" to user)
          if (profile && profile.isDisabled) {
            // Log out disabled user and clear state
            await authService.logout();
            setUser(null);
            setUserProfile(null);
            toast.error('Your account has been deleted. To restore your account, please visit the restore account page.');
            return;
          }
          
          setUserProfile(profile);
        } catch (error) {
          // Check if profile doesn't exist (might be deleted)
          if (error.message.includes('Document with the requested ID could not be found')) {
            // Log out user if profile is missing
            await authService.logout();
            setUser(null);
            setUserProfile(null);
            toast.error('Account not found. Please sign up again.');
            return;
          }
          
          // Profile might not exist, create it
          await authService.createUserProfile({
            userId: currentUser.$id,
            email: currentUser.email,
            name: currentUser.name,
          });
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async ({ email, password }) => {
    try {
      setLoading(true);
      
      // Clear user state if someone is logged in, but don't call logout
      // Let Appwrite handle session management automatically
      if (user) {
        setUser(null);
        setUserProfile(null);
      }
      
      const session = await authService.login({ email, password });
      
      if (session) {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
        
        // Get user profile
        try {
          const profile = await authService.getUserProfile(currentUser.$id);
          setUserProfile(profile);
        } catch (error) {
          // Create profile if it doesn't exist
          const newProfile = await authService.createUserProfile({
            userId: currentUser.$id,
            email: currentUser.email,
            name: currentUser.name,
          });
          setUserProfile(newProfile);
        }
        
        toast.success('Welcome back!');
        return { success: true };
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async ({ email, password, name }) => {
    try {
      setLoading(true);
      
      // Clear user state if someone is logged in, but don't call logout
      // as new signups don't need to logout guest users
      if (user) {
        setUser(null);
        setUserProfile(null);
      }
      
      const newUser = await authService.createAccount({ email, password, name });
      
      if (newUser) {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
        
        // Get user profile (should be created during registration)
        const profile = await authService.getUserProfile(currentUser.$id);
        setUserProfile(profile);
        
        toast.success('Account created successfully!');
        return { success: true };
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registration failed');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Email verification registration function
  const registerWithEmailVerification = async (userData) => {
    const { email, password, name } = userData;
    try {
      setLoading(true);
      
      // Clear user state if someone is logged in
      if (user) {
        setUser(null);
        setUserProfile(null);
      }
      
      // Send verification email for signup using Appwrite's built-in system
      const result = await authService.sendSignupVerification(email, password, name);
      
      if (result) {
        toast.success('Verification email sent! Please check your inbox.');
        
        return { 
          success: true, 
          userData: {
            userId: result.userId,
            email: result.email,
            name: result.name,
            verificationSent: result.verificationSent,
            isRestoring: false,
            expiryTime: result.expiryTime
          }
        };
      }
    } catch (error) {
      console.error('Signup verification error:', error);
      toast.error(error.message || 'Failed to send verification email');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await authService.logout();
      setUser(null);
      setUserProfile(null);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data) => {
    try {
      if (!user) throw new Error('No user logged in');
      
      console.log('Updating profile with data:', data);
      const updatedProfile = await authService.updateUserProfile(user.$id, data);
      console.log('Profile updated:', updatedProfile);
      
      // Ensure we have the latest profile data including the picture URL
      setUserProfile(updatedProfile);
      
      // Don't show toast here, let the component handle it
      return { success: true, profile: updatedProfile };
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error(error.message || 'Profile update failed');
      return { success: false, error: error.message };
    }
  };

  const deleteAccount = async () => {
    try {
      if (!user) throw new Error('No user logged in');
      
      setLoading(true);
      const result = await authService.deleteAccount(user.$id);
      
      // Clear local state after successful deletion
      setUser(null);
      setUserProfile(null);
      
      toast.success('Account deleted successfully');
      return { success: true, message: result.message };
    } catch (error) {
      console.error('Account deletion error:', error);
      toast.error(error.message || 'Failed to delete account');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const contextValue = {
    user,
    userProfile,
    loading,
    login,
    register,
    registerWithEmailVerification,
    logout,
    updateProfile,
    deleteAccount,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
