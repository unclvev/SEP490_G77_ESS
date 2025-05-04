import React, { useEffect, useState } from "react";
import {
  Card,
  Button,
  Input,
  Spin,
  Modal,
  Tabs,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { delExam, getExams, getSharedBank, sharedExamUser, updateExam } from "../../services/api";
import { toast } from "react-toastify";

const ExamManagement = () => {
  const navigate = useNavigate();
  const [myExams, setMyExams] = useState([]);
  const [sharedExams, setSharedExams] = useState([]);
  const [allMyExams, setAllMyExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [examid, setExamid] = useState(null);
  const [newName, setNewExamName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("my");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getExams();
        setMyExams(response.data);
        setAllMyExams(response.data);
      } catch (error) {
        toast.error("Lỗi khi lấy danh sách đề thi!");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === "shared") {
      setLoading(true);
      sharedExamUser()
        .then((response) => setSharedExams(response.data))
        .catch(() => toast.error("Lỗi khi tải đề chia sẻ"))
        .finally(() => setLoading(false));
    }
  }, [activeTab]);

  const handleSearch = (value) => {
    setSearchTerm(value);
    if (value.trim() === "") {
      setMyExams(allMyExams);
    } else {
      const filtered = allMyExams.filter((exam) =>
        exam.examname.toLowerCase().includes(value.toLowerCase())
      );
      setMyExams(filtered);
    }
  };

  const deleteExamById = async () => {
    try {
      await delExam(examid);
      toast.success("Xóa đề thi thành công!");
      setMyExams((prev) => prev.filter((exam) => exam.examId !== examid));
      setAllMyExams((prev) => prev.filter((exam) => exam.examId !== examid));
      setDeleteModalVisible(false);
    } catch (error) {
      toast.error("Xóa đề thi thất bại!");
    }
  };

  const showEditModal = (id, currentName) => {
    setExamid(id);
    setNewExamName(currentName);
    setEditModalVisible(true);
  };

  const showDeleteModal = (id) => {
    setExamid(id);
    setDeleteModalVisible(true);
  };

  const updateExamName = async () => {
    if (!newName.trim()) {
      toast.warning("Tên đề thi không được để trống!");
      return;
    }

    try {
      await updateExam(examid, { newName });
      toast.success("Cập nhật thành công!");
      const updater = (list) =>
        list.map((exam) =>
          exam.examId === examid ? { ...exam, examname: newName } : exam
        );
      setMyExams(updater);
      setAllMyExams(updater);
      setEditModalVisible(false);
    } catch {
      toast.error("Cập nhật thất bại!");
    }
  };

  const renderExamCards = (list = [], editable = true) => (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
      {list.length > 0 ? (
        list.map((exam) => (
          <Card
            key={exam.examId}
            title={exam.examname}
            style={{ width: 250, cursor: "pointer" }}
            hoverable
            onClick={() =>
              navigate(`/exam/content?id=${exam.examId}`)
            }
          >
            <p>
              Ngày tạo:{" "}
              {new Date(exam.createdate).toLocaleString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })}
            </p>
            {editable && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
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
            )}
          </Card>
        ))
      ) : (
        <p>Không có đề thi nào.</p>
      )}
    </div>
  );

  return (
    <div style={{ padding: 20, backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
      <h2 style={{ textAlign: "center" }}>QUẢN LÍ ĐỀ THI</h2>

      <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
        <Input.Search
          placeholder="Tìm kiếm đề thi..."
          style={{ width: 300 }}
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          allowClear
        />
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <Tabs.TabPane tab="Đề của tôi" key="my">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3>ĐỀ CỦA BẠN</h3>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate("/exam/select")}
            >
              Tạo đề thi
            </Button>
          </div>
          {loading ? (
            <Spin size="large" style={{ display: "flex", justifyContent: "center", marginTop: 50 }} />
          ) : (
            renderExamCards(myExams, true)
          )}
        </Tabs.TabPane>

        <Tabs.TabPane tab="Đề được chia sẻ" key="shared">
          {loading ? (
            <Spin size="large" style={{ display: "flex", justifyContent: "center", marginTop: 50 }} />
          ) : (
            renderExamCards(sharedExams, false)
          )}
        </Tabs.TabPane>
      </Tabs>

      {/* Modal Chỉnh sửa */}
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

      {/* Modal Xóa */}
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
