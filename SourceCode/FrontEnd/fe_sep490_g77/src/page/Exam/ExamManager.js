import React from "react";
import { Card, Dropdown, Menu, Button, Input } from "antd";
import { SettingOutlined, EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const exams = [
  { id: 1, title: "Đề toán 12A1 - kiểm tra 15p", date: "11/02/2025 19:01" },
  { id: 2, title: "Đề toán 12A2 - kiểm tra 1 tiết", date: "11/02/2025 19:01" },
  { id: 3, title: "Đề toán 10A5 - kiểm tra 15p", date: "11/02/2025 19:01" },
];

const ExamManagement = () => {
  const navigate = useNavigate();

  const menu = (
    <Menu>
      <Menu.Item key="1" icon={<EditOutlined />}>
        Tổ chức thi
      </Menu.Item>
      <Menu.Item key="2" icon={<EditOutlined />}>
        Chỉnh sửa
      </Menu.Item>
      <Menu.Item key="3" icon={<DeleteOutlined />} danger>
        Xóa
      </Menu.Item>
    </Menu>
  );

  return (
    <div style={{ padding: 20, backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
      <h2 style={{ textAlign: "center" }}>QUẢN LÍ ĐỀ THI</h2>

      <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
        <Input.Search placeholder="Tìm kiếm đề thi..." style={{ width: 300 }} />
      </div>

      <h3>ĐỀ CỦA BẠN</h3>
      <div style={{ display: "flex", gap: 16 }}>
        {exams.map((exam) => (
          <Card
            key={exam.id}
            title={exam.title}
            extra={
              <Dropdown overlay={menu} trigger={["click"]}>
                <SettingOutlined style={{ cursor: "pointer" }} />
              </Dropdown>
            }
            style={{ width: 250, cursor: "pointer" }}
            hoverable
            onClick={() => navigate(`/exam/content?id=${exam.id}`)}
          >
            <p>Ngày tạo: {exam.date}</p>
          </Card>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
        <Button type="primary" style={{ marginRight: 10 }}>
          Tạo đề từ ngân hàng câu hỏi chung
        </Button>
        <Button type="primary" style={{ backgroundColor: "green", borderColor: "green" }}>
          Tạo đề thi
        </Button>
      </div>
    </div>
  );
};

export default ExamManagement;
