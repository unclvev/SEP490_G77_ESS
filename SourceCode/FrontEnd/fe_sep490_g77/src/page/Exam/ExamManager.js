import React, { useEffect, useState } from "react";
import { Card, Dropdown, Menu, Button, Input, Spin, message, Modal } from "antd";
import { SettingOutlined, EditOutlined, DeleteOutlined, PlusOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { confirm } = Modal;

const ExamManagement = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [newExamName, setNewExamName] = useState("");

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5057/api/exam"); // Cập nhật URL theo server của bạn
      const data = await response.json();
      setExams(data);
    } catch (error) {
      message.error("Lỗi khi tải danh sách đề thi!");
    } finally {
      setLoading(false);
    }
  };

  const deleteExamById = async (examId) => {
    try {
      const response = await fetch(`http://localhost:5057/api/exam/${examId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Xóa thất bại");

      message.success("Xóa đề thi thành công!");
      setExams((prevExams) => prevExams.filter((exam) => exam.examId !== examId)); // Cập nhật danh sách sau khi xóa
    } catch (error) {
      message.error("Lỗi khi xóa đề thi!");
    }
  };

  const showDeleteConfirm = (examId) => {
    confirm({
      title: "Bạn có chắc chắn muốn xóa đề thi này?",
      icon: <ExclamationCircleOutlined />,
      content: "Thao tác này không thể hoàn tác.",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk() {
        deleteExamById(examId);
      },
    });
  };

  const showEditModal = (examId, currentName) => {
    setSelectedExam(examId);
    setNewExamName(currentName);
    setEditModalVisible(true);
  };

  const updateExamName = async () => {
    if (!newExamName.trim()) {
      message.warning("Tên đề thi không được để trống!");
      return;
    }

    try {
      const response = await fetch(`http://localhost:5057/api/exam/${selectedExam}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examname: newExamName }),
      });

      if (!response.ok) throw new Error("Cập nhật thất bại");

      message.success("Cập nhật tên đề thi thành công!");
      setExams((prevExams) =>
        prevExams.map((exam) =>
          exam.examId === selectedExam ? { ...exam, examname: newExamName } : exam
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
                extra={
                  <Dropdown
                    overlay={
                      <Menu>
                        <Menu.Item key="1" icon={<EditOutlined />}>
                          Tổ chức thi
                        </Menu.Item>
                        <Menu.Item key="2" icon={<EditOutlined />} onClick={() => showEditModal(exam.examId, exam.examname)}>
                          Chỉnh sửa
                        </Menu.Item>
                        <Menu.Item
                          key="3"
                          icon={<DeleteOutlined />}
                          danger
                          onClick={() => showDeleteConfirm(exam.examId)}
                        >
                          Xóa
                        </Menu.Item>
                      </Menu>
                    }
                    trigger={["click"]}
                  >
                    <SettingOutlined style={{ cursor: "pointer" }} />
                  </Dropdown>
                }
                style={{ width: 250, cursor: "pointer" }}
                hoverable
                onClick={() => navigate(`/exam/content?id=${exam.examId}`)}
              >
                <p>Ngày tạo: {exam.createdate}</p>
              </Card>
            ))
          ) : (
            <p>Không có đề thi nào.</p>
          )}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
        <Button type="primary" style={{ marginRight: 10 }}>
          Tạo đề từ ngân hàng câu hỏi chung
        </Button>
        <Button type="primary" style={{ backgroundColor: "green", borderColor: "green" }}>
          Tạo đề thi
        </Button>
      </div>

      {/* Modal chỉnh sửa tên đề thi */}
      <Modal
        title="Chỉnh sửa tên đề thi"
        open={editModalVisible}
        onOk={updateExamName}
        onCancel={() => setEditModalVisible(false)}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Input
          value={newExamName}
          onChange={(e) => setNewExamName(e.target.value)}
          placeholder="Nhập tên mới"
        />
      </Modal>
    </div>
  );
};

export default ExamManagement;
