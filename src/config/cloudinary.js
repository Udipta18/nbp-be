/**
 * Cloudinary Configuration
 * 
 * Configures Cloudinary for image upload and management
 */

const cloudinary = require('cloudinary').v2;

// Validate required environment variables
const requiredEnvVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];

// Check if Cloudinary is configured
const isCloudinaryConfigured = requiredEnvVars.every(envVar => process.env[envVar]);

if (!isCloudinaryConfigured) {
    console.warn('⚠️  Cloudinary not configured. Image uploads will be disabled.');
    console.warn('   Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env');
} else {
    // Configure Cloudinary
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true // Always use HTTPS
    });
    console.log('✅ Cloudinary configured successfully');
}

/**
 * Upload options configuration
 * Centralizes upload settings for consistency
 */
const uploadOptions = {
    // Folder structure in Cloudinary
    folder: 'nbp-marketplace/providers',
    
    // Allowed image formats
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    
    // Image transformations for optimization
    transformation: [
        {
            width: 800,
            height: 800,
            crop: 'limit', // Maintain aspect ratio, max dimensions
            quality: 'auto:good',
            fetch_format: 'auto' // WebP for supported browsers
        }
    ],
    
    // Resource type
    resource_type: 'image'
};

/**
 * Thumbnail upload options
 * For generating smaller preview images
 */
const thumbnailOptions = {
    ...uploadOptions,
    folder: 'nbp-marketplace/providers/thumbnails',
    transformation: [
        {
            width: 300,
            height: 300,
            crop: 'fill',
            gravity: 'auto',
            quality: 'auto'
        }
    ]
};

module.exports = {
    cloudinary,
    uploadOptions,
    thumbnailOptions
};
