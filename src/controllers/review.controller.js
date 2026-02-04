const { supabaseAdmin } = require('../config/supabase');
const { asyncHandler, NotFoundError, BadRequestError } = require('../middleware/errorHandler');

const createReview = asyncHandler(async (req, res) => {
    const { booking_id, rating, comment } = req.body;

    // Verify booking exists and is completed
    const { data: booking } = await supabaseAdmin.from('bookings').select('id, provider_id, status').eq('id', booking_id).single();
    if (!booking) throw new NotFoundError('Booking not found');
    if (booking.status !== 'COMPLETED') throw new BadRequestError('Can only review completed bookings');

    // Check if review already exists
    const { data: existing } = await supabaseAdmin.from('reviews').select('id').eq('booking_id', booking_id).single();
    if (existing) throw new BadRequestError('Review already exists for this booking');

    const { data, error } = await supabaseAdmin
        .from('reviews')
        .insert({
            booking_id,
            provider_id: booking.provider_id,
            rating: parseInt(rating, 10),
            comment: comment?.trim() || null
        })
        .select()
        .single();

    if (error) throw new BadRequestError('Failed to create review');

    res.status(201).json({ success: true, message: 'Review created successfully', data });
});

const getReviewById = asyncHandler(async (req, res) => {
    const { data, error } = await supabaseAdmin.from('reviews').select('*, bookings(customer_name), providers(name)').eq('id', req.params.id).single();
    if (error || !data) throw new NotFoundError('Review not found');
    res.json({ success: true, data });
});

const deleteReview = asyncHandler(async (req, res) => {
    const { error } = await supabaseAdmin.from('reviews').delete().eq('id', req.params.id);
    if (error) throw new NotFoundError('Review not found');
    res.json({ success: true, message: 'Review deleted successfully' });
});

module.exports = { createReview, getReviewById, deleteReview };
