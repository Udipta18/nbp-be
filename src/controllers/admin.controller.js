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

const updateProvider = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { ward_number, name, phone, category, description, email, website, address, city, state, zip_code, tags } = req.body;

    const updates = { updated_at: new Date().toISOString() };

    // Validate ward_number if provided
    if (ward_number !== undefined) {
        const wardNum = parseInt(ward_number, 10);
        if (isNaN(wardNum) || wardNum < 1 || wardNum > 20) {
            throw new BadRequestError('Ward number must be between 1 and 20');
        }
        updates.ward_number = wardNum;
    }

    // Validate and add tags if provided
    if (tags !== undefined) {
        if (!Array.isArray(tags)) {
            throw new BadRequestError('Tags must be an array');
        }
        // Allowed tags (must match database tags table)
        const allowedTags = [
            // Universal
            'verified', '5_star', '24x7', 'upi_accepted',
            // Food/Tiffin
            'free_delivery', 'veg_only', 'home_cooked',
            // Services
            'same_day', 'insured', 'govt_certified', 'emergency_available',
            // Doctors
            'mbbs', 'video_consult', 'home_visit',
            // Ambulance
            'icu_equipped', 'oxygen'
        ];
        const invalidTags = tags.filter(t => !allowedTags.includes(t));
        if (invalidTags.length > 0) {
            throw new BadRequestError(`Invalid tags: ${invalidTags.join(', ')}`);
        }
        updates.tags = tags;
    }

    // Add other fields if provided
    if (name) updates.name = name.trim();
    if (phone) updates.phone = phone.trim();
    if (category) updates.category = category.trim();
    if (description !== undefined) updates.description = description?.trim() || null;
    if (email !== undefined) updates.email = email?.trim() || null;
    if (website !== undefined) updates.website = website?.trim() || null;
    if (address !== undefined) updates.address = address?.trim() || null;
    if (city !== undefined) updates.city = city?.trim() || null;
    if (state !== undefined) updates.state = state?.trim() || null;
    if (zip_code !== undefined) updates.zip_code = zip_code?.trim() || null;

    const { data, error } = await supabaseAdmin
        .from('providers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('❌ Update failed:', error);
        throw new NotFoundError('Provider not found');
    }

    res.json({ success: true, message: 'Provider updated successfully', data });
});

module.exports = { getPendingProviders, getAllProviders, getProviderByIdAdmin, approveProvider, rejectProvider, deleteProvider, updateProvider, getStats };
