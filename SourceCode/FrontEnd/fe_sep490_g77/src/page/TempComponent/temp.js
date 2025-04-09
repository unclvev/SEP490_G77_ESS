import React, { useState } from "react";
import { Card, Input, Radio, Button, Space, Typography, Dropdown, Menu } from "antd";
import { EditOutlined, SaveOutlined, MoreOutlined, DeleteOutlined } from "@ant-design/icons";

const { Text } = Typography;

const TempComponent = () => {
  const [question, setQuestion] = useState("Trong không gian với hệ tọa độ Oxyz, cho hai điểm C(4;10;-11) và B(4;-8;8). Tìm tọa độ vectơ ⟶ CB.");
  const [answers, setAnswers] = useState([
    { id: 1, text: "(0;18;-19).", correct: false },
    { id: 2, text: "(8;2;-3).", correct: false },
    { id: 3, text: "(0;-18;19).", correct: true },
    { id: 4, text: "(16;-80;-88).", correct: false },
  ]);
  const [isEditing, setIsEditing] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState(3);

  const handleEdit = () => {
    setIsEditing(!isEditing);
  };

  const handleDelete = () => {
    console.log("Xóa câu hỏi");
  };

  const menu = (
    <Menu>
      <Menu.Item key="edit" icon={<EditOutlined />} onClick={handleEdit}>
        Chỉnh sửa
      </Menu.Item>
      <Menu.Item key="delete" icon={<DeleteOutlined />} onClick={handleDelete}>
        Xóa câu hỏi
      </Menu.Item>
    </Menu>
  );

  const handleQuestionChange = (e) => {
    setQuestion(e.target.value);
  };

  const handleAnswerChange = (id, text) => {
    setAnswers((prev) =>
      prev.map((ans) => (ans.id === id ? { ...ans, text } : ans))
    );
  };

  const handleCorrectChange = (id) => {
    setCorrectAnswer(id);
    setAnswers((prev) =>
      prev.map((ans) => ({ ...ans, correct: ans.id === id }))
    );
  };

  return (
    <Card style={{ width: 600, border: "1px solid #ddd", background: "#fff" }}>
      {/* Thanh chức năng */}
      <Space style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <Space>
          <Text strong>Câu 2.</Text>
          <Button size="small">Trắc nghiệm</Button>
          <Button size="small">NB</Button>
        </Space>
        <Dropdown overlay={menu} trigger={["click"]}>
          <MoreOutlined style={{ fontSize: 18, cursor: "pointer" }} />
        </Dropdown>
      </Space>

      {/* Câu hỏi */}
      <Card style={{ border: "1px solid #ddd" }}>
        {isEditing ? (
          <Input.TextArea value={question} onChange={handleQuestionChange} autoSize />
        ) : (
          <Text>{question}</Text>
        )}
      </Card>

      {/* Đáp án */}
      <Card style={{ border: "1px solid #ddd", marginTop: 10 }}>
        <Radio.Group value={correctAnswer} onChange={(e) => handleCorrectChange(e.target.value)}>
          <Space direction="vertical">
            {answers.map((answer, index) => (
              <Radio key={answer.id} value={answer.id}>
                <Text strong>{String.fromCharCode(65 + index)}.</Text> {/* A, B, C, D */}
                {isEditing ? (
                  <Input
                    value={answer.text}
                    onChange={(e) => handleAnswerChange(answer.id, e.target.value)}
                    style={{ marginLeft: 8 }}
                  />
                ) : (
                  <Text style={{ marginLeft: 8, fontWeight: answer.correct ? "bold" : "normal" }}>
                    {answer.text}
                  </Text>
                )}
              </Radio>
            ))}
          </Space>
        </Radio.Group>
      </Card>
    </Card>
  );
};

export default TempComponent;
