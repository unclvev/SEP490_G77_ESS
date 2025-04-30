// src/page/Common/LoginPage.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { message } from 'antd';
import { login, googleLogin } from '../../services/api';
import { useDispatch } from 'react-redux';
import { setToken } from '../../redux-setup/action';
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';

const LoginPage = () => {
  const dispatch = useDispatch();
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Xử lý đăng nhập thông thường
  const handleLogin = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const response = await login(credentials);
      dispatch(setToken(response.data));
      localStorage.setItem('jwt', response.data.jwt);
      message.success('Login successful!', 2, () => {
        setLoading(false);
        window.location.href = '/';
      });
    } catch (error) {
      setErrorMessage('Tên đăng nhập hoặc mật khẩu không đúng');
      message.error('Email hoặc mật khẩu không đúng', 2, () => {
        setLoading(false);
      });
    }
  };

  // Xử lý đăng nhập bằng Google
  const handleGoogleLogin = async credentialResponse => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await googleLogin({ token: credentialResponse.credential });
      dispatch(setToken(res.data));
      localStorage.setItem('jwt', res.data.jwt);
      message.success('Google login successful!', 2, () => {
        setLoading(false);
        window.location.href = '/';
      });
    } catch (error) {
      message.error('Google login failed', 2, () => {
        setLoading(false);
      });
    }
  };

  return (
    <GoogleOAuthProvider clientId="823748993448-b2nol5g953mfbhjmlklho2itu2fp065k.apps.googleusercontent.com">
      <div className="flex min-h-screen bg-white">
        <div className="flex-none p-4">
          <Link to="/">
            <img width="120" src="/images/logo.svg" alt="Logo" />
          </Link>
        </div>
        <div className="flex-1 flex justify-center items-center">
          <div className="w-full max-w-md p-8 mr-32">
            <h1 className="text-5xl font-bold text-center text-black mb-6">Hello</h1>
            <span className="text-black text-sm text-center block mb-6">
              Bạn chưa có tài khoản? <a className="text-blue-600" href="/register">Tạo tài khoản</a>
            </span>

            <input
              type="text"
              placeholder="Email hoặc tên"
              className="w-full px-3 py-2 border border-gray-300 rounded-full mb-4"
              value={credentials.username}
              onChange={e => setCredentials({ ...credentials, username: e.target.value })}
              disabled={loading}
            />

            <div className="relative mb-4">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Mật khẩu"
                className="w-full px-3 py-2 border border-gray-300 rounded-full"
                value={credentials.password}
                onChange={e => setCredentials({ ...credentials, password: e.target.value })}
                disabled={loading}
              />
              <span
                className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-gray-500"
                onClick={() => loading || setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
              </span>
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className={`w-full py-2 rounded-full mb-4 text-white ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>

            <div className="flex items-center mb-4">
              <div className="flex-grow border-t border-gray-300" />
              <span className="mx-4 text-gray-500">or</span>
              <div className="flex-grow border-t border-gray-300" />
            </div>

            <GoogleLogin
              onSuccess={handleGoogleLogin}
              onError={() => message.error('Google login failed')}
              disabled={loading}
            />

            <div className="flex justify-center items-center mt-4">
              <span className="text-black text-sm text-center block mb-6">
                Bạn quên mật khẩu? <a className="text-blue-600" href="/forgot-password">Quên mật khẩu</a>
              </span>
            </div>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};

export default LoginPage;
