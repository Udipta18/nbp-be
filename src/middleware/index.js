const { authenticate, authenticateOptional, authorize, extractToken } = require('./auth');
const { uploadImage, handleUploadError } = require('./upload');
const { handleValidation, validateProviderCreate, validateProviderId, validateProviderQuery, validateBookingCreate, validateReviewCreate } = require('./validate');
const { ApiError, NotFoundError, BadRequestError, UnauthorizedError, ForbiddenError, ConflictError, notFoundHandler, errorHandler, asyncHandler } = require('./errorHandler');

module.exports = {
    authenticate,
    authenticateOptional,
    authorize,
    extractToken,
    uploadImage,
    handleUploadError,
    handleValidation,
    validateProviderCreate,
    validateProviderId,
    validateProviderQuery,
    validateBookingCreate,
    validateReviewCreate,
    ApiError,
    NotFoundError,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    ConflictError,
    notFoundHandler,
    errorHandler,
    asyncHandler
};
