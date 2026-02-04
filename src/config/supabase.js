/**
 * Supabase Client Configuration
 * 
 * Creates two Supabase clients:
 * 1. supabase - Uses anon key for public operations
 * 2. supabaseAdmin - Uses service role key for admin operations
 */

const { createClient } = require('@supabase/supabase-js');

// Validate required environment variables
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Public Supabase client
 * Uses anon key - respects RLS policies
 * Use for public operations (viewing approved providers, creating bookings)
 */
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: false,
        detectSessionInUrl: false
    }
});

/**
 * Admin Supabase client
 * Uses service role key - bypasses RLS policies
 * Use for admin operations (viewing all providers, approving/rejecting)
 */
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

/**
 * Create a Supabase client with a specific user's JWT
 * Used for authenticated user operations
 * 
 * @param {string} accessToken - User's JWT access token
 * @returns {SupabaseClient} Authenticated Supabase client
 */
const createAuthenticatedClient = (accessToken) => {
    return createClient(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        },
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
};

/**
 * Verify a Supabase JWT token
 * 
 * @param {string} token - JWT token to verify
 * @returns {Promise<{user: object|null, error: Error|null}>}
 */
const verifyToken = async (token) => {
    try {
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        
        if (error) {
            return { user: null, error };
        }
        
        return { user, error: null };
    } catch (error) {
        return { user: null, error };
    }
};

module.exports = {
    supabase,
    supabaseAdmin,
    createAuthenticatedClient,
    verifyToken
};
