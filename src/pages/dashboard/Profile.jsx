import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  UserCircleIcon, 
  EnvelopeIcon, 
  CalendarIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ArrowUpTrayIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { formatDate } from '../../utils/dateUtils';
import { testFileProcessing, createImagePreview, resizeImageFile } from '../../utils/fileUtils';
import { cacheBustImage, generateAvatarUrl } from '../../utils/imageUtils';
import storageService from '../../services/storage';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, userProfile, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: userProfile?.name || user?.name || '',
    email: user?.email || '',
    bio: userProfile?.bio || '',
    location: userProfile?.location || '',
    website: userProfile?.website || '',
    profilePicture: null
  });
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(userProfile?.profilePictureUrl || null);
  const fileInputRef = useRef(null);

  // Monitor userProfile changes to update the UI and ensure profile pictures are accessible
  useEffect(() => {
    console.log('userProfile updated:', userProfile);
    
    const checkProfilePicture = async () => {
      if (userProfile?.profilePictureId) {
        console.log('Profile picture ID:', userProfile.profilePictureId);
        
        // Ensure the file is public
        try {
          await storageService.ensureFileIsPublic(userProfile.profilePictureId);
          
          // Always get a fresh direct URL instead of using the stored URL
          // This avoids any cached transformations
          const directUrl = storageService.getProfilePictureUrl(userProfile.profilePictureId);
          console.log('Direct file view URL:', directUrl);
          
          // Update the image preview with the direct URL and cache busting
          setImagePreview(cacheBustImage(directUrl));
        } catch (error) {
          console.warn('Failed to check file permissions or get URL:', error);
          
          // Try using the stored URL as fallback if available
          if (userProfile.profilePictureUrl) {
            setImagePreview(cacheBustImage(userProfile.profilePictureUrl));
          }
        }
      } else if (userProfile && !userProfile.profilePictureId) {
        // If we have a userProfile but no picture ID, clear the preview
        setImagePreview(null);
      }
    };
    
    checkProfilePicture();
  }, [userProfile]);

  useEffect(() => {
    // Debugging effect to track userProfile changes
    console.log('userProfile changed:', userProfile);
    
    // Update formData when userProfile changes
    setFormData(prev => ({
      ...prev,
      name: userProfile?.name || user?.name || '',
      email: user?.email || '',
      bio: userProfile?.bio || '',
      location: userProfile?.location || '',
      website: userProfile?.website || '',
    }));
    
    // Don't update imagePreview here, let the other useEffect handle it
    // to avoid conflicts between the two effects
  }, [userProfile, user?.name, user?.email]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Create the update data object
      const updateData = {
        name: formData.name,
        bio: formData.bio,
        location: formData.location,
        website: formData.website,
      };
      
      // Handle profile picture
      if (formData.profilePicture) {
        if (formData.profilePicture === 'remove') {
          // If user wants to remove the current picture
          updateData.profilePictureId = null;
        } else {
          // If user has selected a new picture
          updateData.profilePicture = formData.profilePicture;
        }
      }
      
      // Send the update request
      const result = await updateProfile(updateData);

      if (result.success) {
        toast.success('Profile updated successfully');
        
        // Reset state
        setIsEditing(false);
        setFormData(prev => ({
          ...prev,
          profilePicture: null
        }));
        
        // Update the image preview to match the updated userProfile
        if (result.profile?.profilePictureUrl) {
          // Force a cache-busting parameter to ensure the latest image is displayed
          setImagePreview(cacheBustImage(result.profile.profilePictureUrl));
        } else {
          setImagePreview(null);
        }
      }
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: userProfile?.name || user?.name || '',
      email: user?.email || '',
      bio: userProfile?.bio || '',
      location: userProfile?.location || '',
      website: userProfile?.website || '',
      profilePicture: null
    });
    setImagePreview(userProfile?.profilePictureUrl || null);
    setIsEditing(false);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Use our utility function to validate the file
    if (!testFileProcessing(file)) {
      toast.error('Invalid image file. Please select a valid image under 5MB.');
      return;
    }
    
    try {
      // Show loading state
      toast.loading('Processing image...');
      
      // Create a preview URL using our utility function
      const preview = await createImagePreview(file);
      setImagePreview(preview);
      
      // Resize image client-side to avoid needing transformations on the server
      const resizedImage = await resizeImageFile(
        file,
        500,  // maxWidth
        500,  // maxHeight
        0.8   // quality
      );
      
      // Create a new File object with the resized image
      const resizedFile = new File(
        [resizedImage], 
        file.name, 
        { type: file.type, lastModified: new Date().getTime() }
      );
      
      console.log('Original size:', Math.round(file.size / 1024), 'KB');
      console.log('Resized size:', Math.round(resizedFile.size / 1024), 'KB');
      
      // Update form data with the resized file
      setFormData(prev => ({
        ...prev,
        profilePicture: resizedFile
      }));
      
      // Clear loading toast and show success
      toast.dismiss();
      toast.success('Image ready for upload');
    } catch (error) {
      console.error('Failed to process image:', error);
      toast.dismiss();
      toast.error('Failed to process image');
      
      // Fall back to using the original file if resizing fails
      setFormData(prev => ({
        ...prev,
        profilePicture: file
      }));
    }
  };
  
  const handleRemoveImage = () => {
    setFormData(prev => ({
      ...prev,
      profilePicture: null,
      profilePictureId: null  // Signal to remove the current picture
    }));
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.success('Profile image will be removed when you save');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg transition-colors duration-200">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h1>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
              >
                <PencilIcon className="-ml-1 mr-2 h-4 w-4" />
                Edit Profile
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-colors duration-200"
                >
                  <CheckIcon className="-ml-1 mr-2 h-4 w-4" />
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancel}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
                >
                  <XMarkIcon className="-ml-1 mr-2 h-4 w-4" />
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Information */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg transition-colors duration-200">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center sm:space-x-6 space-y-4 sm:space-y-0">
            {/* Profile Picture */}
            <div className="flex-shrink-0">
              {isEditing ? (
                <div className="flex flex-col items-center space-y-2">
                  <div className="relative group">
                    <div className={`h-20 w-20 rounded-full overflow-hidden bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center ${imagePreview ? 'border-2 border-primary-500' : ''}`}>
                      {imagePreview ? (
                        <img 
                          src={imagePreview} 
                          alt="Profile Preview" 
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <UserCircleIcon className="h-12 w-12 text-primary-600 dark:text-primary-400" />
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      id="profile-image-input"
                    />
                  </div>
                  
                  <div className="flex space-x-1">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      type="button"
                      className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary-500"
                    >
                      <ArrowUpTrayIcon className="h-3 w-3 mr-1" />
                      Upload
                    </button>
                    
                    {imagePreview && (
                      <button
                        onClick={handleRemoveImage}
                        type="button"
                        className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500"
                      >
                        <TrashIcon className="h-3 w-3 mr-1" />
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-20 w-20 rounded-full overflow-hidden bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center">
                  {imagePreview ? (
                    <img 
                      src={imagePreview} 
                      alt={`${userProfile?.name || 'User'}'s profile`} 
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        console.error('Failed to load profile image:', e);
                        e.target.onerror = null; 
                        
                        // Try to get a direct file view URL without transformations
                        const retryWithDirectUrl = async () => {
                          if (userProfile?.profilePictureId) {
                            try {
                              // Try to make the file public
                              await storageService.ensureFileIsPublic(userProfile.profilePictureId);
                              
                              // Get a direct file view URL without transformations
                              const directUrl = storageService.getProfilePictureUrl(userProfile.profilePictureId);
                              
                              // Add cache busting to force a fresh load
                              const refreshedUrl = cacheBustImage(directUrl);
                              console.log('Retrying with direct URL:', refreshedUrl);
                              
                              // Try loading the image again
                              e.target.src = refreshedUrl;
                              e.target.style.display = '';
                              return;
                            } catch (error) {
                              console.error('Failed to get direct URL:', error);
                            }
                          }
                          
                          // If we can't fix it, show a fallback avatar
                          e.target.style.display = 'none';
                          const userName = userProfile?.name || user?.name || 'User';
                          const fallbackUrl = generateAvatarUrl(userName);
                          
                          const fallbackImg = new Image();
                          fallbackImg.src = fallbackUrl;
                          fallbackImg.alt = `${userName}'s avatar`;
                          fallbackImg.className = 'h-full w-full object-cover';
                          
                          const parent = e.target.parentNode;
                          if (parent) {
                            parent.appendChild(fallbackImg);
                          }
                        };
                        
                        retryWithDirectUrl();
                      }}
                    />
                  ) : (
                    <UserCircleIcon className="h-12 w-12 text-primary-600 dark:text-primary-400" />
                  )}
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="space-y-4 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200 py-2.5 px-3"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white truncate">
                    {userProfile?.name || user?.name || 'User'}
                  </h2>
                  <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <EnvelopeIcon className="h-4 w-4 mr-1" />
                      {user?.email}
                    </div>
                    {/* Email Verification Status */}
                    <div className="flex items-center">
                      {userProfile?.emailVerified ? (
                        <>
                          <ShieldCheckIcon className="h-4 w-4 mr-1 text-green-500" />
                          <span className="text-green-600 dark:text-green-400 font-medium">Email Verified</span>
                        </>
                      ) : (
                        <>
                          <ExclamationTriangleIcon className="h-4 w-4 mr-1 text-yellow-500" />
                          <span className="text-yellow-600 dark:text-yellow-400 font-medium">Email Not Verified</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      Joined {formatDate(user?.$createdAt)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg transition-colors duration-200">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-6">
            Additional Information
          </h3>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Bio */}
            <div className="sm:col-span-2">
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Bio
              </label>
              {isEditing ? (
                <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 shadow-inner">
                  <textarea
                    name="bio"
                    id="bio"
                    rows={4}
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Tell us about yourself..."
                    className="mt-1 block w-full border-none rounded-lg focus:ring-primary-500 focus:border-primary-500 text-base bg-transparent text-gray-900 dark:text-white transition-colors duration-200 px-4 py-3 resize-none"
                  />
                </div>
              ) : (
                <div className="mt-2 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 shadow-inner">
                  <p className="text-sm text-blue-800 dark:text-blue-300 italic font-light leading-relaxed">
                    {userProfile?.bio || 'No bio added yet.'}
                  </p>
                </div>
              )}
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Location
              </label>
              {isEditing ? (
                <div className="relative">
                  <input
                    type="text"
                    name="location"
                    id="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="City, Country"
                    className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200 py-2.5 px-3 pl-9"
                  />
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/3 text-gray-500 dark:text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                  </span>
                </div>
              ) : (
                <div className="mt-2 p-2 px-3 rounded-md bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/30 inline-flex items-center shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 dark:text-green-400 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                    {userProfile?.location || 'No location added.'}
                  </p>
                </div>
              )}
            </div>

            {/* Website */}
            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Website
              </label>
              {isEditing ? (
                <div className="relative">
                  <input
                    type="url"
                    name="website"
                    id="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="https://example.com"
                    className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200 py-2.5 px-3 pl-9"
                  />
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/3 text-gray-500 dark:text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                    </svg>
                  </span>
                </div>
              ) : (
                <div className="mt-2 p-2 px-3 rounded-md bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/30 inline-flex items-center shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                  </svg>
                  {userProfile?.website ? (
                    <a
                      href={userProfile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-purple-700 dark:text-purple-300 font-medium hover:text-purple-500 dark:hover:text-purple-200 underline"
                    >
                      {userProfile.website}
                    </a>
                  ) : (
                    <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">
                      No website added.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
