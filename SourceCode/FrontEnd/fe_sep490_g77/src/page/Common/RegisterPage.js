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
    datejoin: '',
    phone: '',
    password: '',
    rePassword: '',
    role: 'Teacher'
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setInfo({ ...info, [e.target.name]: e.target.value });
  };

  const Register = async (e) => {
    e.preventDefault();
    if (info.password !== info.rePassword) {
      toast.error('Mật khẩu xác nhận không khớp!');
      console.log('Lỗi: Mật khẩu xác nhận không khớp!');
      return;
    }

    try {
      const response = await register(info);
      console.log('Phản hồi từ API:', response);
      
      if (response.status === 200) {
        toast.success('Đăng ký thành công!');
        console.log('Đăng ký thành công, điều hướng đến trang đăng nhập...');
        navigate('/login');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Đăng ký thất bại!';
      toast.error(errorMessage);
      console.log('Lỗi đăng ký:', error);
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
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: '0 10px 10px 0',
          overflow: 'hidden',
          margin: 'auto'
        }}
      ></div>
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <Card title="Tạo tài khoản cho riêng bạn" className="w-full max-w-md">
          <form className="space-y-4 mt-4" onSubmit={Register}>
            <Input type="text" name="username" placeholder="Tên" onChange={handleChange} />
            <Input type="email" name="email" placeholder="Email" onChange={handleChange} />
            <Input type="date" name="datejoin" onChange={handleChange} />
            <Input type="text" name="phone" placeholder="Số điện thoại" onChange={handleChange} />
            <Input type="password" name="password" placeholder="Mật khẩu" onChange={handleChange} />
            <Input
              type="password"
              name="rePassword"
              placeholder="Mật khẩu xác nhận"
              onChange={handleChange}
            />
            <Button type="primary" htmlType="submit" className="w-full mt-4">
              Tạo tài khoản
            </Button>
            <span className="text-black text-sm text-center block mb-6">
              Bạn đã có tài khoản ?{' '}
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
