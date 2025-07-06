import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import recoveryService from "../services/recovery";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { useAuth } from "../context/AuthContext";

const RestoreAccount = () => {
  const [formData, setFormData] = useState({
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  // Redirect if user is already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, authLoading, navigate]);

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

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
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
      console.log(
        "Attempting to restore account for email:",
        formData.email.trim()
      );

      const result = await recoveryService.restoreAccountByEmail(
        formData.email.trim()
      );
      console.log("Restore account result:", result);

      if (result.success) {
        if (result.canLoginNow) {
          // Account was restored and can login immediately
          toast.success(
            result.message ||
              "Account restored successfully! You can now log in."
          );

          // Navigate to login page immediately
          navigate("/login", {
            state: {
              email: formData.email.trim(),
              message:
                "Your account has been restored successfully! You can now log in with your original password.",
              restored: true,
            },
          });
        } else {
          // Account restored but needs email verification
          toast.success(
            result.message ||
              "Account restored successfully! Please check your email to verify."
          );

          // Navigate to login page after successful restoration
          navigate("/login", {
            state: {
              email: formData.email.trim(),
              message:
                "Your account has been restored. Please check your email to complete verification.",
            },
          });
        }
      } else {
        // Handle specific error reasons with better messaging
        if (result.reason === "email_not_found") {
          toast.error(
            "No account found with this email address. Please check the spelling and try again."
          );
          setErrors({
            email:
              "No account was found with this email address. Please verify the email or contact support.",
          });
        } else if (result.reason === "account_not_deleted") {
          toast.error(
            "This account exists but is not deleted. Please try logging in normally."
          );
          navigate("/login", { state: { email: formData.email.trim() } });
        } else {
          toast.error(
            result.message || "Failed to restore account. Please try again."
          );
        }
      }
    } catch (error) {
      console.error("Restore account error:", error);
      toast.error(
        error.message || "Failed to restore account. Please try again."
      );
      setErrors({
        email:
          "An error occurred while processing your request. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
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
            Restore Your Account
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Enter your email address to restore your deleted account
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`input-field ${
                  errors.email ? "border-red-500 focus:ring-red-500" : ""
                }`}
                placeholder="Enter your email address"
                disabled={loading}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.email}
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
                  Restoring Account...
                </>
              ) : (
                "Restore Account"
              )}
            </button>
          </div>

          {/* Navigation links */}
          <div className="text-center space-y-2">
            <div className="text-sm">
              <Link
                to="/login"
                className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
              >
                Back to Login
              </Link>
            </div>
            <div className="text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Don't have an account?{" "}
              </span>
              <Link
                to="/signup"
                className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
              >
                Sign up
              </Link>
            </div>
            <div className="text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Forgot your password?{" "}
              </span>
              <Link
                to="/forgot-password"
                className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
              >
                Reset Password
              </Link>
            </div>
          </div>
        </form>

        {/* Info panel */}
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
                About Account Restoration
              </h3>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                <p>
                  If your account was deleted, you can restore it by simply
                  entering your email address. Once restored, you can login with
                  your original credentials.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestoreAccount;
