const { supabaseAdmin } = require('../config/supabase');
const { deleteImage, extractPublicId } = require('../services/uploadImage');
const { asyncHandler, NotFoundError, BadRequestError } = require('../middleware/errorHandler');

const getPendingProviders = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = Math.min(parseInt(limit, 10), 50);
    const offset = (pageNum - 1) * limitNum;

    const { data, error, count } = await supabaseAdmin
        .from('providers')
        .select('*', { count: 'exact' })
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false })
        .range(offset, offset + limitNum - 1);

    if (error) throw new BadRequestError('Failed to fetch pending providers');

    res.json({
        success: true,
        data,
        pagination: { page: pageNum, limit: limitNum, total: count, totalPages: Math.ceil(count / limitNum) }
    });
});

const getAllProviders = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = Math.min(parseInt(limit, 10), 50);
    const offset = (pageNum - 1) * limitNum;

    let query = supabaseAdmin.from('providers').select('*', { count: 'exact' });
    if (status) query = query.eq('status', status);
    query = query.order('created_at', { ascending: false }).range(offset, offset + limitNum - 1);

    const { data, error, count } = await query;
    if (error) throw new BadRequestError('Failed to fetch providers');

    res.json({ success: true, data, pagination: { page: pageNum, limit: limitNum, total: count } });
});

const getProviderByIdAdmin = asyncHandler(async (req, res) => {
    const { data, error } = await supabaseAdmin.from('providers').select('*').eq('id', req.params.id).single();
    if (error || !data) throw new NotFoundError('Provider not found');
    res.json({ success: true, data });
});

const approveProvider = asyncHandler(async (req, res) => {
    const providerId = req.params.id;
    console.log('🔍 [1/3] Checking provider existence:', providerId);
    
    // Step 1: Check if provider exists (using simple select)
    const { data: existing, error: findError } = await supabaseAdmin
        .from('providers')
        .select('id, status, name')
        .eq('id', providerId)
        .single();
        
    if (findError || !existing) {
        console.error('❌ [1/3] Provider NOT FOUND or invisible to admin:', findError);
        return res.status(404).json({
            success: false,
            error: 'Provider not found',
            details: findError
        });
    }
    
    console.log('✅ [1/3] Provider found:', existing);
    
    // Step 2: Perform update
    console.log('🔄 [2/3] Attempting update...');
    const { data, error } = await supabaseAdmin
        .from('providers')
        .update({ status: 'APPROVED', updated_at: new Date().toISOString() })
        .eq('id', providerId)
        .select()
        .single();

    if (error) {
        console.error('❌ [2/3] Update failed:', error);
        throw new BadRequestError(`Failed to approve provider: ${error.message}`);
    }
    
    console.log('✅ [3/3] Provider approved successfully:', data.id);
    res.json({ success: true, message: 'Provider approved successfully', data });
});

const rejectProvider = asyncHandler(async (req, res) => {
    console.log('🔍 Attempting to reject provider:', req.params.id);
    
    const { data, error } = await supabaseAdmin
        .from('providers')
        .update({ status: 'REJECTED', updated_at: new Date().toISOString() })
        .eq('id', req.params.id)
        .select()
        .single();

    console.log('📊 Supabase response:', { data, error });

    if (error) {
        console.error('❌ Supabase error:', error);
        throw new NotFoundError(`Provider not found: ${error.message}`);
    }
    
    if (!data) {
        console.error('❌ No data returned from Supabase');
        throw new NotFoundError('Provider not found - no data returned');
    }
    
    console.log('✅ Provider rejected successfully:', data.id);
    res.json({ success: true, message: 'Provider rejected successfully', data });
});

const deleteProvider = asyncHandler(async (req, res) => {
    const { data: provider } = await supabaseAdmin.from('providers').select('image_url').eq('id', req.params.id).single();
    if (!provider) throw new NotFoundError('Provider not found');

    if (provider.image_url) {
        const publicId = extractPublicId(provider.image_url);
        if (publicId) await deleteImage(publicId).catch(console.error);
    }

    const { error } = await supabaseAdmin.from('providers').delete().eq('id', req.params.id);
    if (error) throw new BadRequestError('Failed to delete provider');

    res.json({ success: true, message: 'Provider deleted successfully' });
});

const getStats = asyncHandler(async (req, res) => {
    const [pending, approved, rejected, bookings] = await Promise.all([
        supabaseAdmin.from('providers').select('id', { count: 'exact', head: true }).eq('status', 'PENDING'),
        supabaseAdmin.from('providers').select('id', { count: 'exact', head: true }).eq('status', 'APPROVED'),
        supabaseAdmin.from('providers').select('id', { count: 'exact', head: true }).eq('status', 'REJECTED'),
        supabaseAdmin.from('bookings').select('id', { count: 'exact', head: true })
    ]);

    res.json({
        success: true,
        data: {
            providers: { pending: pending.count || 0, approved: approved.count || 0, rejected: rejected.count || 0 },
            totalBookings: bookings.count || 0
        }
    });
});

module.exports = { getPendingProviders, getAllProviders, getProviderByIdAdmin, approveProvider, rejectProvider, deleteProvider, getStats };
