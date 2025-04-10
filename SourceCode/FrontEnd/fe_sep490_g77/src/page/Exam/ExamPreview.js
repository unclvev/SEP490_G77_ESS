import React, { useEffect, useState } from "react";
import { Button, Card, Input, Select, Radio, Dropdown, Menu, Space, Typography } from "antd";
import { 
  LeftOutlined, 
  DeleteOutlined, 
  MoreOutlined, 
  EditOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { getExam, updateExamData } from "../../services/api"; // Import API updateExamData

const { Option } = Select;
const { Text } = Typography;

// Component hiển thị một câu hỏi với layout theo TempComponent
const QuestionCard = ({ 
  question, 
  index, 
  onQuestionChange, 
  onAnswerChange, 
  onCorrectChange, 
  onDelete,
  onMoveUp,
  onMoveDown
}) => {
  const [isEditing, setIsEditing] = useState(false);

  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

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

  return (
    <Card style={{ marginBottom: 10, borderRadius: 5, boxShadow: "0 2px 5px rgba(0,0,0,0.1)" }}>
      {/* Thanh chức năng */}
      <Space style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <Space>
          <Text strong>{`Câu ${index + 1}.`}</Text>
          <Button size="small">Trắc nghiệm</Button>
          <Button size="small">NB</Button>
          {/* Các nút di chuyển câu hỏi */}
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
            disabled={index === (onMoveDown.totalQuestions - 1)}
          />
        </Space>
        <Dropdown overlay={menu} trigger={["click"]}>
          <MoreOutlined style={{ fontSize: 18, cursor: "pointer" }} />
        </Dropdown>
      </Space>

      {/* Nội dung câu hỏi */}
      <Card style={{ border: "1px solid #ddd" }}>
        {isEditing ? (
          <Input.TextArea
            value={question.Content}
            onChange={(e) => onQuestionChange(index, e.target.value)}
            autoSize
          />
        ) : (
          <Text>{question.Content}</Text>
        )}
      </Card>

      {/* Các đáp án */}
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
          console.log("1");
          setExam(response);
          setExamName(response.examname || "");
          if (response.data) {
            console.log("2");
            // Giả sử Examdata trong db chỉ chứa danh sách câu hỏi khi tạo đề trước đó,
            // bạn cần xử lý cho trường hợp không có dữ liệu hay dữ liệu khác.
            
            const parsedData = JSON.parse(response.data.examdata);
            console.log(parsedData);
            // Nếu dữ liệu đã có cả phần exam info và examdata thì có thể:
            // parsedData.exam chứa thông tin exam và parsedData.examdata chứa danh sách câu hỏi.
            // Tuy nhiên, nếu response chỉ có câu hỏi, bạn có thể xử lý theo nhu cầu.
            // Ở đây chúng ta giả sử dữ liệu đã được lưu theo cấu trúc mới.
            setQuestions(parsedData.Questions || []);
            console.log("3");
            // Nếu cần hiển thị lại thông tin exam trong phần "THÔNG TIN ĐỀ" thì:
            if (parsedData.exam) {
              setExamName(parsedData.exam.ExamName);
              setGrade(parsedData.exam.Grade);
              setSubject(parsedData.exam.Subject);
            }
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

  const handleAnswerChange = (qIndex, answerId, newText) => {
    const updatedQuestions = [...questions];
    updatedQuestions[qIndex].Answers = updatedQuestions[qIndex].Answers.map((ans) =>
      ans.AnswerId === answerId ? { ...ans, Content: newText } : ans
    );
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

  // Hàm di chuyển câu hỏi lên trên
  const handleMoveUp = (index) => {
    if (index === 0) return;
    const updatedQuestions = [...questions];
    [updatedQuestions[index - 1], updatedQuestions[index]] = [updatedQuestions[index], updatedQuestions[index - 1]];
    setQuestions(updatedQuestions);
  };

  // Hàm di chuyển câu hỏi xuống dưới
  const handleMoveDown = (index) => {
    if (index === questions.length - 1) return;
    const updatedQuestions = [...questions];
    [updatedQuestions[index], updatedQuestions[index + 1]] = [updatedQuestions[index + 1], updatedQuestions[index]];
    setQuestions(updatedQuestions);
  };

  // Hàm lưu đề thi: gộp thông tin exam và examdata rồi gọi API update
  const handleSaveExam = async () => {
    // Tạo object theo cấu trúc mong muốn
    const examDataObj = {
      exam: {
        examName,
        grade,
        subject,
      },
      examdata: {
        Questions: questions,
      },
    };

    try {
      // Gọi API UpdateExamData, truyền examid và dữ liệu
      const response = await updateExamData(examid, examDataObj);
      // Giả sử API trả về examid trong response.data
      const updatedExamId = response.data.examId;
      // Chuyển hướng sang trang exam content với examid vừa nhận được (dùng query param "id")
      navigate(`/exam/content?id=${updatedExamId}`);
    } catch (error) {
      console.error("Error saving exam:", error);
    }
  };

  return (
    <div style={{ padding: 20, background: "#f5f5f5", height: "100vh" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
        <Button icon={<LeftOutlined />} onClick={() => navigate(-1)} />
        <h2 style={{ marginLeft: 10 }}>TẠO ĐỀ THI</h2>
      </div>

      <div style={{ display: "flex", height: "calc(100vh - 80px)" }}>
        <div
          style={{
            flex: 3,
            padding: 10,
            border: "2px solid #2196F3",
            borderRadius: 5,
            background: "white",
          }}
        >
          <h3 style={{ textAlign: "center" }}>PHẦN XEM TRƯỚC</h3>
          <div style={{ maxHeight: "90%", overflowY: "auto", padding: 10 }}>
            {questions.length > 0 ? (
              questions.map((q, index) => (
                <QuestionCard
                  key={q.QuestionId}
                  question={q}
                  index={index}
                  onQuestionChange={handleEditQuestion}
                  onAnswerChange={handleAnswerChange}
                  onCorrectChange={handleEditCorrectAnswer}
                  onDelete={handleDeleteQuestion}
                  onMoveUp={handleMoveUp}
                  onMoveDown={{ func: handleMoveDown, totalQuestions: questions.length }}
                />
              ))
            ) : (
              <p>Đang tải dữ liệu...</p>
            )}
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, paddingLeft: 10 }}>
          <div style={{ flex: 2, background: "#ddd", padding: 10, borderRadius: 5 }}>
            <h3>THÔNG TIN ĐỀ</h3>
            <Input
              placeholder="Tên đề thi"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
            />
            <Select
              placeholder="Chọn khối"
              value={grade}
              onChange={(value) => setGrade(value)}
              style={{ width: "100%", marginTop: 10 }}
            >
              <Option value="10">Lớp 10</Option>
              <Option value="11">Lớp 11</Option>
              <Option value="12">Lớp 12</Option>
            </Select>
            <Select
              placeholder="Chọn môn học"
              value={subject}
              onChange={(value) => setSubject(value)}
              style={{ width: "100%", marginTop: 10 }}
            >
              <Option value="math">Toán</Option>
              <Option value="physics">Vật lý</Option>
              <Option value="chemistry">Hóa học</Option>
              <Option value="english">Tiếng Anh</Option>
            </Select>
          </div>
          <div
            style={{
              flex: 1,
              background: "#ddd",
              padding: 10,
              borderRadius: 5,
              display: "flex",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <Button type="primary" onClick={handleSaveExam}>Lưu đề</Button>
            <Button type="default">In đề báo</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamPreview;
