const cloudinary = require('cloudinary').v2;
const { v4: uuidv4 } = require('uuid');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

class UploadService {
  /**
   * Upload a single file to Cloudinary
   * @param {Object} file - Multer file object
   * @param {String} folder - Cloudinary folder name (default: 'announcements')
   * @returns {Promise<Object>} Upload result with URL and metadata
   */
  async uploadFile(file, folder = 'portfoliomate/announcements') {
    try {
      return new Promise((resolve, reject) => {
        // Create upload stream
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: folder,
            resource_type: 'auto', // Automatically detect file type (image, video, raw)
            public_id: `${uuidv4()}_${file.originalname.split('.')[0]}`,
            use_filename: true,
            unique_filename: true,
            overwrite: false,
          },
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
              reject(error);
            } else {
              resolve({
                url: result.secure_url,
                publicId: result.public_id,
                fileName: file.originalname,
                contentType: file.mimetype,
                size: result.bytes,
                format: result.format,
                resourceType: result.resource_type,
                width: result.width || null,
                height: result.height || null,
              });
            }
          }
        );

        // Pipe file buffer to Cloudinary
        uploadStream.end(file.buffer);
      });
    } catch (error) {
      console.error('Upload error:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Upload multiple files to Cloudinary
   * @param {Array} files - Array of Multer file objects
   * @param {String} folder - Cloudinary folder name
   * @returns {Promise<Array>} Array of upload results
   */
  async uploadMultipleFiles(files, folder = 'portfoliomate/announcements') {
    try {
      if (!files || files.length === 0) {
        return [];
      }

      const uploadPromises = files.map(file => this.uploadFile(file, folder));
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Multiple upload error:', error);
      throw new Error(`Failed to upload multiple files: ${error.message}`);
    }
  }

  /**
   * Delete a file from Cloudinary
   * @param {String} publicId - Cloudinary public ID of the file
   * @param {String} resourceType - Type of resource (image, video, raw)
   * @returns {Promise<Object>} Deletion result
   */
  async deleteFile(publicId, resourceType = 'image') {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });

      if (result.result === 'ok' || result.result === 'not found') {
        return { success: true, result: result.result };
      } else {
        throw new Error(`Failed to delete file: ${result.result}`);
      }
    } catch (error) {
      console.error('Delete file error:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Delete multiple files from Cloudinary
   * @param {Array} publicIds - Array of Cloudinary public IDs
   * @param {String} resourceType - Type of resource
   * @returns {Promise<Array>} Array of deletion results
   */
  async deleteMultipleFiles(publicIds, resourceType = 'image') {
    try {
      if (!publicIds || publicIds.length === 0) {
        return [];
      }

      const deletePromises = publicIds.map(publicId => 
        this.deleteFile(publicId, resourceType)
      );
      return await Promise.all(deletePromises);
    } catch (error) {
      console.error('Multiple delete error:', error);
      throw new Error(`Failed to delete multiple files: ${error.message}`);
    }
  }

  /**
   * Get optimized image URL with transformations
   * @param {String} publicId - Cloudinary public ID
   * @param {Object} options - Transformation options
   * @returns {String} Transformed image URL
   */
  getOptimizedUrl(publicId, options = {}) {
    const defaultOptions = {
      quality: 'auto',
      fetch_format: 'auto',
      ...options,
    };

    return cloudinary.url(publicId, defaultOptions);
  }

  /**
   * Get thumbnail URL
   * @param {String} publicId - Cloudinary public ID
   * @param {Number} width - Thumbnail width
   * @param {Number} height - Thumbnail height
   * @returns {String} Thumbnail URL
   */
  getThumbnailUrl(publicId, width = 200, height = 200) {
    return cloudinary.url(publicId, {
      width: width,
      height: height,
      crop: 'fill',
      quality: 'auto',
      fetch_format: 'auto',
    });
  }

  /**
   * Validate file type
   * @param {String} mimetype - File MIME type
   * @returns {Boolean} Is valid
   */
  isValidFileType(mimetype) {
    const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    return allowedTypes.includes(mimetype);
  }

  /**
   * Validate file size
   * @param {Number} size - File size in bytes
   * @returns {Boolean} Is valid
   */
  isValidFileSize(size) {
    const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 104857600; // 100MB default
    return size <= maxSize;
  }
}

module.exports = new UploadService();
