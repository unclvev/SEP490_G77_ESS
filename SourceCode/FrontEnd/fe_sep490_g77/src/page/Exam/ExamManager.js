import React, { useEffect, useState } from "react";
import { Card, Button, Input, Spin, message, Modal } from "antd";
import { SettingOutlined, EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const ExamManagement = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [newName, setNewExamName] = useState("");

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const response = await fetch("https://localhost:7052/api/exam");
      const data = await response.json();
      setExams(data);
    } catch (error) {
      message.error("Lỗi khi tải danh sách đề thi!");
    } finally {
      setLoading(false);
    }
  };

  const deleteExamById = async () => {
    try {
      const response = await fetch(`https://localhost:7052/api/Exam/${selectedExam}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Xóa thất bại");

      message.success("Xóa đề thi thành công!");
      setExams((prevExams) => prevExams.filter((exam) => exam.examId !== selectedExam));
      setDeleteModalVisible(false);
    } catch (error) {
      message.error("Lỗi khi xóa đề thi!");
    }
  };

  const showDeleteModal = (examId) => {
    setSelectedExam(examId);
    setDeleteModalVisible(true);
  };

  const showEditModal = (examId, currentName) => {
    setSelectedExam(examId);
    setNewExamName(currentName);
    setEditModalVisible(true);
  };

  const updateExamName = async () => {
    if (!newName.trim()) {
      message.warning("Tên đề thi không được để trống!");
      return;
    }

    try {
      const response = await fetch(`https://localhost:7052/api/Exam/${selectedExam}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newName),
      });

      if (!response.ok) throw new Error("Cập nhật thất bại");

      message.success("Cập nhật tên đề thi thành công!");
      setExams((prevExams) =>
        prevExams.map((exam) =>
          exam.examId === selectedExam ? { ...exam, examname: newName } : exam
        )
      );
      setEditModalVisible(false);
    } catch (error) {
      message.error("Lỗi khi cập nhật tên đề thi!");
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
