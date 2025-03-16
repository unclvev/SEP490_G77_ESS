import React, { useEffect, useState } from "react";
import { Card, Button, Input, Spin, Modal } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { delExam, getExams, updateExam } from "../../services/api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
      } catch (error) {
        toast.error("Lỗi khi lấy danh sách đề thi!");
        console.error("Error fetching exams:", error);
      }
    };

    fetchData();
  }, []);

  const deleteExamById = async () => {
    try {
      const response = await delExam(examid);
      if (!response.ok) {
        toast.error("Xóa đề thi thất bại!");
      } else {
        toast.success("Xóa đề thi thành công!");
        setExams((prevExams) => prevExams.filter((exam) => exam.examId !== examid));
        setDeleteModalVisible(false);
      }
    } catch (error) {
      toast.error("Không thể xóa đề thi!");
      console.error("Can not delete the exam:", error);
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
      toast.warning("Tên đề thi không được để trống!");
      return;
    }

    try {
      const response = await updateExam(examid, newName);
      if (!response.ok) {
        toast.error("Cập nhật tên đề thi thất bại!");
      } else {
        toast.success("Cập nhật tên đề thi thành công!");
        setExams((prevExams) =>
          prevExams.map((exam) =>
            exam.examId === examid ? { ...exam, examname: newName } : exam
          )
        );
        setEditModalVisible(false);
      }
    } catch (error) {
      toast.error("Không thể cập nhật tên đề thi!");
      console.error("Can not update the exam:", error);
    }
  };

  return (
    <div style={{ padding: 20, backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
      <h2 style={{ textAlign: "center" }}>QUẢN LÍ ĐỀ THI</h2>

      <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
        <Input.Search placeholder="Tìm kiếm đề thi..." style={{ width: 300 }} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3>ĐỀ CỦA BẠN</h3>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/exam/matrix")}>
          Tạo đề thi
        </Button>
      </div>

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
                      e.stopPropagation();
                      showEditModal(exam.examId, exam.examname);
                    }}
                  >
                    Chỉnh sửa
                  </Button>
                  <Button
                    icon={<DeleteOutlined />}
                    danger
                    onClick={(e) => {
                      e.stopPropagation();
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
