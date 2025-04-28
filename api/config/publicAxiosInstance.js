import { CommonData } from '@/utils/commonData';
import axios from "axios";



// Define the functions for making API requests
export const publicPost = async (url, data) => {

  try {
    const response =  await axios.post(`${CommonData.startURL}${url}`, data, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error in publicPost:", error);
    throw error;
  }
};

export const publicGet = async (url, params = {}) => {
  try {
    const response = await axios.get(`${CommonData.startURL}${url}`, { params });
    return response.data;
  } catch (error) {
    console.error("Error in publicGet:", error);
    throw error;
  }
};

export const publicDelete = async (url, params = {}) => {
  try {
    const response = await axios.delete(`${CommonData.startURL}${url}`, { params });
    return response.data;
  } catch (error) {
    console.error("Error in publicDelete:", error);
    throw error;
  }
};
