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
    dob: '',       // đổi từ datejoin -> dob
    phone: '',
    password: '',
    rePassword: '',
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    // Kiểm tra mật khẩu xác nhận
    if (info.password !== info.rePassword) {
      toast.error('Mật khẩu xác nhận không khớp!');
      console.log('Lỗi: Mật khẩu xác nhận không khớp!');
      return;
    }

    // Chuẩn bị payload theo đúng DTO bên backend
    const payload = {
      username: info.username,
      email: info.email,
      phone: info.phone,
      dob: info.dob,               // gửi dob vào backend
      password: info.password,     // backend sẽ hash lại
    };

    try {
      const response = await register(payload);
      console.log('Phản hồi từ API:', response);

      if (response.status === 200) {
        toast.success('Đăng ký thành công! Vui lòng kiểm tra email để xác thực.');
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
          borderRadius: '0 10px 10px 0',
          overflow: 'hidden',
          margin: 'auto'
        }}
      ></div>
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <Card title="Tạo tài khoản cho riêng bạn" className="w-full max-w-md">
          <form className="space-y-4 mt-4" onSubmit={handleRegister}>
            <Input
              type="text"
              name="username"
              placeholder="Tên đăng nhập"
              value={info.username}
              onChange={handleChange}
              required
            />
            <Input
              type="email"
              name="email"
              placeholder="Email"
              value={info.email}
              onChange={handleChange}
              required
            />
            <Input
              type="date"
              name="dob"                     // đặt name là dob
              placeholder="Ngày sinh"
              value={info.dob}
              onChange={handleChange}
              required
            />
            <Input
              type="text"
              name="phone"
              placeholder="Số điện thoại"
              value={info.phone}
              onChange={handleChange}
              required
            />
            <Input
              type="password"
              name="password"
              placeholder="Mật khẩu"
              value={info.password}
              onChange={handleChange}
              required
            />
            <Input
              type="password"
              name="rePassword"
              placeholder="Xác nhận mật khẩu"
              value={info.rePassword}
              onChange={handleChange}
              required
            />
            <Button type="primary" htmlType="submit" className="w-full mt-4">
              Tạo tài khoản
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
