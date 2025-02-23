import React from 'react';
import { Button } from 'antd';
import 'tailwindcss/tailwind.css';

const QuestionBankDetail = () => {
  // Ví dụ dữ liệu mô phỏng
  const detail = {
    id: 2,
    title: 'NGÂN HÀNG CÂU HỎI TOÁN 2',
    structure: [
      'Số và phép tính',
      'Số tự nhiên',
      'Các phép tính với số tự nhiên',
      'Hình học và đo lường',
      'Hình học trực quan',
      'Hình phẳng và hình không gian',
      'Hình học tọa độ',
      'Một số yếu tố thống kê và xác suất',
      'Một số yếu tố xác suất'
    ]
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      {/* Tiêu đề trang */}
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center">
        {detail.title}
      </h1>

      {/* Khu vực 2 nút bên phải (Tạo câu hỏi, Nhập câu hỏi) */}
      <div className="flex justify-end gap-4 mb-6">
        <Button type="primary" className="bg-blue-500 hover:bg-blue-600 text-white">
          + Tạo câu hỏi trong ngân hàng
        </Button>
        <Button className="bg-blue-100 hover:bg-blue-200">
          + Nhập câu hỏi
        </Button>
      </div>

      {/* Nhóm 3 nút chức năng (Cấu trúc, Phân quyền, Xem số lượng câu hỏi) */}
      <div className="flex gap-4 mb-8">
        <Button type="primary">Cấu trúc</Button>
        <Button>Phân quyền</Button>
        <Button>Xem số lượng câu hỏi</Button>
      </div>

      {/* Nội dung Cấu trúc (dạng bullet list) */}
      <div className="bg-white p-4 shadow-md rounded">
        <h2 className="text-xl font-semibold mb-4">Cấu trúc ngân hàng câu hỏi</h2>
        <ul className="list-disc list-inside space-y-1">
          {detail.structure.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default QuestionBankDetail;