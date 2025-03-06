import React, { useEffect, useState } from "react";
import { Card, Button, Input, Spin, message, Modal } from "antd";
import { SettingOutlined, EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { delExam, getExams, updateExam } from "../../services/api";

const ExamManagement = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [examid, setExamid] = useState(null);
  const [newName, setNewExamName] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getExams();
        setLoading(false);
        setExams(response.data);
      }catch (error){
        console.log('Error fetching exams:'. error);
      }
    };

    fetchData();
  }, []);

  

  const deleteExamById = async (examid) => {
    try {
      const response = await delExam(examid);

      if (!response.ok) {
        // xử lí ko thành công
      }else{
        message.success("Xóa đề thi thành công!");
        setExams((prevExams) => prevExams.filter((exam) => exam.examId !== examid));
        setDeleteModalVisible(false);
      }

      
    } catch (error) {
      console.log('Can not delete the exam:', error);
    }
  };

  const showDeleteModal = (examId) => {
    setExamid(examId);
    setDeleteModalVisible(true);
  };

  const showEditModal = (examId, currentName) => {
    setExamid(examId);
    setNewExamName(currentName);
    setEditModalVisible(true);
  };

  const updateExamName = async () => {
    if (!newName.trim()) {
      message.warning("Tên đề thi không được để trống!");
      return;
    }

    try {
      const response = await updateExam(examid, newName);

      if (!response.ok) {
        // xử lí thất bại
      }else{
        // xử lí thành công
        message.success("Cập nhật tên đề thi thành công!");
        setExams((prevExams) =>
          prevExams.map((exam) =>
            exam.examId === examid ? { ...exam, examname: newName } : exam
          )
        );
        setEditModalVisible(false);
      }

      
    } catch (error) {
      console.log('Can not update the exam:', error);
    }
  };

  return (
    <div style={{ padding: 20, backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
      <h2 style={{ textAlign: "center" }}>QUẢN LÍ ĐỀ THI</h2>

      <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
        <Input.Search placeholder="Tìm kiếm đề thi..." style={{ width: 300 }} />
      </div>

      <h3>ĐỀ CỦA BẠN</h3>
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 50 }}>
          <Spin size="large" />
        </div>
      ) : (
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {exams.length > 0 ? (
            exams.map((exam) => (
              <Card
  key={exam.examId}
  title={exam.examname}
  style={{ width: 250, cursor: "pointer" }}
  hoverable
  onClick={() => navigate(`/exam/content?id=${exam.examId}`)}
>
  <p>Ngày tạo: {exam.createdate}</p>
  <div style={{ display: "flex", justifyContent: "space-between" }}>
    <Button 
      icon={<EditOutlined />} 
      onClick={(e) => {
        e.stopPropagation(); // Ngăn chặn sự kiện click từ Card
        showEditModal(exam.examId, exam.examname);
      }}
    >
      Chỉnh sửa
    </Button>
    <Button 
      icon={<DeleteOutlined />} 
      danger 
      onClick={(e) => {
        e.stopPropagation(); // Ngăn chặn sự kiện click từ Card
        showDeleteModal(exam.examId);
      }}
    >
      Xóa
    </Button>
  </div>
</Card>

            ))
          ) : (
            <p>Không có đề thi nào.</p>
          )}
        </div>
      )}

      <Modal
        title="Chỉnh sửa tên đề thi"
        open={editModalVisible}
        onOk={updateExamName}
        onCancel={() => setEditModalVisible(false)}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Input
          value={newName}
          onChange={(e) => setNewExamName(e.target.value)}
          placeholder="Nhập tên mới"
        />
      </Modal>

      <Modal
        title="Xác nhận xóa"
        open={deleteModalVisible}
        onOk={deleteExamById}
        onCancel={() => setDeleteModalVisible(false)}
        okText="Xóa"
        cancelText="Hủy"
        okType="danger"
      >
        <p>Bạn có chắc chắn muốn xóa đề thi này không? Thao tác này không thể hoàn tác.</p>
      </Modal>
    </div>
  );
};

export default ExamManagement;
