import { get, post, put } from '@/api/config/axiosConfig';

export interface Professional {
  _id: string;
  name: string;
  email?: string;
  phoneNumber: string;
  profileImage?: string;
  bio?: string;
  experience: number;
  education?: string;
  specializations: string[];
  languages: Array<{
    language: string;
    proficiency: string;
  }>;
  hourlyRate: number;
  totalSessions: number;
  completedSessions: number;
  averageRating: number;
  totalRatings: number;
  isVerified: boolean;
  kycVerified: boolean;
  isActive: boolean;
  isAvailableForBooking: boolean;
}

export interface Booking {
  _id: string;
  student: string;
  professional: string;
  scheduledDate: string;
  scheduledTime: string;
  endTime: string;
  duration: number;
  topic?: string;
  studentNotes?: string;
  status: string;
  amount: number;
  coinsDeducted: number;
}

export interface AvailabilitySlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

// API endpoints
const PROFESSIONALS_ENDPOINT = '/api/v1/bookings/professionals';
const PROFESSIONAL_DETAILS_ENDPOINT = '/api/v1/bookings/professionals';
const AVAILABILITY_ENDPOINT = '/api/v1/bookings/professionals';
const BOOKING_ENDPOINT = '/api/v1/bookings';

/**
 * Get all professionals with filters
 */
export const fetchProfessionals = async (params?: {
  specialization?: string;
  minRating?: number;
  maxRate?: number;
  language?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<{
  professionals: Professional[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
  };
}> => {
  try {
    const response = await get(PROFESSIONALS_ENDPOINT, params);
    if (response.data.variant === 'success') {
      return response.data.myData;
    }
    throw new Error(response.data.message || 'Failed to fetch professionals');
  } catch (error) {
    console.error('Error fetching professionals:', error);
    throw error;
  }
};

/**
 * Get professional details by ID
 */
export const fetchProfessionalDetails = async (id: string): Promise<Professional> => {
  try {
    const response = await get(`${PROFESSIONAL_DETAILS_ENDPOINT}/${id}`);
    if (response.data.variant === 'success') {
      return response.data.myData.professional;
    }
    throw new Error(response.data.message || 'Failed to fetch professional details');
  } catch (error) {
    console.error('Error fetching professional details:', error);
    throw error;
  }
};

/**
 * Get professional availability for a specific date
 */
export const fetchProfessionalAvailability = async (
  professionalId: string,
  date: string
): Promise<AvailabilitySlot[]> => {
  try {
    const response = await get(`${AVAILABILITY_ENDPOINT}/${professionalId}/availability`, { date });
    if (response.data.variant === 'success') {
      return response.data.myData.availability;
    }
    throw new Error(response.data.message || 'Failed to fetch availability');
  } catch (error) {
    console.error('Error fetching professional availability:', error);
    throw error;
  }
};

/**
 * Book a session with a professional
 */
export const bookProfessionalSession = async (bookingData: {
  professionalId: string;
  scheduledDate: string;
  scheduledTime: string;
  topic?: string;
  studentNotes?: string;
}): Promise<Booking> => {
  try {
    const response = await post(BOOKING_ENDPOINT, bookingData);
    if (response.data.variant === 'success') {
      return response.data.myData.booking;
    }
    throw new Error(response.data.message || 'Failed to book session');
  } catch (error) {
    console.error('Error booking session:', error);
    throw error;
  }
};

/**
 * Get user's bookings
 */
export const fetchUserBookings = async (params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{
  bookings: Booking[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
  };
}> => {
  try {
    const response = await get(`${BOOKING_ENDPOINT}/user`, params);
    if (response.data.variant === 'success') {
      return response.data.myData;
    }
    throw new Error(response.data.message || 'Failed to fetch bookings');
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    throw error;
  }
};

/**
 * Cancel a booking
 */
export const cancelBooking = async (bookingId: string, reason?: string): Promise<Booking> => {
  try {
    const response = await put(`${BOOKING_ENDPOINT}/${bookingId}/cancel`, { reason });
    if (response.data.variant === 'success') {
      return response.data.myData.booking;
    }
    throw new Error(response.data.message || 'Failed to cancel booking');
  } catch (error) {
    console.error('Error cancelling booking:', error);
    throw error;
  }
}; 