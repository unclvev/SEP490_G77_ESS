// ✅ CreateEssayExam.js
import React, { useEffect, useState } from "react";
import {
  Input,
  Select,
  Button,
  Card,
  Pagination,
  Row,
  Col,
  Modal,
  Form,
  message,
  Popconfirm,
} from "antd";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const { Search } = Input;
const { Option } = Select;

const CreateEssayExam = () => {
  const [data, setData] = useState([]);
  const [searchParams] = useSearchParams();
  const accId = searchParams.get("accid");
  const [searchText, setSearchText] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [form] = Form.useForm();
  const [gradeOptions, setGradeOptions] = useState([]);
  const [subjectOptions, setSubjectOptions] = useState([]);

  const pageSize = 8;
  const navigate = useNavigate();

  const fetchFilters = async () => {
    try {
      const [gradeRes, subjectRes] = await Promise.all([
        axios.get("https://localhost:7052/api/essay/grades"),
        axios.get("https://localhost:7052/api/essay/subjects"),
      ]);
      setGradeOptions(gradeRes.data);
      setSubjectOptions(subjectRes.data);
    } catch (error) {
      console.error("❌ Lỗi khi load filter:", error);
    }
  };

  const fetchData = async () => {
    if (!accId) return;
    try {
      const params = { accId };
      if (selectedGrade) params.grade = selectedGrade;
      if (selectedSubject) params.subject = selectedSubject;
      if (searchText) params.keyword = searchText;

      const url = `https://localhost:7052/api/essay/by-account/${accId}`;
      const response = await axios.get(url, { params });
      setData(response.data);
      setCurrentPage(1);
    } catch (error) {
      console.error("❌ Lỗi khi tải danh sách đề:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`https://localhost:7052/api/essay/delete/${id}`);
      toast.success("Đã xoá đề");
      fetchData();
    } catch {
      toast.error("Lỗi khi xoá đề");
    }
  };

  const handleEdit = async (values) => {
    const payload = {
      examname: values.title,
      classname: values.nameClass,
      grade: values.grade,
      subject: values.subject,
    };

    try {
      await axios.put(`https://localhost:7052/api/essay/update/${editingExam.id}`, payload);
      toast.success("Cập nhật đề thành công");
      setEditModalOpen(false);
      fetchData();
    } catch {
      message.error("Lỗi khi cập nhật đề");
    }
  };

  const openEditModal = (item) => {
    setEditingExam(item);
    setEditModalOpen(true);
    form.setFieldsValue({
      title: item.title,
      nameClass: item.nameClass,
      grade: item.grade,
      subject: item.subject,
    });
  };

  useEffect(() => {
    if (accId) fetchData();
    fetchFilters();
  }, [accId]);

  const paginatedData = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  return (
    <div className="p-6">
      <div className="flex flex-wrap gap-4 mb-6">
        <Search
          placeholder="Tìm đề theo tên..."
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          className="w-64"
        />
        <Select placeholder="Chọn khối" className="w-40" allowClear onChange={setSelectedGrade}>
          {gradeOptions.map((g) => (
            <Option key={g} value={g}>
              {g}
            </Option>
          ))}
        </Select>
        <Select placeholder="Chọn môn" className="w-40" allowClear onChange={setSelectedSubject}>
          {subjectOptions.map((s) => (
            <Option key={s} value={s}>
              {s}
            </Option>
          ))}
        </Select>
        <Button type="default" onClick={fetchData}>
          Tìm kiếm
        </Button>
        <Button type="primary" onClick={() => navigate(`/essay/create?accid=${accId}`)}>
          Tạo đề
        </Button>
      </div>
  
      <Row gutter={[16, 16]}>
        {paginatedData.map((item) => (
          <Col key={item.id} xs={24} sm={12} md={6}>
            <Card
              title={
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{item.title}</span>
                  <div className="space-x-2">
                    <Button
                      className="font-semibold"
                      type="link"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(item);
                      }}
                    >
                      Sửa
                    </Button>
                    <Popconfirm
                      className="font-semibold"
                      title="Bạn có chắc chắn muốn xoá đề này?"
                      okText="Xoá"
                      cancelText="Hủy"
                      onConfirm={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id);
                      }}
                      onCancel={(e) => e?.stopPropagation()}
                    >
                      <Button type="link" danger size="small" onClick={(e) => e.stopPropagation()}>
                        Xoá
                      </Button>
                    </Popconfirm>
                  </div>
                </div>
              }
              className="rounded-xl shadow-md cursor-pointer hover:border-blue-500"
              onClick={() => navigate(`/exam/analysis/${item.id}`)}
            >
              <p className="font-semibold">{item.grade} - {item.subject}</p>
              <div className="text-sm text-gray-500 flex justify-between">
                <span className="font-semibold">Ngày tạo</span>
                <span className="font-semibold">{new Date(item.createdDate).toLocaleDateString()}</span>
              </div>

              <div className="text-sm text-gray-500 flex justify-between">
                <span className="font-semibold">Lớp</span>
                <span className="font-semibold">{item.nameClass}</span>
              </div>
              <div className="mt-4 flex justify-between">
                <Button
                  type="primary"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/essay/import/${item.id}`);
                  }}
                >
                  Đẩy danh sách học sinh
                </Button>
                <Button
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/essay/genqr", {
                      state: {
                        title: item.title,
                        createdDate: item.createdDate,
                        grade: item.grade,
                        subject: item.subject,
                        nameClass: item.nameClass,
                      },
                    });
                  }}
                >
                  Tạo mã QR
                </Button>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
  
      <div className="mt-6 text-center">
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={data.length}
          onChange={(page) => setCurrentPage(page)}
        />
      </div>
  
      <Modal
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onOk={() => form.submit()}
        title="Sửa đề"
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form layout="vertical" onFinish={handleEdit} form={form}>
          <Form.Item
            name="title"
            label="Tên đề"
            rules={[{ required: true, message: "Vui lòng nhập tên đề" }]}
          >
            <Input placeholder="VD: Đề kiểm tra 15p Toán" />
          </Form.Item>
  
          <Form.Item
            name="nameClass"
            label="Lớp"
            rules={[{ required: true, message: "Vui lòng nhập lớp" }]}
          >
            <Input placeholder="VD: 11A2" />
          </Form.Item>
  
          <Form.Item
            name="grade"
            label="Khối"
            rules={[{ required: true, message: "Vui lòng chọn khối" }]}
          >
            <Select placeholder="Chọn khối">
              {gradeOptions.map((g) => (
                <Option key={g} value={g}>
                  {g}
                </Option>
              ))}
            </Select>
          </Form.Item>
  
          <Form.Item
            name="subject"
            label="Môn học"
            rules={[{ required: true, message: "Vui lòng chọn môn" }]}
          >
            <Select placeholder="Chọn môn">
              {subjectOptions.map((s) => (
                <Option key={s} value={s}>
                  {s}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
export default CreateEssayExam;
