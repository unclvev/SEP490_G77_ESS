import { GoogleOutlined } from '@ant-design/icons';
// import axios from 'axios';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    // // Hàm xử lý đăng nhập thông thường
    // const handleLogin = async () => {
    //     try {
    //         const response = await axios.post('http://localhost:5095/api/Login', {
    //             username,
    //             password
    //         });
    //         localStorage.setItem('jwt', response.data.jwt);
    //         window.location.href = '/';
    //     } catch (error) {
    //         setErrorMessage('Invalid username or password');
    //     }
    // };

    // // Xử lý đăng nhập bằng Google
    // const handleGoogleLogin = async (response) => {
    //     try {
    //         const res = await axios.post('http://localhost:5095/api/GoogleLogin', {
    //             token: response.credential,
    //         });
    //         localStorage.setItem('jwt', res.data.jwt);
    //         window.location.href = '/';
    //     } catch (error) {
    //         setErrorMessage('Google login failed');
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
                           Bạn chưa có tài khoản ? <a className='text-blue-600' href='/register'>Tạo tài khoản</a>
                        </span>

                        <input
                            type="text"
                            placeholder="Email hoặc tên"
                            className="w-full px-3 py-2 border border-gray-300 rounded-full mb-4"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        <input
                            type="password"
                            placeholder="Mật khẩu"
                            className="w-full px-3 py-2 border border-gray-300 rounded-full mb-4"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        {errorMessage && (
                            <div className="text-red-500 text-sm mb-4">{errorMessage}</div>
                        )}
                        <button
                            // onClick={handleLogin}
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
                            // onSuccess={handleGoogleLogin}
                            onError={() => setErrorMessage('Google login failed')}
                            render={(renderProps) => (
                                <button
                                    onClick={renderProps.onClick}
                                    className="w-full bg-red-500 text-gray-700 py-2 rounded-full hover:bg-red-600 mb-2 flex items-center justify-center border border-gray-300"
                                >
                                    <GoogleOutlined className="mr-2" size={20} />
                                    Continue with Google
                                </button>
                            )}
                        />

                        <div className="flex justify-center items-center mt-4">
                            {/* <input type="checkbox" id="stay-signed-in" className="mr-2" />
                            <label htmlFor="stay-signed-in" className="text-xl text-black">Bạn quên mật khẩu ?</label> */}
                            <span className="text-black text-sm text-center block mb-6">
                                Bạn chưa có quên mật khẩu ? <a className='text-blue-600' href='/forgot-password'>Quên mật khẩu</a>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </GoogleOAuthProvider>
    );
};

export default LoginPage;