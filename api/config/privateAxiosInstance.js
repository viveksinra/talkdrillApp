import axios from "axios";
import { CommonData } from '@/utils/commonData';
import { getAuthToken, removeAuthToken,  } from '../../utils/SecureStore';

// Base instance for API requests
const api = axios.create({
  baseURL: CommonData.startURL,
});

// Response Interceptor to handle 401 Unauthorized errors
api.interceptors.response.use(
  response => response,
  async (error) => {
    if (error.response && error.response.status === 401) {

      await removeAuthToken(); // Clear the expired token
      return { message: "Session expired. Please log in again.", variant: "error" };
    }
    return Promise.reject(error);
  }
);

// Define the functions for making API requests
export const privatePost = async (url, data) => {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { message: "Logout and login again", variant: "error" };
    }
    const response = await api.post(url, data, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": token,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error in privatePost:", error);
    throw error;
  }
};

export const privateGet = async (url, params = {}) => {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { message: "Logout and login again", variant: "error" };
    }
    const response = await api.get(url, {
      params,
      headers: {
        "Authorization": token,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error in privateGet:", error);
    throw error;
  }
};

export const privateDelete = async (url, params = {}) => {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { message: "Logout and login again", variant: "error" };
    }
    const response = await api.delete(url, {
      params,
      headers: {
        "Authorization": token,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error in privateDelete:", error);
    throw error;
  }
};
