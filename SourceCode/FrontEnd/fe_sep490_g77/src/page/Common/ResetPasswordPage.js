import React, { useState } from 'react';
import { Input, Button } from 'antd';
import { LockOutlined } from '@ant-design/icons';

const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleChangePassword = () => {
    // Kiểm tra mật khẩu hợp lệ, khớp nhau, v.v...
    if (!password || !confirmPassword) {
      alert('Vui lòng nhập đầy đủ mật khẩu!');
      return;
    }
    if (password !== confirmPassword) {
      alert('Mật khẩu nhập lại không khớp!');
      return;
    }
    // TODO: Gửi password lên server để xử lý thay đổi
    console.log('Mật khẩu mới:', password);
  };

  return (
    // Nền gradient nhẹ
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-100 to-white">
      
      {/* Tiêu đề & Icon */}
      <div className="flex flex-col items-center mb-8">
        <LockOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
        <h1 className="text-3xl font-bold mt-4 mb-2">THAY ĐỔI MẬT KHẨU</h1>
        <p className="text-gray-600">Hãy nhập mật khẩu mới của bạn</p>
      </div>

      {/* Khu vực nhập mật khẩu và nút thay đổi */}
      <div className="w-80 flex flex-col items-center">
        {/* Mật khẩu */}
        <Input.Password
          placeholder="Mật khẩu"
          className="rounded-full py-2 px-4 mb-4 border-none focus:ring-2 focus:ring-blue-500"
          style={{ boxShadow: 'none' }}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* Nhập lại mật khẩu */}
        <Input.Password
          placeholder="Nhập lại mật khẩu"
          className="rounded-full py-2 px-4 mb-4 border-none focus:ring-2 focus:ring-blue-500"
          style={{ boxShadow: 'none' }}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        {/* Nút Thay đổi */}
        <Button
          type="primary"
          className="w-full rounded-full mb-2"
          onClick={handleChangePassword}
        >
          Thay đổi
        </Button>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
