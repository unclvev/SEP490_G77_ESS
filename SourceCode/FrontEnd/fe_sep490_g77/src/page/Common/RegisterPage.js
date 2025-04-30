import { Button, Card, Input } from 'antd';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../../services/api';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const RegistrationPage = () => {
  const [info, setInfo] = useState({
    username: '',
    email: '',
    dob: '',       
    phone: '',
    password: '',
    rePassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInfo((prev) => ({ ...prev, [name]: value }));
    setErrorMessage(''); // Clear error message when user types
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    // Kiểm tra mật khẩu xác nhận
    if (info.password !== info.rePassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp!');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    // Chuẩn bị payload theo đúng DTO bên backend
    const payload = {
      username: info.username,
      email: info.email,
      phone: info.phone,
      dob: info.dob,               
      password: info.password,     
    };

    try {
      const response = await register(payload);
      console.log('Phản hồi từ API:', response);

      if (response.status === 200) {
        toast.success('Đăng ký thành công! Vui lòng kiểm tra email để xác thực.', {
          autoClose: 2000,
          onClose: () => navigate('/login')
        });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Đăng ký thất bại!';
      setErrorMessage(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative h-screen flex">
      <div className="absolute top-4 left-4">
        <Link to="/">
          <img width="120" src="/images/logo.svg" alt="Logo" />
        </Link>
      </div>
      <div
        className="flex-1 bg-cover bg-center bg-no-repeat border-r-4 border-gray-300 flex items-center justify-center"
        style={{
          width: '50%',
          height: '80vh',
          backgroundImage:
            'url(https://kissenglishcenter.com/wp-content/uploads/2022/05/1694-840x450.jpeg)',
          borderRadius: '0 10px 10px 0',
          overflow: 'hidden',
          margin: 'auto'
        }}
      ></div>
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <Card title="Tạo tài khoản cho riêng bạn" className="w-full max-w-md">
          {errorMessage && (
            <div className="text-red-500 mb-4 text-center">{errorMessage}</div>
          )}
          <form onSubmit={handleRegister}>
            <Input
              type="text"
              name="username"
              placeholder="Tên đăng nhập"
              value={info.username}
              onChange={handleChange}
              disabled={loading}
              className="mb-4"
            />
            <Input
              type="email"
              name="email"
              placeholder="Email"
              value={info.email}
              onChange={handleChange}
              disabled={loading}
              className="mb-4"
            />
            <Input
              type="date"
              name="dob"
              placeholder="Ngày sinh"
              value={info.dob}
              onChange={handleChange}
              disabled={loading}
              className="mb-4"
            />
            <Input
              type="text"
              name="phone"
              placeholder="Số điện thoại"
              value={info.phone}
              onChange={handleChange}
              disabled={loading}
              className="mb-4"
            />
            <Input
              type="password"
              name="password"
              placeholder="Mật khẩu"
              value={info.password}
              onChange={handleChange}
              disabled={loading}
              className="mb-4"
            />
            <Input
              type="password"
              name="rePassword"
              placeholder="Xác nhận mật khẩu"
              value={info.rePassword}
              onChange={handleChange}
              disabled={loading}
              className="mb-4"
            />
            <Button 
              type="primary" 
              htmlType="submit" 
              className="w-full mt-4"
              loading={loading}
              disabled={loading}
            >
              {loading ? 'Đang đăng ký...' : 'Tạo tài khoản'}
            </Button>
            <span className="text-black text-sm text-center block mb-6">
              Bạn đã có tài khoản?{' '}
              <Link className="text-blue-600" to="/login">
                Đăng nhập
              </Link>
            </span>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default RegistrationPage;