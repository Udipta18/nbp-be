const { supabase, supabaseAdmin } = require('../config/supabase');
const { uploadImage, deleteImage, extractPublicId } = require('../services/uploadImage');
const { asyncHandler, NotFoundError, BadRequestError } = require('../middleware/errorHandler');
const config = require('../config');

const createProvider = asyncHandler(async (req, res) => {
    const { name, phone, category, description, email, website, address, city, state, zip_code, latitude, longitude, experience_years, ward_number } = req.body;
    let imageUrl = null;

    if (req.file) {
        const uploadResult = await uploadImage(req.file.buffer);
        imageUrl = uploadResult.url;
    }

    const { data, error } = await supabaseAdmin
        .from('providers')
        .insert({
            name: name.trim(),
            phone: phone.trim(),
            category: category.trim(),
            description: description?.trim() || null,
            email: email?.trim() || null,
            website: website?.trim() || null,
            address: address?.trim() || null,
            city: city?.trim() || null,
            state: state?.trim() || null,
            zip_code: zip_code?.trim() || null,
            latitude: latitude ? parseFloat(latitude) : null,
            longitude: longitude ? parseFloat(longitude) : null,
            experience_years: experience_years ? parseInt(experience_years, 10) : 0,
            ward_number: parseInt(ward_number, 10),
            image_url: imageUrl,
            status: 'PENDING',
            rating: 0,
            review_count: 0,
            is_verified: false
        })
        .select()
        .single();

    if (error) {
        console.error('Supabase error:', error);
        if (imageUrl) {
            const publicId = extractPublicId(imageUrl);
            if (publicId) await deleteImage(publicId).catch(console.error);
        }
        throw new BadRequestError('Failed to create provider');
    }

    res.status(201).json({
        success: true,
        message: 'Provider submitted successfully. Pending approval.',
        data: { id: data.id, name: data.name, category: data.category, status: data.status }
    });
});

const getProviders = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, category, search, ward, tags, sort = 'created_at', order = 'desc' } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = Math.min(parseInt(limit, 10), 50);
    const offset = (pageNum - 1) * limitNum;

    let query = supabase.from('providers').select('*', { count: 'exact' }).eq('status', 'APPROVED');
    if (category) query = query.eq('category', category);
    if (search) query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    if (ward) {
        const wardNum = parseInt(ward, 10);
        if (wardNum >= 1 && wardNum <= 20) {
            query = query.eq('ward_number', wardNum);
        }
    }
    // Filter by tags (provider must have ALL specified tags)
    if (tags) {
        const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean);
        if (tagArray.length > 0) {
            query = query.contains('tags', tagArray);
        }
    }
    query = query.order(sort, { ascending: order === 'asc' }).range(offset, offset + limitNum - 1);

    const { data, error, count } = await query;
    if (error) throw new BadRequestError('Failed to fetch providers');

    res.json({
        success: true,
        data,
        pagination: { page: pageNum, limit: limitNum, total: count, totalPages: Math.ceil(count / limitNum) }
    });
});

const getProviderById = asyncHandler(async (req, res) => {
    const { data, error } = await supabase.from('providers').select('*').eq('id', req.params.id).eq('status', 'APPROVED').single();
    if (error || !data) throw new NotFoundError('Provider not found');
    res.json({ success: true, data });
});

const getProviderReviews = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = Math.min(parseInt(limit, 10), 50);
    const offset = (pageNum - 1) * limitNum;

    const { data: provider } = await supabase.from('providers').select('id').eq('id', req.params.id).eq('status', 'APPROVED').single();
    if (!provider) throw new NotFoundError('Provider not found');

    const { data, count } = await supabase.from('reviews').select('*', { count: 'exact' }).eq('provider_id', req.params.id).order('created_at', { ascending: false }).range(offset, offset + limitNum - 1);
    res.json({ success: true, data, pagination: { page: pageNum, limit: limitNum, total: count } });
});

const getCategories = asyncHandler(async (req, res) => {
    const { data } = await supabase.from('categories').select('*').eq('is_active', true).order('name');
    res.json({ success: true, data: data || config.categories.map(name => ({ name })) });
});

const getTags = asyncHandler(async (req, res) => {
    const { category } = req.query;
    
    let query = supabase.from('tags').select('slug, display_name, icon, color, category_specific');
    
    // If category specified, filter tags that are universal (NULL) or include this category
    if (category) {
        query = query.or(`category_specific.is.null,category_specific.cs.{${category}}`);
    }
    
    const { data, error } = await query.order('display_name');
    
    if (error) {
        console.error('Tags fetch error:', error);
        throw new BadRequestError('Failed to fetch tags');
    }
    
    res.json({ success: true, data: data || [] });
});

module.exports = { createProvider, getProviders, getProviderById, getProviderReviews, getCategories, getTags };
