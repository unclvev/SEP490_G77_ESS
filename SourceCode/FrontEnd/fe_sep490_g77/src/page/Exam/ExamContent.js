import React from "react";
import { Card, Button, List, Menu, Dropdown } from "antd";
import { SettingOutlined, DeleteOutlined, UserOutlined } from "@ant-design/icons";

const examInfo = {
  title: "TÊN BÀI THI",
  createdAt: "12/02/2025 14:15",
  creator: "Hoàng Long Phạm",
  attempts: 0,
};

const questions = [
  {
    id: 1,
    question: "Hàm số y = f(x) liên tục trên R và có bảng biến thiên như hình vẽ. Mệnh đề nào sau đây là đúng?",
    image: "https://via.placeholder.com/400x150", // Thay bằng link ảnh thật
    answers: ["Hàm số đã cho có hai điểm cực trị.", "Hàm số đã cho đúng một điểm cực trị.", "Hàm số đã cho không có giá trị cực tiểu.", "Hàm số đã cho không có giá trị cực đại."],
  },
  {
    id: 2,
    question: "Cho hàm số có bảng xét dấu đạo hàm như sau. Hàm số đã cho nghịch biến trên khoảng nào dưới đây?",
    image: "https://via.placeholder.com/400x150",
    answers: ["(2; +∞).", "(0; +∞).", "(-2;0).", "(0;2)."],
  },
  {
    id: 3,
    question: "Trong các hàm số sau, hàm số đồng biến trên R là:",
    image: null,
    answers: ["f(x) = -3x².", "f(x) = -3 - x².", "f(x) = (1 / √3)x³.", "f(x) = x³ - x."],
  },
];

const menu = (
  <Menu>
    <Menu.Item key="1" icon={<SettingOutlined />}>
      Cài đặt
    </Menu.Item>
    <Menu.Item key="2" icon={<DeleteOutlined />} danger>
      Xóa
    </Menu.Item>
  </Menu>
);

const ExamDetail = () => {
  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "#f5f5f5" }}>
      {/* Sidebar */}
      <div style={{ width: 250, background: "#fff", padding: 20, borderRight: "1px solid #ddd" }}>
        <h3>{examInfo.title}</h3>
        <p>📅 Ngày tạo: {examInfo.createdAt}</p>
        <p>👤 Người tạo: {examInfo.creator}</p>
        <p>📊 Số lượt làm: {examInfo.attempts}</p>

        <Dropdown overlay={menu} trigger={["click"]}>
          <Button type="text" style={{ width: "100%", textAlign: "left" }}>
            ⚙ Cài đặt
          </Button>
        </Dropdown>
        <Button type="text" style={{ width: "100%", textAlign: "left", marginTop: 10 }}>
          📊 Thống kê
        </Button>
        <Button type="text" danger style={{ width: "100%", textAlign: "left", marginTop: 10 }}>
          🗑 Xóa
        </Button>

        <h4 style={{ marginTop: 20 }}>Phân quyền</h4>
        <List
          dataSource={["longph", "VietNguyen"]}
          renderItem={(item) => (
            <List.Item>
              <UserOutlined style={{ marginRight: 8 }} />
              {item}
            </List.Item>
          )}
        />
      </div>

      {/* Question List */}
      <div style={{ flex: 1, padding: 20, overflowY: "auto" }}>
        {questions.map((q, index) => (
          <Card key={q.id} title={`Câu ${index + 1}`} style={{ marginBottom: 20, border: "2px solid #007bff" }}>
            <p>{q.question}</p>
            {q.image && <img src={q.image} alt="Hình minh họa" style={{ width: "100%", marginBottom: 10 }} />}
            <List
              bordered
              dataSource={q.answers}
              renderItem={(answer) => <List.Item>{answer}</List.Item>}
            />
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ExamDetail;
