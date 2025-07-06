import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import authService from '../services/auth';
import recoveryService from '../services/recovery';
import toast from 'react-hot-toast';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('');
  const [hasAttempted, setHasAttempted] = useState(false);
  const navigate = useNavigate();
  const { checkAuth } = useAuth();

  useEffect(() => {
    // Prevent multiple verification attempts
    if (hasAttempted) return;
    
    const verifyEmail = async () => {
      try {
        setHasAttempted(true);
        
        // Extract parameters from URL - handle different possible parameter names
        let userId = searchParams.get('userId');
        let secret = searchParams.get('secret');
        const email = searchParams.get('email');
        const isRestore = searchParams.get('isRestore') === 'true';

        // Check for alternative parameter names that Appwrite might use
        if (!userId) {
          userId = searchParams.get('user') || searchParams.get('id');
        }
        if (!secret) {
          secret = searchParams.get('token') || searchParams.get('code') || searchParams.get('verification');
        }

        console.log('All URL parameters:', Object.fromEntries(searchParams.entries()));
        console.log('Verification parameters:', { userId, secret: secret ? 'present' : 'missing', email, isRestore, secretLength: secret?.length });

        if (!userId || !secret) {
          setStatus('error');
          setMessage('Invalid verification link. Missing required parameters. Please try signing up again.');
          return;
        }

        // Additional validation - check if secret looks like a valid token
        if (secret.length < 20) {
          setStatus('error');
          setMessage('Invalid verification token format. Please check your email for the correct verification link.');
          return;
        }

        // Basic validation of userId format (Appwrite user IDs are typically alphanumeric)
        if (userId.length < 10 || !/^[a-zA-Z0-9]+$/.test(userId)) {
          setStatus('error');
          setMessage('Invalid verification link format. Please try signing up again.');
          return;
        }

        // Choose the appropriate verification method based on restoration flag
        let result;
        if (isRestore) {
          // Use recovery service for restoration verification
          result = await recoveryService.completeRestoration(userId, secret);
        } else {
          // Use auth service for regular signup verification
          result = await authService.verifySignupEmail(userId, secret, email);
        }
        
        if (result && (result.verified || result.success)) {
          setStatus('success');
          setMessage(result.message || 'Email verified successfully! Welcome to FocusFlux!');
          
          // Always refresh auth context after successful verification
          await checkAuth();
          
          if (isRestore) {
            toast.success('Account restored successfully! Welcome back!');
          } else {
            toast.success('Email verified successfully!');
          }
          
          // Redirect to dashboard after 2 seconds (user is automatically logged in)
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } else {
          setStatus('error');
          setMessage('Email verification failed. Please try again.');
        }

      } catch (error) {
        console.error('Email verification error:', error);
        setStatus('error');
        
        // Provide more specific error messages based on the error type
        let errorMessage = 'Email verification failed. Please try again.';
        
        if (error.message?.includes('User with the requested ID could not be found')) {
          errorMessage = 'This verification link is invalid. The user account may have been deleted. Please sign up again.';
        } else if (error.message?.includes('Invalid token') || error.message?.includes('expired')) {
          errorMessage = 'This verification link has expired or is invalid. Please sign up again or request a new verification email.';
        } else if (error.message?.includes('already verified')) {
          errorMessage = 'This email is already verified! You can log in now.';
          // Don't show this as an error, redirect to login
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        } else if (error.message?.includes('Invalid restoration verification data')) {
          errorMessage = 'Invalid restoration link. Please request a new account restoration.';
          setTimeout(() => {
            navigate('/restore-account');
          }, 3000);
        } else if (error.message?.includes('Account not eligible')) {
          errorMessage = 'This account is not eligible for restoration. Please contact support for assistance.';
          setTimeout(() => {
            navigate('/contact');
          }, 3000);
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        setMessage(errorMessage);
        toast.error('Email verification failed');
        
        // Log detailed error information for debugging
        console.error('Detailed verification error:', {
          message: error.message,
          code: error.code,
          type: error.type,
          stack: error.stack
        });
      }
    };

    verifyEmail();
  }, [searchParams, navigate, checkAuth, hasAttempted]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {status === 'verifying' && (
            <>
              <LoadingSpinner size="large" />
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
                Verifying Email
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Please wait while we verify your email address...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto h-12 w-12 text-green-500">
                <CheckCircleIcon className="h-12 w-12" />
              </div>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
                Email Verified!
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {message}
              </p>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-500">
                Redirecting to dashboard in 2 seconds...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto h-12 w-12 text-red-500">
                <ExclamationCircleIcon className="h-12 w-12" />
              </div>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
                Verification Failed
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {message}
              </p>
              <div className="mt-6 space-y-4">
                <button
                  onClick={() => navigate('/verification-recovery')}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Try Account Recovery
                </button>
                <button
                  onClick={() => navigate('/signup')}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Back to Sign Up
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Back to Login
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
