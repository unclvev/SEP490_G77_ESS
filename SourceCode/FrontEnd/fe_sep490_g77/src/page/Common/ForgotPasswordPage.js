import React, { useState } from 'react';
import { Input, Button } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');

  // Xử lý khi người dùng bấm Xác nhận
  const handleConfirm = () => {
    console.log('Email:', email);
    // TODO: Gửi email lên server để xử lý quên mật khẩu
  };

  return (
    // Thay nền trắng bằng gradient nhẹ từ xanh nhạt xuống trắng
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-100 to-white">
      
      {/* Biểu tượng và Tiêu đề */}
      <div className="flex flex-col items-center mb-8">
        <LockOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
        <h1 className="text-3xl font-bold mt-4 mb-2">QUÊN MẬT KHẨU</h1>
        <p className="text-gray-600">Vui lòng nhập email để khôi phục mật khẩu</p>
      </div>

      {/* Khu vực nhập Email và nút Xác nhận */}
      <div className="w-80 flex flex-col items-center">
        <Input
          placeholder="Email"
          className="rounded-full py-2 px-4 mb-4 border-none focus:ring-2 focus:ring-blue-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ boxShadow: 'none' }}
        />

        <Button
          type="primary"
          className="w-full rounded-full mb-2"
          onClick={handleConfirm}
        >
          Xác nhận
        </Button>

        {/* Liên kết quay lại trang Đăng nhập */}
        <div className="text-center mt-2">
          <span>Quay lại trang </span>
          <Link to="/login" className="text-blue-600 hover:text-blue-800">
            Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
