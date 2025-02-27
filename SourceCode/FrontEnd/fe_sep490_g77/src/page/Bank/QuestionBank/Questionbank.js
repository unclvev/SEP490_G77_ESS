import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Button, Card, Pagination } from 'antd';
import { SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import 'tailwindcss/tailwind.css';

const QuestionBank = () => {
  const navigate = useNavigate();
  const [banks, setBanks] = useState([]); // Dữ liệu ngân hàng câu hỏi từ API
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(""); // Trạng thái tìm kiếm

  useEffect(() => {
    fetchBanks();
  }, []);

  const fetchBanks = async (query = "") => {
    setLoading(true);
    try {
      const url = query 
        ? `http://localhost:5000/api/Bank/search?query=${query}` 
        : `http://localhost:5000/api/Bank`;
      const response = await axios.get(url);
      setBanks(response.data);
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu ngân hàng câu hỏi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchBanks(searchQuery);
  };

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
        {/* 🔹 Nút Search có kích thước dài hơn */}
        <div className="flex items-center gap-2 w-full md:w-1/2">
          <Input 
            placeholder="Nhập tên ngân hàng câu hỏi..." 
            className="w-full" 
            size="large" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onPressEnter={handleSearch} // Bấm Enter để tìm kiếm
          />
          <Button 
            type="primary" 
            icon={<SearchOutlined />} 
            size="large"
            onClick={handleSearch}
          />
        </div>

        <Button type="primary" className="bg-blue-500 hover:bg-blue-600 text-white" onClick={handleCreateBank}>
          Tạo ngân hàng đề thi
        </Button>
      </div>

      {loading ? (
        <p className="text-center text-gray-600">Đang tải dữ liệu...</p>
      ) : banks.length === 0 ? (
        <p className="text-center text-gray-600">Không tìm thấy ngân hàng câu hỏi.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {banks.map((bank) => (
            <Card 
              key={bank.bankId} 
              className="text-center shadow hover:shadow-md cursor-pointer p-4" 
              onClick={() => handleCardClick(bank.bankId)}
            >
              <h2 className="font-bold text-lg mb-2">{bank.bankname}</h2>
              <p>Ngày tạo: {bank.createDate}</p>
              <p>{bank.totalquestion} câu hỏi</p>

              <div className="flex justify-center mt-4 gap-2">
                <Button 
                  type="primary" 
                  icon={<EditOutlined />} 
                  size="small" 
                  shape="round" 
                  className="bg-green-500 hover:bg-green-600"
                  onClick={(e) => { e.stopPropagation(); }}
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
                  onClick={(e) => { e.stopPropagation(); }}
                >
                  Xóa
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="flex justify-center">
        <Pagination defaultCurrent={1} total={50} />
      </div>
    </div>
  );
};

export default QuestionBank;
