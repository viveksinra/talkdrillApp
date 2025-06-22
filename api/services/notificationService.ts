import { get, post, put, del } from '../config/axiosConfig';
import { Notification, NotificationPreferences, DeviceToken } from '@/types';

interface NotificationResponse {
  notifications: Notification[];
  total: number;
  unreadCounts: Record<string, number>;
  totalUnreadCount: number;
  pages: number;
  currentPage: number;
}

class NotificationService {
  
  // Get notifications with filtering
  async getNotifications(
    page: number = 1,
    limit: number = 20,
    unread?: boolean,
    category?: string,
    type?: string,
    priority?: string
  ): Promise<NotificationResponse> {
    try {
      const params: Record<string, any> = {
        page: page.toString(),
        limit: limit.toString()
      };
      
      if (unread !== undefined) params.unread = unread.toString();
      if (category) params.category = category;
      if (type) params.type = type;
      if (priority) params.priority = priority;

      const response = await get('/api/v1/notification', params);
      
      if (response.data.variant === 'success') {
        return response.data.myData;
      } else {
        throw new Error(response.data.message || 'Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const response = await put(`/api/v1/notification/${notificationId}/read`);
      
      if (response.data.variant !== 'success') {
        throw new Error(response.data.message || 'Failed to mark notification as read');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead(category?: string): Promise<void> {
    try {
      const params = category ? { category } : {};
      const response = await put('/api/v1/notification/read-all', {}, { params });
      
      if (response.data.variant !== 'success') {
        throw new Error(response.data.message || 'Failed to mark all notifications as read');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Delete notification
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const response = await del(`/api/v1/notification/${notificationId}`);
      
      if (response.data.variant !== 'success') {
        throw new Error(response.data.message || 'Failed to delete notification');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Register device token - UPDATED to use new API endpoint
  async registerDeviceToken(deviceToken: DeviceToken): Promise<void> {
    try {
      const response = await post('/api/v1/device-token/register', deviceToken);
      
      if (response.data.variant !== 'success') {
        throw new Error(response.data.message || 'Failed to register device token');
      }
    } catch (error) {
      console.error('Error registering device token:', error);
      throw error;
    }
  }

  // Remove device token - UPDATED to use new API endpoint
  async removeDeviceToken(deviceId: string): Promise<void> {
    try {
      const response = await post('/api/v1/device-token/remove', { deviceId });
      
      if (response.data.variant !== 'success') {
        throw new Error(response.data.message || 'Failed to remove device token');
      }
    } catch (error) {
      console.error('Error removing device token:', error);
      throw error;
    }
  }

  // Get device tokens - NEW METHOD
  async getDeviceTokens(): Promise<any> {
    try {
      const response = await get('/api/v1/device-token');
      
      if (response.data.variant === 'success') {
        return response.data.myData;
      } else {
        throw new Error(response.data.message || 'Failed to fetch device tokens');
      }
    } catch (error) {
      console.error('Error fetching device tokens:', error);
      throw error;
    }
  }

  // Update notification preferences - UPDATED to use new API endpoint
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    try {
      const response = await put('/api/v1/device-token/preferences', preferences);
      
      if (response.data.variant === 'success') {
        return response.data.myData;
      } else {
        throw new Error(response.data.message || 'Failed to update notification preferences');
      }
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  // Get notification preferences - UPDATED to use new API endpoint
  async getPreferences(): Promise<NotificationPreferences> {
    try {
      const response = await get('/api/v1/device-token');
      
      if (response.data.variant === 'success') {
        const userSettings = response.data.myData.preferences;
        return {
          pushNotifications: userSettings?.pushNotifications ?? true,
          categories: userSettings?.notificationCategories ?? {
            transaction: true,
            session: true,
            system: true,
            social: true,
            achievement: true
          }
        };
      } else {
        throw new Error(response.data.message || 'Failed to fetch notification preferences');
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      // Return defaults on error
      return {
        pushNotifications: true,
        categories: {
          transaction: true,
          session: true,
          system: true,
          social: true,
          achievement: true
        }
      };
    }
  }
}

export default new NotificationService();
