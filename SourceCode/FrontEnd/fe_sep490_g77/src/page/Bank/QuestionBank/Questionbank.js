import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Button, Card, Pagination } from 'antd';
import { SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import 'tailwindcss/tailwind.css';

const QuestionBank = () => {
  const navigate = useNavigate();
  const [banks, setBanks] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchBanks();
  }, []);

  const fetchBanks = async (query = "") => {
    setLoading(true);
    try {
      const url = query 
        ? `https://localhost:7052/api/Bank/search?query=${query}`  
        : `https://localhost:7052/api/Bank`;  
      const response = await axios.get(url);
      setBanks(response.data);
    } catch (error) {
      console.error('❌ Lỗi khi tải dữ liệu ngân hàng câu hỏi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchBanks(searchQuery);
    setCurrentPage(1); // Reset về trang đầu sau khi tìm kiếm
  };

  const handleCreateBank = () => {
    navigate('/create-question-bank');
  };

  const handleCardClick = (id) => {
    navigate(`/question-bank-detail/${id}`);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", { 
      day: '2-digit', month: '2-digit', year: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    });
  };

  // Tính toán dữ liệu cho trang hiện tại
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBanks = banks.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <h1 className="text-2xl md:text-3xl font-bold mb-8 text-center">QUẢN LÝ NGÂN HÀNG CÂU HỎI</h1>

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-2 w-full md:w-1/2">
          <Input 
            placeholder="Nhập tên ngân hàng câu hỏi..." 
            className="w-full" 
            size="large" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onPressEnter={handleSearch} 
          />
          <Button type="primary" icon={<SearchOutlined />} size="large" onClick={handleSearch} />
        </div>

        <Button type="primary" className="bg-blue-500 hover:bg-blue-600 text-white" onClick={handleCreateBank}>
          Tạo ngân hàng đề thi
        </Button>
      </div>

      {loading ? (
        <p className="text-center text-gray-600">Đang tải dữ liệu...</p>
      ) : currentBanks.length === 0 ? (
        <p className="text-center text-gray-600">Không tìm thấy ngân hàng câu hỏi.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {currentBanks.map((bank) => (
            <Card 
              key={bank.bankId} 
              className="text-center shadow-lg hover:shadow-xl cursor-pointer p-4 rounded-lg border border-gray-200" 
              onClick={() => handleCardClick(bank.bankId)}
            >
              <h2 className="font-bold text-lg text-center">{bank.bankname}</h2>
              <p className="text-center text-gray-600">Ngày tạo: {formatDate(bank.createDate)}</p>
              <p className="text-center">{bank.totalquestion || 0} câu hỏi</p>

              <div className="flex justify-center mt-4 gap-2">
                <Button type="primary" icon={<EditOutlined />} size="small" shape="round" className="bg-green-500 hover:bg-green-600 text-white" onClick={(e) => e.stopPropagation()}>
                  Sửa
                </Button>
                <Button type="primary" danger icon={<DeleteOutlined />} size="small" shape="round" className="bg-red-500 hover:bg-red-600 text-white" onClick={(e) => e.stopPropagation()}>
                  Xóa
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="flex justify-center mt-6">
        <Pagination current={currentPage} total={banks.length} pageSize={itemsPerPage} onChange={handlePageChange} showSizeChanger={false} />
      </div>
    </div>
  );
};

export default QuestionBank;
