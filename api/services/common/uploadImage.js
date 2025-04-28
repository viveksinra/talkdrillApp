import axios from "axios";
import { CommonData } from '@/utils/commonData';

const FileUploadEP1 = '/api/v1/other/fileupload/upload';

export const fileUploadApi = async (data1) => {
  let url = `${CommonData.startURL}${FileUploadEP1}`;


  // Create a FormData object if you are uploading a file
  const formData = new FormData();
  
  // Assuming 'photo' is the key for the file
  formData.append('photo', data1.photo);

  // Append other data fields if needed
  if (data1.otherData) {
    formData.append('otherData', data1.otherData);
  }

  try {
    const response = await axios.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',  // Ensure the correct headers for file upload
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error in fileUploadApi:", error);
    throw error;
  }
};
