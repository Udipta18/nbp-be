const { supabaseAdmin } = require('../config/supabase');
const { asyncHandler, NotFoundError, BadRequestError } = require('../middleware/errorHandler');

const createBooking = asyncHandler(async (req, res) => {
    const { provider_id, customer_name, customer_phone, booking_date, booking_time, notes } = req.body;

    // Check if provider exists and is approved
    const { data: provider } = await supabaseAdmin.from('providers').select('id').eq('id', provider_id).eq('status', 'APPROVED').single();
    if (!provider) throw new NotFoundError('Provider not found or not available');

    const { data, error } = await supabaseAdmin
        .from('bookings')
        .insert({
            provider_id,
            customer_name: customer_name.trim(),
            customer_phone: customer_phone.trim(),
            booking_date,
            booking_time,
            notes: notes?.trim() || null,
            status: 'PENDING'
        })
        .select()
        .single();

    if (error) throw new BadRequestError('Failed to create booking');

    res.status(201).json({ success: true, message: 'Booking created successfully', data });
});

const getBookingById = asyncHandler(async (req, res) => {
    const { data, error } = await supabaseAdmin.from('bookings').select('*, providers(name, category, phone)').eq('id', req.params.id).single();
    if (error || !data) throw new NotFoundError('Booking not found');
    res.json({ success: true, data });
});

const updateBookingStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const validStatuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) throw new BadRequestError(`Status must be one of: ${validStatuses.join(', ')}`);

    const { data, error } = await supabaseAdmin.from('bookings').update({ status, updated_at: new Date().toISOString() }).eq('id', req.params.id).select().single();
    if (error || !data) throw new NotFoundError('Booking not found');

    res.json({ success: true, message: 'Booking status updated', data });
});

const getAllBookings = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status, provider_id } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = Math.min(parseInt(limit, 10), 50);
    const offset = (pageNum - 1) * limitNum;

    let query = supabaseAdmin.from('bookings').select('*, providers(name, category)', { count: 'exact' });
    if (status) query = query.eq('status', status);
    if (provider_id) query = query.eq('provider_id', provider_id);
    query = query.order('created_at', { ascending: false }).range(offset, offset + limitNum - 1);

    const { data, count } = await query;
    res.json({ success: true, data, pagination: { page: pageNum, limit: limitNum, total: count } });
});

module.exports = { createBooking, getBookingById, updateBookingStatus, getAllBookings };
