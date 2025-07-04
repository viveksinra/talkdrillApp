import { post } from '../config/axiosConfig';

export interface ReviewSubmissionData {
  bookingId: string;
  sessionId: string;
  rating: number;
  review?: string;
  detailedRatings?: {
    teaching?: number;
    communication?: number;
    patience?: number;
    punctuality?: number;
  };
  tags?: string[];
}

export interface ReviewResponse {
  review: {
    _id: string;
    student: string;
    professional: string;
    booking: string;
    session: string;
    rating: number;
    review?: string;
    detailedRatings?: {
      teaching?: number;
      communication?: number;
      patience?: number;
      punctuality?: number;
    };
    tags?: string[];
    createdAt: string;
  };
}

class ReviewService {
  /**
   * Submit review for a professional session
   */
  async submitReview(professionalId: string, reviewData: ReviewSubmissionData): Promise<ReviewResponse> {
    try {
      const response = await post(`/api/v1/bookings/${professionalId}/review`, reviewData);
      if (response.data.variant === 'success') {
        return response.data.myData;
      }
      throw new Error(response.data.message || 'Failed to submit review');
    } catch (error) {
      console.error('Error submitting review:', error);
      throw error;
    }
  }
}

export default new ReviewService(); 