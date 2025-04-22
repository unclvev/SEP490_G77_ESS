// src/page/Common/GoogleLogin.js
import React from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useDispatch } from 'react-redux';
import { setToken } from '../../redux-setup/action';
import { message } from 'antd';
import axios from 'axios';

const GoogleLoginButton = () => {
  const dispatch = useDispatch();

  const handleSuccess = async (credentialResponse) => {
    try {
      const res = await axios.post(
        'http://localhost:7052/api/Auth/google-login',
        { token: credentialResponse.credential }
      );

      if (res.data.token) {
        dispatch(setToken(res.data.token));
        localStorage.setItem('token', res.data.token);
        message.success('Đăng nhập Google thành công!');
        window.location.href = '/';
      }
    } catch (err) {
      message.error('Đăng nhập Google thất bại!');
    }
  };

  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => message.error('Google login error')}
      />
    </GoogleOAuthProvider>
  );
};

export default GoogleLoginButton;
