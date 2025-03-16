import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Button, Card, Pagination, Modal, message } from 'antd';
import { SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import { toast } from "react-toastify";
import { useSearchParams } from "react-router-dom";

import 'tailwindcss/tailwind.css';

const QuestionBank = () => {
  const navigate = useNavigate();
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalBanks, setTotalBanks] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState(null);
  const [deletingBank, setDeletingBank] = useState(null);
  const [newBankName, setNewBankName] = useState("");
  const itemsPerPage = 8;

  const [searchParams] = useSearchParams();
const accid = searchParams.get("accid") || localStorage.getItem("accid");


  useEffect(() => {
    fetchBanks();
  }, [currentPage]);

  const fetchBanks = async (query = "") => {
    setLoading(true);
    try {
      const url = query
        ? `https://localhost:7052/api/Bank/account/${accid}?query=${query}`
        : `https://localhost:7052/api/Bank/account/${accid}`;

      const response = await axios.get(url);
      setBanks(response.data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage));
      setTotalBanks(response.data.length);
    } catch (error) {
      message.error('❌ Lỗi khi tải dữ liệu ngân hàng câu hỏi!');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchBanks(searchQuery);
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

  const handleEditBank = (bank, e) => {
    e.stopPropagation();
    setEditingBank(bank);
    setNewBankName(bank.bankname);
    setIsEditModalOpen(true);
  };

  const handleUpdateBankName = async () => {
    if (!newBankName.trim()) {
      message.warning("⚠️ Tên ngân hàng không được để trống!");
      return;
    }
    try {
      await axios.put(`https://localhost:7052/api/Bank/${editingBank.bankId}/name`, {
        bankId: editingBank.bankId,
        bankname: newBankName
      });
  
      toast.success("✅ Cập nhật tên ngân hàng thành công!", 2); // 👈 Hiển thị trong 2 giây
      setIsEditModalOpen(false);
  
      // ⏳ Đảm bảo thông báo hiển thị trước khi làm mới dữ liệu
      setTimeout(() => {
        fetchBanks();
      }, 500);
    } catch (error) {
      toast.error("❌ Lỗi khi cập nhật ngân hàng!");
    }
  };

  const handleDeleteBank = (bank, e) => {
    e.stopPropagation();
    setDeletingBank(bank);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteBank = async () => {
    try {
      await axios.delete(`https://localhost:7052/api/Bank/${deletingBank.bankId}`);
      
      toast.success("✅ Xóa ngân hàng câu hỏi thành công!", 2); // 👈 Hiển thị trong 2 giây
      setIsDeleteModalOpen(false);
  
      // ⏳ Đợi 0.5 giây trước khi làm mới danh sách
      setTimeout(() => {
        fetchBanks();
      }, 500);
    } catch (error) {
      toast.error("❌ Lỗi khi xóa ngân hàng câu hỏi!");
    }
  };

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
      ) : banks.length === 0 ? (
        <p className="text-center text-gray-600">Không tìm thấy ngân hàng câu hỏi.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {banks.map((bank) => (
            <Card
              key={bank.bankId}
              className="text-center shadow-lg hover:shadow-xl cursor-pointer p-4 rounded-lg border border-gray-200 flex flex-col justify-between"
              onClick={() => handleCardClick(bank.bankId)}
            >
              <div>
                <h2 className="font-bold text-lg">{bank.bankname}</h2>
                <p className="text-gray-600">Ngày tạo: {formatDate(bank.createDate)}</p>
                <p>{bank.totalquestion || 0} câu hỏi</p>
              </div>

              {/* Nút Sửa & Xóa ở dưới cùng */}
              <div className="mt-auto pt-4 flex justify-between">
                <Button type="primary" icon={<EditOutlined />} size="small" shape="round"
                  className="bg-green-500 hover:bg-green-600 text-white w-1/2"
                  onClick={(e) => handleEditBank(bank, e)}>
                  Sửa
                </Button>
                <Button type="primary" danger icon={<DeleteOutlined />} size="small" shape="round"
                  className="bg-red-500 hover:bg-red-600 text-white w-1/2"
                  onClick={(e) => handleDeleteBank(bank, e)}>
                  Xóa
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="flex justify-center mt-6">
        <Pagination
          current={currentPage}
          total={totalBanks}
          pageSize={itemsPerPage}
          onChange={handlePageChange}
          showSizeChanger={false}
        />
      </div>

      <Modal title="Chỉnh sửa tên ngân hàng" open={isEditModalOpen} onOk={handleUpdateBankName} onCancel={() => setIsEditModalOpen(false)}>
        <Input value={newBankName} onChange={(e) => setNewBankName(e.target.value)} placeholder="Nhập tên ngân hàng mới" />
      </Modal>

      <Modal title="Xác nhận xóa" open={isDeleteModalOpen} onOk={confirmDeleteBank} onCancel={() => setIsDeleteModalOpen(false)} okText="Xóa" cancelText="Hủy">
        <p>Bạn có chắc chắn muốn xóa ngân hàng này không?</p>
      </Modal>
    </div>
  );
};

export default QuestionBank;
