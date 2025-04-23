// src/page/Common/ResetPasswordPage.jsx

import React, { useState } from 'react';
import { Input, Button } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { resetPassword } from '../../services/api';

const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const handleChangePassword = async () => {
    if (loading) return;

    // 1. Validate
    if (!password || !confirmPassword) {
      return toast.error('Vui lòng nhập đầy đủ mật khẩu!');
    }
    if (password !== confirmPassword) {
      return toast.error('Mật khẩu nhập lại không khớp!');
    }
    if (!token) {
      return toast.error('Token không hợp lệ hoặc đã hết hạn!');
    }

    setLoading(true);
    try {
      // 2. Gọi API với body JSON
      const res = await resetPassword({ token, newPassword: password });

      // 3. Thông báo thành công và chuyển về login sau 2s
      toast.success(res.data || 'Đã cập nhật thành công!', {
        autoClose: 2000,
        onClose: () => navigate('/login'),
      });
    } catch (err) {
      const msg = err.response?.data?.message || 'Cập nhật mật khẩu thất bại!';
      toast.error(msg, { autoClose: 2000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-100 to-white">
      <div className="flex flex-col items-center mb-8">
        <LockOutlined style={{ fontSize: 48, color: '#1890ff' }} />
        <h1 className="text-3xl font-bold mt-4 mb-2">THAY ĐỔI MẬT KHẨU</h1>
        <p className="text-gray-600">Hãy nhập mật khẩu mới của bạn</p>
      </div>

      <div className="w-80 flex flex-col items-center">
        <Input.Password
          placeholder="Mật khẩu"
          className="rounded-full py-2 px-4 mb-4 focus:ring-2 focus:ring-blue-500"
          value={password}
          onChange={e => setPassword(e.target.value)}
          disabled={loading}
        />

        <Input.Password
          placeholder="Nhập lại mật khẩu"
          className="rounded-full py-2 px-4 mb-4 focus:ring-2 focus:ring-blue-500"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          disabled={loading}
        />

        <Button
          type="primary"
          className="w-full rounded-full mb-2"
          onClick={handleChangePassword}
          loading={loading}
          disabled={loading}
        >
          {loading ? 'Đang xử lý...' : 'Thay đổi'}
        </Button>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
