/**
 * Add cache busting parameter to an image URL
 * This is useful for forcing the browser to reload the image
 * when it might be cached
 *
 * @param {string} url - The image URL
 * @returns {string} - The URL with cache busting parameter
 */
export const cacheBustImage = (url) => {
  if (!url) return null;
  
  // Check if URL already has parameters
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}t=${Date.now()}`;
};

/**
 * Generate an avatar for a user based on their name
 * 
 * @param {string} name - User's name
 * @returns {string} - URL to a generated avatar
 */
export const generateAvatarUrl = (name) => {
  const encodedName = encodeURIComponent(name || 'User');
  // Using DiceBear API for generated avatars
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodedName}`;
};
