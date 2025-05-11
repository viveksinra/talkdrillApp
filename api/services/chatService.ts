import { get, post, put } from '../config/axiosConfig';

// Get chat history with another user
export const getChatHistory = async (userId: string) => {
  try {
    const response = await get(`/api/v1/chat/history/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting chat history:', error);
    throw error;
  }
};

// Send a message to another user
export const sendMessage = async (receiverId: string, text: string) => {
  console.log('Sending message to:', receiverId, text);
  try {
    const response = await post('/api/v1/chat/message', { receiverId, text });
    return response.data;
  } catch (error) {
    console.error('Error sending message:', JSON.stringify(error));
    throw error;
  }
};

// Mark messages as read
export const markMessagesAsRead = async (userId: string) => {
  try {
    const response = await put(`/api/v1/chat/read/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
};

// Get chat list
export const getChatList = async () => {
  try {
    const response = await get('/api/v1/chat/list');
    return response.data;
  } catch (error) {
    console.log(error);
    console.error('Error getting chat list:', error);
    throw error;
  }
};