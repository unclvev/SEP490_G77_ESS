import React, { useEffect, useState } from "react";
import { Button, Card, Input, Select, Radio, Dropdown, Menu } from "antd";
import { LeftOutlined, DeleteOutlined, MoreOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { getExam } from "../../services/api";

const { Option } = Select;

const ExamPreview = () => {
  const navigate = useNavigate();
  const { examid } = useParams();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [examName, setExamName] = useState("");
  const [grade, setGrade] = useState(null);
  const [subject, setSubject] = useState(null);

  useEffect(() => {
    if (!examid) return;
    
    const fetchExam = async () => {
      try {
        const response = await getExam(examid);
        if (response) {
          setExam(response);
          setExamName(response.examname || "");
          if (response.data) {
            const parsedData = JSON.parse(response.data.examdata);
            setQuestions(parsedData.Questions || []);
          }
        }
      } catch (error) {
        console.error("Error fetching exam:", error);
      }
    };
    
    fetchExam();
  }, [examid]);

  const handleEditQuestion = (index, newContent) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index].Content = newContent;
    setQuestions(updatedQuestions);
  };

  const handleEditCorrectAnswer = (questionIndex, answerId) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].CorrectAnswerId = answerId;
    setQuestions(updatedQuestions);
  };

  const handleDeleteQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  return (
    <div style={{ padding: 20, background: "#f5f5f5", height: "100vh" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
        <Button icon={<LeftOutlined />} onClick={() => navigate(-1)} />
        <h2 style={{ marginLeft: 10 }}>TẠO ĐỀ THI</h2>
      </div>

      <div style={{ display: "flex", height: "calc(100vh - 80px)" }}>
        <div style={{ flex: 3, padding: 10, border: "2px solid #2196F3", borderRadius: 5, background: "white" }}>
          <h3 style={{ textAlign: "center" }}>PHẦN XEM TRƯỚC</h3>
          <div style={{ maxHeight: "90%", overflowY: "auto", padding: 10 }}>
            {questions.length > 0 ? (
              questions.map((q, index) => (
                <Card key={q.QuestionId} style={{ marginBottom: 10, borderRadius: 5, boxShadow: "0 2px 5px rgba(0,0,0,0.1)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Input.TextArea
                      value={q.Content}
                      onChange={(e) => handleEditQuestion(index, e.target.value)}
                      style={{ fontWeight: "bold" }}
                    />
                    <Dropdown
                      overlay={
                        <Menu>
                          <Menu.Item key="edit">Đổi câu khác</Menu.Item>
                          <Menu.Item key="copy">Copy nội dung</Menu.Item>
                          <Menu.Item key="cut">Cắt</Menu.Item>
                          <Menu.Item key="delete" danger onClick={() => handleDeleteQuestion(index)}>Xóa</Menu.Item>
                        </Menu>
                      }
                    >
                      <Button icon={<MoreOutlined />} shape="circle" />
                    </Dropdown>
                  </div>
                  {q.image && (
                    <img
                      src={q.image}
                      alt={`Hình ảnh cho câu hỏi ${index + 1}`}
                      style={{ width: "100%", maxHeight: 200, objectFit: "contain", marginTop: 10 }}
                    />
                  )}
                  <ul style={{ marginTop: 10, border: "1px solid #ddd", borderRadius: 5, padding: 10 }}>
                    <Radio.Group
                      onChange={(e) => handleEditCorrectAnswer(index, e.target.value)}
                      value={q.CorrectAnswerId}
                    >
                      {q.Answers.map((answer) => (
                        <li key={answer.AnswerId} style={{ padding: 5, background: q.CorrectAnswerId === answer.AnswerId ? "#e6f7ff" : "white", borderRadius: 5 }}>
                          <Radio value={answer.AnswerId}>{answer.Content}</Radio>
                        </li>
                      ))}
                    </Radio.Group>
                  </ul>
                </Card>
              ))
            ) : (
              <p>Đang tải dữ liệu...</p>
            )}
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, paddingLeft: 10 }}>
          <div style={{ flex: 2, background: "#ddd", padding: 10, borderRadius: 5 }}>
            <h3>THÔNG TIN ĐỀ</h3>
            <Input placeholder="Tên đề thi" value={examName} onChange={(e) => setExamName(e.target.value)} />
            <Select placeholder="Chọn khối" value={grade} onChange={(value) => setGrade(value)} style={{ width: "100%", marginTop: 10 }}>
              <Option value="10">Lớp 10</Option>
              <Option value="11">Lớp 11</Option>
              <Option value="12">Lớp 12</Option>
            </Select>
            <Select placeholder="Chọn môn học" value={subject} onChange={(value) => setSubject(value)} style={{ width: "100%", marginTop: 10 }}>
              <Option value="math">Toán</Option>
              <Option value="physics">Vật lý</Option>
              <Option value="chemistry">Hóa học</Option>
              <Option value="english">Tiếng Anh</Option>
            </Select>
          </div>
          <div style={{ flex: 1, background: "#ddd", padding: 10, borderRadius: 5, display: "flex", justifyContent: "center", gap: 10 }}>
            <Button type="primary">Lưu đề</Button>
            <Button type="default">In đề báo</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamPreview;