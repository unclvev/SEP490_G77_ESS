import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Button, Card, Pagination } from 'antd';
import { SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import 'tailwindcss/tailwind.css';

const QuestionBank = () => {
  const navigate = useNavigate();

  const questionBanks = [
    { id: 1, title: 'Ngân hàng câu hỏi toán 10', createdAt: '11/02/2025 19:01', count: 20 },
    { id: 2, title: 'Ngân hàng câu hỏi lý 11', createdAt: '11/02/2025 19:01', count: 25 },
    { id: 3, title: 'Ngân hàng câu hỏi hóa 12', createdAt: '11/02/2025 19:01', count: 30 },
    { id: 4, title: 'Ngân hàng câu hỏi sinh 10', createdAt: '11/02/2025 19:01', count: 15 },
  ];

  const handleCreateBank = () => {
    navigate('/create-question-bank');
  };

  const handleCardClick = (id) => {
    navigate(`/question-bank-detail/${id}`);
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <h1 className="text-2xl md:text-3xl font-bold mb-8 text-center">QUẢN LÝ NGÂN HÀNG CÂU HỎI</h1>

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-2">
          <Input placeholder="Search..." className="w-24" size="small" />
          <Button type="primary" icon={<SearchOutlined />} shape="circle" size="small" />
        </div>

        <Button type="primary" className="bg-blue-500 hover:bg-blue-600 text-white" onClick={handleCreateBank}>
          Tạo ngân hàng đề thi
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {questionBanks.map((bank) => (
          <Card 
            key={bank.id} 
            className="text-center shadow hover:shadow-md cursor-pointer" 
            onClick={() => handleCardClick(bank.id)} // ✅ THÊM HÀM NÀY ĐỂ ĐIỀU HƯỚNG ihihuuguguguguguguguggugugu
          >
            <h2 className="font-bold text-lg mb-2">{bank.title}</h2>
            <p>Ngày tạo: {bank.createdAt}</p>
            <p>{bank.count} câu hỏi</p>
            <div className="flex justify-center mt-4 gap-2">
              <Button 
                type="primary" 
                icon={<EditOutlined />} 
                size="small" 
                shape="round" 
                className="bg-green-500 hover:bg-green-600"
                onClick={(e) => { e.stopPropagation(); }} // 🔹 TRÁNH BẤM NHẦM KHI CHỈ MUỐN SỬA
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
                onClick={(e) => { e.stopPropagation(); }} // 🔹 TRÁNH BẤM NHẦM KHI CHỈ MUỐN XÓA
              >
                Xóa
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex justify-center">
        <Pagination defaultCurrent={1} total={50} />
      </div>
    </div>
  );
};

export default QuestionBank;
