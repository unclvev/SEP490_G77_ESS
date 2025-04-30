import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from 'antd';
import { HomeOutlined } from '@ant-design/icons';

const ErrorPage = () => {
  const navigate = useNavigate();
  const { message } = useParams();

  const decodedMessage = message ? decodeURIComponent(message) : 'Có lỗi xảy ra trong quá trình xác thực';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-red-600 mb-4">Lỗi Xác Thực</h1>
        <p className="text-gray-600 mb-6">{decodedMessage}</p>
        <Button
          type="primary"
          icon={<HomeOutlined />}
          onClick={() => navigate('/')}
          className="bg-blue-500 hover:bg-blue-600"
        >
          Về Trang Chủ
        </Button>
      </div>
    </div>
  );
};

export default ErrorPage; 