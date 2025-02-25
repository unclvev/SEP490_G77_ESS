import React from "react";
import { Button, Card } from "antd";
import { LeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const ExamPreview = ({ questions = [] }) => {
  const navigate = useNavigate();

  // Dữ liệu mẫu nếu `questions` rỗng
  const sampleQuestions = [
    {
      id: 1,
      question: "Hàm số y = f(x) liên tục trên R và có bảng biến thiên như hình vẽ. Mệnh đề nào sau đây là đúng?",
      image: "https://via.placeholder.com/400x150", // Thay bằng link ảnh thật
      answers: [
        "Hàm số đã cho có hai điểm cực trị.",
        "Hàm số đã cho đúng một điểm cực trị.",
        "Hàm số đã cho không có giá trị cực tiểu.",
        "Hàm số đã cho không có giá trị cực đại.",
      ],
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
      answers: [
        "f(x) = -3x².",
        "f(x) = -3 - x².",
        "f(x) = (1 / √3)x³.",
        "f(x) = x³ - x.",
      ],
    },
  ];

  const displayQuestions = questions.length > 0 ? questions : sampleQuestions;

  return (
    <div style={{ padding: 20, background: "#f5f5f5", height: "100vh" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
        <Button icon={<LeftOutlined />} onClick={() => navigate(-1)} />
        <h2 style={{ marginLeft: 10 }}>TẠO ĐỀ THI</h2>
      </div>

      <div style={{ display: "flex", height: "calc(100vh - 80px)" }}>
        {/* Khu vực danh sách câu hỏi */}
        <div style={{ flex: 3, padding: 10, border: "2px solid #2196F3" }}>
          <h3 style={{ textAlign: "center" }}>PHẦN XEM TRƯỚC</h3>
          <div style={{ maxHeight: "90%", overflowY: "auto", padding: 10 }}>
            {displayQuestions.map((q, index) => (
              <Card key={q.id} style={{ marginBottom: 10 }}>
                <p><strong>Câu {index + 1}:</strong> {q.question}</p>
                {q.image && (
                  <img
                    src={q.image}
                    alt={`Hình ảnh cho câu hỏi ${index + 1}`}
                    style={{ width: "100%", maxHeight: 200, objectFit: "contain", marginTop: 10 }}
                  />
                )}
                <ul style={{ marginTop: 10 }}>
                  {q.answers.map((answer, i) => (
                    <li key={i}>{answer}</li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>

        {/* Khu vực thông tin đề thi */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, paddingLeft: 10 }}>
          <div style={{ flex: 2, background: "#ddd", padding: 10 }}>
            <h3>THÔNG TIN ĐỀ</h3>
            {/* Thêm thông tin đề thi vào đây */}
          </div>
          <div style={{ flex: 1, background: "#ddd", padding: 10, display: "flex", justifyContent: "center", gap: 10 }}>
            <Button type="primary">Lưu đề</Button>
            <Button type="default">In đề báo</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamPreview;
