// /src/api/services/auth.js

import  { publicPost } from "@/api/config/publicAxiosInstance";

const LoginEndPoint = '/api/v1/auth/passwordAuth/login'
const RegisterEndPoint = '/api/v1/auth/createAccount/createOne'

export const loginApi = async (credentials) => {
 
  try {
    const response = await publicPost(LoginEndPoint, credentials);  
    return response;
  } catch (error) {
    throw error.response;
  }
};

// API function with additional debugging
export const signUpApi = async (userData) => {
  try {
    const response = await publicPost(RegisterEndPoint, userData);
    return response;
  } catch (error) {
    throw error.response;
  }
};
// API function with additional debugging
export const VerifyEmailOrMobileOtpApi = async (userData) => {
  try {
    const response = await publicPost('/api/v1/other/verify/bothEmailAndMobile', userData);
    return response;
  } catch (error) {
    throw error.response;
  }
};
// API function with additional debugging
export const ResendMobileOtpApi = async (userData) => {
  try {
    const response = await publicPost('/api/v1/other/resend/mobileOtp', userData);
    return response;
  } catch (error) {
    throw error.response;
  }
};
// API function with additional debugging
export const ResendEmailOtpApi = async (userData) => {
  try {
    const response = await publicPost('/api/v1/other/resend/emailOtp', userData);
    return response;
  } catch (error) {
    throw error.response;
  }
};
// API function with additional debugging
export const ForgetMobileOtpApi = async (userData) => {
  try {
    const response = await publicPost('/api/v1/other/send/forgetPassword/mobileOtp', userData);
    return response;
  } catch (error) {
    throw error.response;
  }
};
// API function with additional debugging
export const ForgetEmailOtpApi = async (userData) => {
  try {
    const response = await publicPost('/api/v1/other/send/forgetPassword/emailOtp', userData);
    return response;
  } catch (error) {
    throw error.response;
  }
};
// API function with additional debugging
export const OnlyVerifyOtpApi = async (userData) => {
  try {
    const response = await publicPost('/api/v1/other/onlyVerify/anyOtp', userData);
    return response;
  } catch (error) {
    throw error.response;
  }
};
// API function with additional debugging
export const ResetPasswordApi = async (userData) => {
  try {
    const response = await publicPost('/api/v1/other/resetPassword', userData);
    return response;
  } catch (error) {
    throw error.response;
  }
};
