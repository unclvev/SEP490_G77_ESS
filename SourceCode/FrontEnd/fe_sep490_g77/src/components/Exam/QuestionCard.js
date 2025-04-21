// QuestionCard.js
import React, { useState } from "react";
import { Card, Button, Space, Typography, Radio, Dropdown, Menu, Input } from "antd";
import { DeleteOutlined, MoreOutlined, EditOutlined, ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";
import { BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

const { Text } = Typography;

const QuestionCard = ({ 
  question, 
  index, 
  onQuestionChange, 
  onAnswerChange, 
  onCorrectChange, 
  onDelete,
  onMoveUp,
  onMoveDown,
  totalQuestions
}) => {
  const [isEditing, setIsEditing] = useState(false);

  const toggleEdit = () => setIsEditing(!isEditing);

  const menu = (
    <Menu>
      <Menu.Item key="edit" icon={<EditOutlined />} onClick={toggleEdit}>
        Chỉnh sửa
      </Menu.Item>
      <Menu.Item key="delete" icon={<DeleteOutlined />} onClick={() => onDelete(index)}>
        Xóa câu hỏi
      </Menu.Item>
    </Menu>
  );

  const renderContent = (content) => {
    return content.split("\n").map((line, idx) => {
      const latexMatch = line.match(/\[MATH:([^\]]+)\]/);
      if (latexMatch) {
        return <BlockMath key={idx}>{latexMatch[1]}</BlockMath>;
      }
      return <p key={idx} dangerouslySetInnerHTML={{ __html: line }} />;
    });
  };

  return (
    <Card style={{ marginBottom: 10, borderRadius: 5, boxShadow: "0 2px 5px rgba(0,0,0,0.1)" }}>
      <Space style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <Space>
          <Text strong>{`Câu ${index + 1}.`}</Text>
          <Button
            size="small"
            icon={<ArrowUpOutlined />}
            onClick={() => onMoveUp(index)}
            disabled={index === 0}
          />
          <Button
            size="small"
            icon={<ArrowDownOutlined />}
            onClick={() => onMoveDown(index)}
            disabled={index === totalQuestions - 1}
          />
        </Space>
        <Dropdown overlay={menu} trigger={["click"]}>
          <MoreOutlined style={{ fontSize: 18, cursor: "pointer" }} />
        </Dropdown>
      </Space>

      <Card style={{ border: "1px solid #ddd" }}>
        {isEditing ? (
          <Input.TextArea
            value={question.Content}
            onChange={(e) => onQuestionChange(index, e.target.value)}
            autoSize
          />
        ) : (
          renderContent(question.Content)
        )}
      </Card>

      <Card style={{ border: "1px solid #ddd", marginTop: 10 }}>
        <Radio.Group
          value={question.CorrectAnswerId}
          onChange={(e) => onCorrectChange(index, e.target.value)}
        >
          <Space direction="vertical">
            {question.Answers.map((answer, i) => (
              <Radio key={answer.AnswerId} value={answer.AnswerId}>
                <Text strong>{String.fromCharCode(65 + i)}.</Text>
                {isEditing ? (
                  <Input
                    value={answer.Content}
                    onChange={(e) => onAnswerChange(index, answer.AnswerId, e.target.value)}
                    style={{ marginLeft: 8 }}
                  />
                ) : (
                  <Text
                    style={{
                      marginLeft: 8,
                      fontWeight: answer.AnswerId === question.CorrectAnswerId ? "bold" : "normal",
                    }}
                  >
                    {answer.Content}
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

export default QuestionCard;
