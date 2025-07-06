import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import authService from "../services/auth";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { useAuth } from "../context/AuthContext";

const ResetPassword = () => {
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [errors, setErrors] = useState({});
  const [isValidToken, setIsValidToken] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();

  // Get token and userId from URL params
  const userId = searchParams.get("userId");
  const secret = searchParams.get("secret");

  // Redirect if user is already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Verify the reset token on component mount
  useEffect(() => {
    const verifyResetToken = async () => {
      if (!userId || !secret) {
        setIsValidToken(false);
        setVerifying(false);
        return;
      }

      try {
        console.log("Verifying password reset token");
        const result = await authService.verifyPasswordResetToken(
          userId,
          secret
        );

        if (result.success) {
          setIsValidToken(true);
          toast.success("Token verified! You can now set your new password.");
        } else {
          setIsValidToken(false);
          toast.error(result.message || "Invalid or expired reset link.");
        }
      } catch (error) {
        console.error("Token verification error:", error);
        setIsValidToken(false);
        toast.error(error.message || "Invalid or expired reset link.");
      } finally {
        setVerifying(false);
      }
    };

    verifyResetToken();
  }, [userId, secret]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password =
        "Password must contain at least one uppercase letter, one lowercase letter, and one number";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      console.log("Resetting password with new password");

      const result = await authService.resetPassword(
        userId,
        secret,
        formData.password
      );

      if (result.success) {
        setResetComplete(true);
        toast.success(
          "Password reset successfully! You can now log in with your new password."
        );
      } else {
        toast.error(
          result.message || "Failed to reset password. Please try again."
        );
        setErrors({ password: result.message || "Failed to reset password." });
      }
    } catch (error) {
      console.error("Password reset error:", error);

      if (
        error.message.includes("expired") ||
        error.message.includes("invalid")
      ) {
        toast.error("Reset link has expired. Please request a new one.");
        navigate("/forgot-password");
      } else {
        toast.error(
          error.message || "Failed to reset password. Please try again."
        );
        setErrors({ password: "An error occurred. Please try again." });
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            {verifying ? "Verifying reset link..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  // Invalid token screen
  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center">
              <Link to="/" className="inline-flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-primary-600 to-accent-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">F</span>
                </div>
                <span className="ml-2 text-2xl font-bold text-gray-900 dark:text-white">
                  FocusFlux
                </span>
              </Link>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
              Invalid Reset Link
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              This password reset link is invalid or has expired
            </p>
          </div>

          <div className="card p-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400 dark:text-red-300"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Link Expired or Invalid
                </h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  <p>
                    Password reset links expire after 1 hour for security.
                    Please request a new reset link.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Link
              to="/forgot-password"
              className="w-full btn-primary py-3 text-base font-medium text-center block"
            >
              Request New Reset Link
            </Link>

            <div className="text-center">
              <Link
                to="/login"
                className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success screen
  if (resetComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center">
              <img
                className="h-12 w-auto"
                src="/src/assets/logo.png"
                alt="FocusFlux"
              />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
              Password Reset Complete
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Your password has been successfully updated
            </p>
          </div>

          <div className="card p-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400 dark:text-green-300"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                  Success!
                </h3>
                <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                  <p>
                    You can now log in to your account using your new password.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Link
              to="/login"
              className="w-full btn-primary py-3 text-base font-medium text-center block"
            >
              Continue to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center">
            <img
              className="h-12 w-auto"
              src="/src/assets/logo.png"
              alt="FocusFlux"
            />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            Set New Password
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Enter your new password below
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* New Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                New Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleInputChange}
                className={`input-field ${
                  errors.password ? "border-red-500 focus:ring-red-500" : ""
                }`}
                placeholder="Enter your new password"
                disabled={loading}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`input-field ${
                  errors.confirmPassword
                    ? "border-red-500 focus:ring-red-500"
                    : ""
                }`}
                placeholder="Confirm your new password"
                disabled={loading}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          {/* Submit button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="small" className="mr-2" />
                  Updating Password...
                </>
              ) : (
                "Update Password"
              )}
            </button>
          </div>

          {/* Navigation links */}
          <div className="text-center">
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
            >
              Back to Login
            </Link>
          </div>
        </form>

        {/* Password requirements */}
        <div className="card p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-400 dark:text-blue-300"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Password Requirements
              </h3>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                <ul className="list-disc list-inside space-y-1">
                  <li>At least 8 characters long</li>
                  <li>At least one uppercase letter</li>
                  <li>At least one lowercase letter</li>
                  <li>At least one number</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
