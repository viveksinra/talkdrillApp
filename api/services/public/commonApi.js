// /src/api/services/auth.js

import axios from "axios"; // Ensure axios is imported
import { CommonData } from "@/utils/commonData";
import { publicPost } from "@/api/config/publicAxiosInstance";

const UploadEndPoint = '/api/v1/common/fileUpload/publicUpload';

export const publicFileUpload = async (folderName, formData) => {
  // const url = `https://api.appliedview.com/api/v1/common/fileUpload/publicUpload/${folderName}`;
  const url = `${CommonData.startURL}/api/v1/common/fileUpload/publicUpload/${folderName}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
        // Do not manually set 'Content-Type' for FormData; let fetch handle it.
      },
    });

    if (!response.ok) {
      console.error('Upload error response:', response.status, response.statusText);
      const errorData = await response.text();
      console.error('Upload error details:', errorData);
      throw new Error('File upload failed');
    }

    const data = await response.json();
    const myData = {
      alt: data?.key,
      url: data?.url,
    }
    return myData;
  } catch (error) {
    console.error('File upload failed:', error.message);
    console.error('Stack trace:', error.stack);
    throw error;
  }
};












