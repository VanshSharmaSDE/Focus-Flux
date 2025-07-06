import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  EnvelopeIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  ArrowPathIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/auth';
import toast from 'react-hot-toast';

const EmailVerificationWaiting = ({ email, onBack, tempUserData }) => {
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [isResending, setIsResending] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('waiting'); // 'waiting', 'verified', 'expired'
  const [isPolling, setIsPolling] = useState(true);
  const pollingInterval = useRef(null);
  const countdownInterval = useRef(null);
  const navigate = useNavigate();
  const { checkAuth } = useAuth();

  useEffect(() => {
    // Start countdown timer
    countdownInterval.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setVerificationStatus('expired');
          setIsPolling(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Start polling for verification status
    pollingInterval.current = setInterval(async () => {
      if (!isPolling) return;
      
      try {
        const status = await authService.checkVerificationStatus(tempUserData.userId);
        
        if (status.verified) {
          setVerificationStatus('verified');
          setIsPolling(false);
          
          // Update auth context
          await checkAuth();
          
          toast.success('Email verified successfully! Welcome to FocusFlux!');
          
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } else if (status.expired) {
          setVerificationStatus('expired');
          setIsPolling(false);
          setTimeLeft(0);
        } else if (status.remainingTime) {
          // Update remaining time from server
          const serverTimeLeft = Math.ceil(status.remainingTime / 1000);
          if (Math.abs(serverTimeLeft - timeLeft) > 5) {
            setTimeLeft(serverTimeLeft);
          }
        }
      } catch (error) {
        console.error('Polling verification status error:', error);
      }
    }, 3000); // Poll every 3 seconds

    // Cleanup on unmount
    return () => {
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
      }
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [email, isPolling, timeLeft, navigate, checkAuth]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleResendEmail = async () => {
    if (isResending || verificationStatus === 'expired') return;
    
    setIsResending(true);
    try {
      const result = await authService.resendSignupVerificationByUserId(tempUserData.userId);
      
      if (result.success) {
        toast.success('Verification email sent again! Please check your inbox.');
        // Reset timer
        setTimeLeft(300);
        setVerificationStatus('waiting');
        setIsPolling(true);
      }
    } catch (error) {
      console.error('Resend email error:', error);
      toast.error(error.message || 'Failed to resend verification email');
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToSignup = () => {
    setIsPolling(false);
    onBack();
  };

  if (verificationStatus === 'verified') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 text-green-500 mb-6">
              <CheckCircleIcon className="h-16 w-16" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">
              Email Verified!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Welcome to FocusFlux! Your email has been successfully verified.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Redirecting to your dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (verificationStatus === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 text-red-500 mb-6">
              <ExclamationTriangleIcon className="h-16 w-16" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">
              Verification Expired
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your email verification link has expired. Please sign up again to receive a new verification email.
            </p>
            <div className="space-y-4">
              <button
                onClick={handleBackToSignup}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition duration-200"
              >
                Back to Sign Up
              </button>
              <button
                onClick={() => navigate('/login')}
                className="w-full flex justify-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition duration-200"
              >
                Sign In Instead
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {/* Email icon */}
          <div className="mx-auto h-16 w-16 text-primary-600 mb-6">
            <EnvelopeIcon className="h-16 w-16" />
          </div>
          
          {/* Title */}
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">
            Check Your Email
          </h2>
          
          {/* Description */}
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            We've sent a verification link to:
          </p>
          <p className="text-lg font-medium text-gray-900 dark:text-white mb-6">
            {email}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-8">
            Click the link in your email to verify your account and complete your registration.
          </p>
          
          {/* Countdown timer */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <ClockIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Verification expires in:
              </span>
            </div>
            <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {formatTime(timeLeft)}
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="space-y-4">
            {/* Resend email button */}
            <button
              onClick={handleResendEmail}
              disabled={isResending || timeLeft <= 0}
              className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
            >
              {isResending ? (
                <>
                  <LoadingSpinner size="small" />
                  <span className="ml-2">Sending...</span>
                </>
              ) : (
                <>
                  <ArrowPathIcon className="h-4 w-4 mr-2" />
                  Resend Verification Email
                </>
              )}
            </button>
            
            {/* Back to signup button */}
            <button
              onClick={handleBackToSignup}
              className="w-full flex justify-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition duration-200"
            >
              Back to Sign Up
            </button>
          </div>
          
          {/* Additional help */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-500 mb-2">
              Didn't receive the email?
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Check your spam/junk folder or contact support if the issue persists.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationWaiting;
