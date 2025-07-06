// Test for profile picture upload functionality
// Usage: Import this file and call the function to test if file processing works
// This is particularly useful when debugging file upload issues

export const testFileProcessing = (file) => {
  console.log('Testing file processing:');
  
  // Check if file exists
  if (!file) {
    console.error('Error: No file provided');
    return false;
  }
  
  // Log file details
  console.log('File details:', {
    name: file.name,
    size: `${(file.size / 1024).toFixed(2)} KB`,
    type: file.type,
    lastModified: new Date(file.lastModified).toLocaleString()
  });
  
  // Check file type
  if (!file.type.match('image.*')) {
    console.error('Error: File is not an image');
    return false;
  }
  
  // Check file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    console.error('Error: File is too large (>5MB)');
    return false;
  }
  
  console.log('File validation passed');
  return true;
};

export const createImagePreview = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject('No file provided');
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result);
    };
    reader.onerror = () => {
      reject('Failed to read file');
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Resize an image file client-side before uploading
 * This can help reduce upload size and avoid server transformations
 * 
 * @param {File} file - Original image file
 * @param {number} maxWidth - Maximum width of resized image
 * @param {number} maxHeight - Maximum height of resized image
 * @param {number} quality - JPEG quality (0-1)
 * @returns {Promise<Blob>} - Resized image as Blob with same file type
 */
export const resizeImageFile = (file, maxWidth = 500, maxHeight = 500, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.match('image.*')) {
      reject(new Error('Invalid file type. Only images are supported.'));
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (readerEvent) => {
      const image = new Image();
      
      image.onload = () => {
        // Calculate new dimensions
        let width = image.width;
        let height = image.height;
        
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round(height * maxWidth / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round(width * maxHeight / height);
            height = maxHeight;
          }
        }
        
        // Create canvas for resizing
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        // Draw resized image on canvas
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, width, height);
        
        // Get file extension
        const fileExtension = file.name.split('.').pop().toLowerCase();
        let mimeType = 'image/jpeg'; // Default
        
        // Set appropriate mime type
        if (fileExtension === 'png') {
          mimeType = 'image/png';
        } else if (fileExtension === 'gif') {
          mimeType = 'image/gif';
        } else if (fileExtension === 'webp') {
          mimeType = 'image/webp';
        }
        
        // Convert to blob with original file type if possible
        canvas.toBlob((blob) => {
          if (blob) {
            // Create a new file with the same name
            const resizedFile = new Blob([blob], { type: mimeType });
            resolve(resizedFile);
          } else {
            reject(new Error('Failed to resize image'));
          }
        }, mimeType, quality);
      };
      
      image.onerror = () => {
        reject(new Error('Failed to load image for resizing'));
      };
      
      image.src = readerEvent.target.result;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file for resizing'));
    };
    
    reader.readAsDataURL(file);
  });
};
