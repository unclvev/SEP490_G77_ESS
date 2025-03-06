import { GoogleOutlined } from '@ant-design/icons';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { message } from 'antd';
import { login } from '../../services/api';
import {useSelector, useDispatch} from 'react-redux'


const LoginPage = () => {
    const token = useSelector(state => state.token);
    const [credentials, setCredentials] = useState({
        username: '',
        password: ''
    });

    const [errorMessage, setErrorMessage] = useState('');

    // Xử lý đăng nhập thông thường
    const handleLogin = async () => {
        try {
            const response = await login(credentials);

            //save to redux
            dispatch(setToken(response.data));
            localStorage.setItem('jwt', response.data.jwt);
            message.success('Login successful!');
            window.location.href = '/';
        } catch (error) {
            message.error('Invalid username or password');
        }
    };

    // Xử lý đăng nhập bằng Google
    // const handleGoogleLogin = async (response) => {
    //     try {
    //         const res = await googleLogin({ token: response.credential });
    //         localStorage.setItem('jwt', res.data.jwt);
    //         message.success('Google login successful!');
    //         window.location.href = '/';
    //     } catch (error) {
    //         message.error('Google login failed');
    //     }
    // };

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
                            onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                        />
                        <input
                            type="password"
                            placeholder="Mật khẩu"
                            className="w-full px-3 py-2 border border-gray-300 rounded-full mb-4"
                            value={credentials.password}
                            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                        />
                        {errorMessage && (
                            <div className="text-red-500 text-sm mb-4">{errorMessage}</div>
                        )}
                        <button
                            onClick={handleLogin}
                            className="w-full bg-blue-600 text-white py-2 rounded-full hover:bg-blue-700 mb-4"
                        >
                            Đăng nhập
                        </button>

                        <div className="flex items-center mb-4">
                            <div className="flex-grow border-t border-gray-300" />
                            <span className="mx-4 text-gray-500">or</span>
                            <div className="flex-grow border-t border-gray-300" />
                        </div>

                        {/* Google Login Button */}
                        <GoogleLogin
                            //onSuccess={handleGoogleLogin}
                            onError={() => message.error('Google login failed')}
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
