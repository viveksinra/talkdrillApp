// /src/api/services/auth.js

import  { privateDelete, privateGet, privatePost } from "@/api/config/privateAxiosInstance";

const GetMultiPostEP = '/api/v1/post/getMultiPost/all'
const AddLikeToPostEP = '/api/v1/post/handleReaction'
const GetSinglePostDataEP = '/api/v1/post/getSinglePost'

export const getSinglePostDataApi = async (postId) => {
  try {
    const response = await privateGet(`${GetSinglePostDataEP}/${postId}`);
    return response;
  } catch (error) {
    throw error.response;
  }
};

export const getMultiPostApi = async (apiParamsLink) => {
 
  try {
    const response = await privateGet(`${GetMultiPostEP}/${apiParamsLink}`);  
    return response;
  } catch (error) {
    throw error.response;
  }
};

export const handleReaction = async (postId,reactionType) => {
  try {
    if(postId !== undefined && reactionType !== undefined) {
    const response = await privatePost(`${AddLikeToPostEP}/${reactionType}/${postId}`);
    return response;}
  } catch (error) {
    throw error.response;
  }
};




// Profile ended
