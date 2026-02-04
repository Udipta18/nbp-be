/**
 * Image Upload Service
 * 
 * Handles image uploads to Cloudinary
 */

const { cloudinary, uploadOptions, thumbnailOptions } = require('../config/cloudinary');

// Check if Cloudinary is configured
const isCloudinaryConfigured = () => {
    return cloudinary.config().cloud_name && cloudinary.config().api_key && cloudinary.config().api_secret;
};

/**
 * Upload image buffer to Cloudinary
 * 
 * @param {Buffer} buffer - Image file buffer from multer
 * @param {Object} options - Upload options to override defaults
 * @returns {Promise<{url: string, thumbnailUrl: string|null, publicId: string}>}
 */
const uploadImage = async (buffer, options = {}) => {
    // If Cloudinary is not configured, return a placeholder
    if (!isCloudinaryConfigured()) {
        console.warn('⚠️  Cloudinary not configured. Returning placeholder image URL.');
        return {
            url: 'https://via.placeholder.com/800x800?text=Image+Upload+Disabled',
            publicId: 'placeholder',
            width: 800,
            height: 800,
            format: 'png',
            bytes: 0
        };
    }

    return new Promise((resolve, reject) => {
        // Merge custom options with defaults
        const finalOptions = {
            ...uploadOptions,
            ...options
        };

        // Create upload stream
        const uploadStream = cloudinary.uploader.upload_stream(
            finalOptions,
            (error, result) => {
                if (error) {
                    console.error('Cloudinary upload error:', error);
                    reject(new Error('Failed to upload image'));
                    return;
                }

                resolve({
                    url: result.secure_url,
                    publicId: result.public_id,
                    width: result.width,
                    height: result.height,
                    format: result.format,
                    bytes: result.bytes
                });
            }
        );

        // Send buffer to Cloudinary
        uploadStream.end(buffer);
    });
};

/**
 * Upload image with thumbnail generation
 * 
 * @param {Buffer} buffer - Image file buffer
 * @returns {Promise<{url: string, thumbnailUrl: string, publicId: string}>}
 */
const uploadImageWithThumbnail = async (buffer) => {
    try {
        // Upload main image
        const mainResult = await uploadImage(buffer);

        // Generate thumbnail URL using Cloudinary transformations
        const thumbnailUrl = cloudinary.url(mainResult.publicId, {
            width: 300,
            height: 300,
            crop: 'fill',
            gravity: 'auto',
            quality: 'auto',
            fetch_format: 'auto'
        });

        return {
            url: mainResult.url,
            thumbnailUrl,
            publicId: mainResult.publicId
        };
    } catch (error) {
        throw error;
    }
};

/**
 * Delete image from Cloudinary
 * 
 * @param {string} publicId - Cloudinary public ID of the image
 * @returns {Promise<{result: string}>}
 */
const deleteImage = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        throw new Error('Failed to delete image');
    }
};

/**
 * Extract public ID from Cloudinary URL
 * 
 * @param {string} url - Cloudinary image URL
 * @returns {string|null} Public ID or null if extraction fails
 */
const extractPublicId = (url) => {
    try {
        if (!url || !url.includes('cloudinary.com')) {
            return null;
        }

        // Extract path after /upload/ and remove version and extension
        const uploadIndex = url.indexOf('/upload/');
        if (uploadIndex === -1) return null;

        let path = url.substring(uploadIndex + 8);
        
        // Remove version prefix (v1234567890/)
        path = path.replace(/^v\d+\//, '');
        
        // Remove file extension
        const lastDot = path.lastIndexOf('.');
        if (lastDot !== -1) {
            path = path.substring(0, lastDot);
        }

        return path;
    } catch (error) {
        console.error('Error extracting public ID:', error);
        return null;
    }
};

/**
 * Update image - delete old and upload new
 * 
 * @param {Buffer} newBuffer - New image buffer
 * @param {string} oldUrl - Old image URL to delete
 * @returns {Promise<{url: string, publicId: string}>}
 */
const updateImage = async (newBuffer, oldUrl) => {
    // Delete old image if exists
    if (oldUrl) {
        const publicId = extractPublicId(oldUrl);
        if (publicId) {
            try {
                await deleteImage(publicId);
            } catch (error) {
                // Log but don't fail if old image deletion fails
                console.warn('Failed to delete old image:', error.message);
            }
        }
    }

    // Upload new image
    return uploadImage(newBuffer);
};

module.exports = {
    uploadImage,
    uploadImageWithThumbnail,
    deleteImage,
    extractPublicId,
    updateImage
};
