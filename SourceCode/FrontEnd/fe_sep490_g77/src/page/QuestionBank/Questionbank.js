import React from 'react';
import { Input, Button, Card, Pagination } from 'antd';
import { SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import 'tailwindcss/tailwind.css';

const QuestionBank = () => {
  // Dữ liệu mẫu
  const questionBanks = [
    {
      id: 1,
      title: 'Ngân hàng câu hỏi toán 10',
      createdAt: '11/02/2025 19:01',
      count: 20,
    },
    {
      id: 2,
      title: 'Ngân hàng câu hỏi lý 11',
      createdAt: '11/02/2025 19:01',
      count: 25,
    },
    {
      id: 3,
      title: 'Ngân hàng câu hỏi hóa 12',
      createdAt: '11/02/2025 19:01',
      count: 30,
    },
    {
      id: 4,
      title: 'Ngân hàng câu hỏi sinh 10',
      createdAt: '11/02/2025 19:01',
      count: 15,
    },
  ];

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      {/* Tiêu đề */}
      <h1 className="text-2xl md:text-3xl font-bold mb-8 text-center">
        QUẢN LÝ NGÂN HÀNG CÂU HỎI
      </h1>

      {/* Thanh tìm kiếm + nút tạo ngân hàng */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        {/* Thanh tìm kiếm bên trái (rút gọn) */}
        <div className="flex items-center gap-2">
          <Input placeholder="Search..." className="w-24" size="small" />
          <Button type="primary" icon={<SearchOutlined />} shape="circle" size="small" />
        </div>

        {/* Nút tạo ngân hàng bên phải */}
        <Button type="primary" className="bg-blue-500 hover:bg-blue-600 text-white">
          Tạo ngân hàng đề thi
        </Button>
      </div>

      {/* Danh sách card */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {questionBanks.map((bank) => (
          <Card key={bank.id} className="text-center shadow hover:shadow-md">
            <h2 className="font-bold text-lg mb-2">{bank.title}</h2>
            <p>Ngày tạo: {bank.createdAt}</p>
            <p>{bank.count} câu hỏi</p>
            {/* Nút edit và delete với màu sắc nổi bật */}
            <div className="flex justify-center mt-4 gap-2">
              <Button
                type="primary"
                icon={<EditOutlined />}
                size="small"
                shape="round"
                className="bg-green-500 hover:bg-green-600"
              >
                Sửa
              </Button>
              <Button
                type="primary"
                danger
                icon={<DeleteOutlined />}
                size="small"
                shape="round"
                className="bg-red-500 hover:bg-red-600"
              >
                Xóa
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Phân trang */}
      <div className="flex justify-center">
        <Pagination defaultCurrent={1} total={50} />
      </div>
    </div>
  );
};

export default QuestionBank;