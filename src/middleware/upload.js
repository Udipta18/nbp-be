/**
 * Multer Upload Middleware
 * 
 * Handles file uploads using memory storage
 * Validates file types and size limits
 */

const multer = require('multer');
const config = require('../config');

/**
 * Memory storage configuration
 * Files are stored in buffer, not on disk
 * Required for Cloudinary streaming upload
 */
const storage = multer.memoryStorage();

/**
 * File filter function
 * Validates file MIME type
 * 
 * @param {Request} req - Express request object
 * @param {Object} file - Uploaded file object
 * @param {Function} cb - Callback function
 */
const fileFilter = (req, file, cb) => {
    // Check if file type is allowed
    if (config.upload.allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new Error(
                `Invalid file type. Allowed types: ${config.upload.allowedMimeTypes.join(', ')}`
            ),
            false
        );
    }
};

/**
 * Multer upload configuration
 */
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: config.upload.maxFileSize,
        files: 7 // 1 profile + 6 gallery
    }
});

/**
 * Error handling middleware for multer
 * 
 * @param {Error} error - Multer error
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - Next middleware
 */
const handleUploadError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'File too large',
                message: `Maximum file size is ${config.upload.maxFileSize / (1024 * 1024)}MB per file`
            });
        }
        
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                error: 'Too many files',
                message: `Maximum ${config.upload.maxGalleryFiles} gallery images allowed`
            });
        }

        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                error: 'Unexpected field',
                message: 'Allowed fields: "image" (profile) and "gallery_images" (gallery)'
            });
        }

        return res.status(400).json({
            success: false,
            error: 'Upload error',
            message: error.message
        });
    }

    if (error) {
        return res.status(400).json({
            success: false,
            error: 'Upload error',
            message: error.message
        });
    }

    next();
};

/**
 * Single image upload middleware
 * Expects field name 'image'
 */
const uploadSingle = upload.single('image');

/**
 * Wrapped upload middleware with error handling (single image)
 */
const uploadImage = (req, res, next) => {
    uploadSingle(req, res, (error) => {
        if (error) {
            return handleUploadError(error, req, res, next);
        }
        next();
    });
};

/**
 * Multi-image upload middleware for provider with gallery
 * Accepts: 'image' (1 profile) + 'gallery_images' (up to 6)
 */
const uploadProviderImages = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'gallery_images', maxCount: config.upload.maxGalleryFiles }
]);

/**
 * Wrapped upload middleware with error handling (provider with gallery)
 */
const uploadProviderWithGallery = (req, res, next) => {
    uploadProviderImages(req, res, (error) => {
        if (error) {
            return handleUploadError(error, req, res, next);
        }
        next();
    });
};

module.exports = {
    upload,
    uploadImage,
    uploadProviderWithGallery,
    handleUploadError
};

