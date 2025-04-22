import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Button, Card, Pagination, Modal, message, Select, Divider } from 'antd';
import { SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import { toast } from "react-toastify";
import { useSearchParams } from "react-router-dom";
import { useSelector } from 'react-redux';
import { jwtDecode } from "jwt-decode";

import 'tailwindcss/tailwind.css';

const QuestionBank = () => {
  const navigate = useNavigate();
  // User banks states
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
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [curriculums, setCurriculums] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedCurriculum, setSelectedCurriculum] = useState(null);
  const [searchParams] = useSearchParams();

  // Default ESS banks states
  const [defaultBanks, setDefaultBanks] = useState([]);
  const [loadingDefaultBanks, setLoadingDefaultBanks] = useState(false);
  const [currentDefaultPage, setCurrentDefaultPage] = useState(1);
  const [totalDefaultBanks, setTotalDefaultBanks] = useState(0);
  const [defaultSearchQuery, setDefaultSearchQuery] = useState("");

  const token = useSelector((state) => state.token);
  
  let accid = searchParams.get("accid") || localStorage.getItem("accid");
  
  // Decode token to get AccId if available
  if (token) {
    try {
      const decoded = jwtDecode(token.token);
      accid = decoded.AccId || accid;
    } catch (error) {
      console.error("Invalid token", error);
    }
  }

  useEffect(() => {
    fetchGrades();
    fetchSubjects();
    fetchCurriculums();
  }, []);
  
  useEffect(() => {
    fetchBanks();
  }, [currentPage]);
  
  useEffect(() => {
    fetchDefaultBanks();
  }, [currentDefaultPage]);

  const fetchBanks = async () => {
    setLoading(true);
    try {
      let url = `http://localhost:7052/api/Bank/account/${accid}?`;
      if (searchQuery) url += `query=${searchQuery}&`;
      if (selectedGrade) url += `grade=${selectedGrade}&`;
      if (selectedSubject) url += `subject=${selectedSubject}&`;
      if (selectedCurriculum) url += `curriculum=${selectedCurriculum}&`;

      const response = await axios.get(url);
      setBanks(response.data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage));
      setTotalBanks(response.data.length);
    } catch (error) {
      console.error("Error fetching banks:", error);
      message.error('❌ Lỗi khi tải dữ liệu ngân hàng câu hỏi!');
    } finally {
      setLoading(false);
    }
  };

  const fetchDefaultBanks = async () => {
    setLoadingDefaultBanks(true);
    try {
      let url = `http://localhost:7052/api/Bank/default-banks?`;
      if (defaultSearchQuery) url += `query=${defaultSearchQuery}&`;
      if (selectedGrade) url += `grade=${selectedGrade}&`;
      if (selectedSubject) url += `subject=${selectedSubject}&`;
      if (selectedCurriculum) url += `curriculum=${selectedCurriculum}&`;
  
      const response = await axios.get(url);
      const filteredBanks = response.data;
  
      setDefaultBanks(filteredBanks.slice((currentDefaultPage - 1) * itemsPerPage, currentDefaultPage * itemsPerPage));
      setTotalDefaultBanks(filteredBanks.length);
    } catch (error) {
      console.error("Error fetching default banks:", error);
      message.error('❌ Lỗi khi tải dữ liệu ngân hàng đề của ESS!');
    } finally {
      setLoadingDefaultBanks(false);
    }
  };
  

  const fetchGrades = async () => {
    try {
      const res = await axios.get('http://localhost:7052/api/Bank/grades');
      setGrades(res.data);
    } catch (error) {
      console.error("Error fetching grades:", error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await axios.get('http://localhost:7052/api/Bank/subjects');
      setSubjects(res.data);
    } catch (error) {
      console.error("Error fetching subjects:", error);
    }
  };

  const fetchCurriculums = async () => {
    try {
      const res = await axios.get('http://localhost:7052/api/Bank/curriculums');
      setCurriculums(res.data);
    } catch (error) {
      console.error("Error fetching curriculums:", error);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchBanks();
  };

  const handleDefaultSearch = () => {
    setCurrentDefaultPage(1);
    fetchDefaultBanks();
  };

  const handleCreateBank = () => {
    navigate('/create-question-bank');
  };

  const handleCardClick = (id) => {
    navigate(`/question-bank-detail/${id}`);
  };

  const handleDefaultCardClick = (id) => {
    navigate(`/default-bank-detail/${id}`);
  };
  

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleDefaultPageChange = (page) => {
    setCurrentDefaultPage(page);
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
      await axios.put(`http://localhost:7052/api/Bank/${editingBank.bankId}/name`, {
        bankId: editingBank.bankId,
        bankname: newBankName
      }, {
        headers: {
          'Authorization': `Bearer ${token.token}`
        }
      });
  
      toast.success("✅ Cập nhật tên ngân hàng thành công!", 2);
      setIsEditModalOpen(false);
  
      setTimeout(() => {
        fetchBanks();
      }, 500);
    } catch (error) {
      console.error("Error updating bank:", error);
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
      
      toast.success("✅ Xóa ngân hàng câu hỏi thành công!", 2);
      setIsDeleteModalOpen(false);
  
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
        <div className="flex flex-col w-full md:w-3/4 gap-4">
          <div className="flex items-center gap-2 w-full">
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
          
          <div className="flex flex-wrap gap-2">
            <Select 
              placeholder="Khối học" 
              allowClear 
              onChange={(value) => setSelectedGrade(value)}
              style={{ width: '150px' }}
              size="middle"
            >
              {grades.map(g => <Select.Option key={g.gradeId} value={g.gradeLevel}>{g.gradeLevel}</Select.Option>)}
            </Select>
            
            <Select 
              placeholder="Môn học" 
              allowClear 
              onChange={(value) => setSelectedSubject(value)}
              style={{ width: '150px' }}
              size="middle"
            >
              {subjects.map(s => <Select.Option key={s.subjectId} value={s.subjectName}>{s.subjectName}</Select.Option>)}
            </Select>
            
            <Select 
              placeholder="Chương trình" 
              allowClear 
              onChange={(value) => setSelectedCurriculum(value)}
              style={{ width: '150px' }}
              size="middle"
            >
              {curriculums.map(c => <Select.Option key={c.curriculumId} value={c.curriculumName}>{c.curriculumName}</Select.Option>)}
            </Select>
            
            <Button icon={<SearchOutlined />} onClick={handleSearch}>
              Tìm kiếm
            </Button>
          </div>
        </div>

        <Button 
          type="primary" 
          className="bg-blue-500 hover:bg-blue-600 text-white w-full md:w-auto"
          onClick={handleCreateBank}
        >
          Tạo ngân hàng đề thi
        </Button>
       
      </div>

      {/* Ngân hàng đề của bạn Section - Now this section comes first */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Ngân hàng đề của bạn</h2>
        
        {loading ? (
          <p className="text-center text-gray-600">Đang tải dữ liệu...</p>
        ) : banks.length === 0 ? (
          <p className="text-center text-gray-600">Bạn chưa có ngân hàng câu hỏi nào.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
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
                  <div className="mt-2 text-sm">
                    <p className="text-gray-500">Khối: {bank.grade}</p>
                    <p className="text-gray-500">Môn: {bank.subject}</p>
                    <p className="text-gray-500">Chương trình: {bank.curriculum}</p>
                  </div>
                </div>

                <div className="mt-auto pt-4 flex justify-between">
                  <Button 
                    type="primary" 
                    icon={<EditOutlined />} 
                    size="small" 
                    shape="round"
                    className="bg-green-500 hover:bg-green-600 text-white w-1/2 mr-1"
                    onClick={(e) => handleEditBank(bank, e)}
                  >
                    Sửa
                  </Button>
                  <Button 
                    type="primary" 
                    danger 
                    icon={<DeleteOutlined />} 
                    size="small" 
                    shape="round"
                    className="bg-red-500 hover:bg-red-600 text-white w-1/2 ml-1"
                    onClick={(e) => handleDeleteBank(bank, e)}
                  >
                    Xóa
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="flex justify-center mt-4">
          <Pagination
            current={currentPage}
            total={totalBanks}
            pageSize={itemsPerPage}
            onChange={handlePageChange}
            showSizeChanger={false}
          />
        </div>
      </div>

      {/* Divider between sections */}
      <Divider />


{/* Ngân hàng đề của ESS Section */}
<div className="mb-12">
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-xl font-bold">Ngân hàng đề của ESS</h2>
    <div className="flex items-center gap-2">
      <Input
        placeholder="Tìm kiếm ngân hàng ESS..."
        style={{ width: '250px' }}
        value={defaultSearchQuery}
        onChange={(e) => setDefaultSearchQuery(e.target.value)}
        onPressEnter={handleDefaultSearch}
      />
      <Button icon={<SearchOutlined />} onClick={handleDefaultSearch}>
        Tìm kiếm
      </Button>
    </div>
  </div>
  {/* ✅ Bổ sung bộ lọc ở đây */}
  <div className="flex flex-wrap gap-2 mb-4">
    <Select 
      placeholder="Khối học" 
      allowClear 
      onChange={(value) => setSelectedGrade(value)}
      style={{ width: '150px' }}
      size="middle"
    >
      {grades.map(g => <Select.Option key={g.gradeId} value={g.gradeLevel}>{g.gradeLevel}</Select.Option>)}
    </Select>
    
    <Select 
      placeholder="Môn học" 
      allowClear 
      onChange={(value) => setSelectedSubject(value)}
      style={{ width: '150px' }}
      size="middle"
    >
      {subjects.map(s => <Select.Option key={s.subjectId} value={s.subjectName}>{s.subjectName}</Select.Option>)}
    </Select>
    
    <Select 
      placeholder="Chương trình" 
      allowClear 
      onChange={(value) => setSelectedCurriculum(value)}
      style={{ width: '150px' }}
      size="middle"
    >
      {curriculums.map(c => <Select.Option key={c.curriculumId} value={c.curriculumName}>{c.curriculumName}</Select.Option>)}
    </Select>
    
    <Button icon={<SearchOutlined />} onClick={handleDefaultSearch}>
      Tìm kiếm
    </Button>
  </div>

  {loadingDefaultBanks ? (
<p className="text-center text-gray-600">Đang tải dữ liệu...</p>
) : defaultBanks.length === 0 ? (
<p className="text-center text-gray-600">Không tìm thấy ngân hàng câu hỏi từ ESS.</p>
) : (
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
{defaultBanks.map((bank) => (
<Card
  key={bank.bankId}
  className="text-center shadow-lg hover:shadow-xl cursor-pointer p-4 rounded-lg border border-gray-200 flex flex-col justify-between"
  onClick={() => handleDefaultCardClick(bank.bankId)}
>
  <div>
    <h2 className="font-bold text-lg">{bank.bankName}</h2>
    <p>{bank.totalQuestion || 0} câu hỏi</p>
    <div className="mt-2 text-sm">
      <p className="text-gray-500">Khối: {bank.grade}</p>
      <p className="text-gray-500">Môn: {bank.subject}</p>
      <p className="text-gray-500">Chương trình: {bank.curriculum}</p>
    </div>
  </div>
</Card>
))}
</div>
)}

<div className="flex justify-center mt-4">
<Pagination
current={currentDefaultPage}
total={totalDefaultBanks}
pageSize={itemsPerPage}
onChange={handleDefaultPageChange}
showSizeChanger={false}
/>
</div>
      
<Modal
      title="Lỗi tải dữ liệu"
      open={loadingDefaultBanks && defaultBanks.length === 0}
      onOk={() => setLoadingDefaultBanks(false)}
      onCancel={() => setLoadingDefaultBanks(false)}
      okText="OK"
      cancelButtonProps={{ style: { display: 'none' } }}
    >
      <p>❌ Có lỗi xảy ra khi tải dữ liệu ngân hàng đề của ESS. Vui lòng thử lại.</p>
    </Modal>

    <Modal
      title="Xác nhận xóa"
      open={isDeleteModalOpen}
      onOk={confirmDeleteBank}
      onCancel={() => setIsDeleteModalOpen(false)}
      okText="Xóa"
      cancelText="Hủy"
    >
      <p>Bạn có chắc chắn muốn xóa ngân hàng "{deletingBank?.bankname}" không?</p>
    </Modal>

    <Modal
      title="Đổi tên ngân hàng"
      open={isEditModalOpen}
      onOk={handleUpdateBankName}
      onCancel={() => setIsEditModalOpen(false)}
      okText="Cập nhật"
      cancelText="Hủy"
    >
      <Input 
        value={newBankName} 
        onChange={(e) => setNewBankName(e.target.value)} 
        placeholder="Nhập tên mới cho ngân hàng"
      />
    </Modal>
  </div>



</div> 
  );
};
export default QuestionBank;
