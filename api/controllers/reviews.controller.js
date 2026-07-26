import { db } from '../config/db.js';

// Submit a review (authenticated users only)
export async function submitReview(req, res) {
  try {
    const { rating, review_text } = req.body;
    const userId = req.user.id;

    if (!rating || !review_text) {
      return res.status(400).json({
        success: false,
        message: 'Rating and review text are required'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Check if user already submitted a review
    const existing = await db.query(
      'SELECT id FROM reviews WHERE user_id = $1',
      [userId]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a review'
      });
    }

    // Get user info
    const userResult = await db.query(
      'SELECT full_name, avatar_url FROM users WHERE id = $1',
      [userId]
    );

    const user = userResult.rows[0];

    const result = await db.query(
      `INSERT INTO reviews (user_id, rating, review_text, reviewer_name, reviewer_avatar, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING *`,
      [userId, rating, review_text, user.full_name, user.avatar_url]
    );

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully! It will be visible after admin approval.',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Submit review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit review'
    });
  }
}

// Get approved reviews (public)
export async function getApprovedReviews(req, res) {
  try {
    const result = await db.query(
      `SELECT id, rating, review_text, reviewer_name, reviewer_avatar, created_at
       FROM reviews
       WHERE status = 'approved'
       ORDER BY created_at DESC
       LIMIT 50`
    );

    // Calculate average rating
    const avgResult = await db.query(
      `SELECT AVG(rating)::NUMERIC(3,1) as avg_rating, COUNT(*) as total_reviews
       FROM reviews
       WHERE status = 'approved'`
    );

    res.json({
      success: true,
      data: {
        reviews: result.rows,
        averageRating: parseFloat(avgResult.rows[0].avg_rating) || 0,
        totalReviews: parseInt(avgResult.rows[0].total_reviews) || 0
      }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews'
    });
  }
}

// Get all reviews (admin only)
export async function getAllReviews(req, res) {
  try {
    const { status } = req.query;

    let query = `
      SELECT r.*, u.email as reviewer_email,
             a.full_name as approved_by_name
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN users a ON r.approved_by = a.id
    `;

    const params = [];
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query += ' WHERE r.status = $1';
      params.push(status);
    }

    query += ' ORDER BY r.created_at DESC';

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get all reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews'
    });
  }
}

// Approve review (admin only)
export async function approveReview(req, res) {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const result = await db.query(
      `UPDATE reviews
       SET status = 'approved', approved_by = $1, approved_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [adminId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.json({
      success: true,
      message: 'Review approved successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Approve review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve review'
    });
  }
}

// Reject review (admin only)
export async function rejectReview(req, res) {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const result = await db.query(
      `UPDATE reviews
       SET status = 'rejected', approved_by = $1, approved_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [adminId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.json({
      success: true,
      message: 'Review rejected',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Reject review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject review'
    });
  }
}

// Delete review (admin only)
export async function deleteReview(req, res) {
  try {
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM reviews WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete review'
    });
  }
}
