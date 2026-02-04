const { supabaseAdmin } = require('../config/supabase');
const { asyncHandler, UnauthorizedError } = require('../middleware/errorHandler');

const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new UnauthorizedError('Email and password are required');
    }

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });

    if (error) {
        throw new UnauthorizedError('Invalid email or password');
    }

    res.json({
        success: true,
        message: 'Login successful',
        data: {
            user: { id: data.user.id, email: data.user.email, role: data.user.user_metadata?.role || 'admin' },
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
            expiresAt: data.session.expires_at
        }
    });
});

const refreshToken = asyncHandler(async (req, res) => {
    const { refresh_token } = req.body;

    if (!refresh_token) {
        throw new UnauthorizedError('Refresh token is required');
    }

    const { data, error } = await supabaseAdmin.auth.refreshSession({ refresh_token });

    if (error) {
        throw new UnauthorizedError('Invalid or expired refresh token');
    }

    res.json({
        success: true,
        data: {
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
            expiresAt: data.session.expires_at
        }
    });
});

const logout = asyncHandler(async (req, res) => {
    // Note: Supabase handles session invalidation on the client side
    res.json({ success: true, message: 'Logged out successfully' });
});

const getProfile = asyncHandler(async (req, res) => {
    res.json({
        success: true,
        data: { id: req.user.id, email: req.user.email, role: req.user.user_metadata?.role || 'admin' }
    });
});

module.exports = { login, refreshToken, logout, getProfile };
