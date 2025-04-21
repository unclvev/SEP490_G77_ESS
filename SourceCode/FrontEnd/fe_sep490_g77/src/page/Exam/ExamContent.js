import React, { useEffect, useState } from "react";
import {
  Card,
  Button,
  Space,
  Typography,
  Radio,
  Dropdown,
  Menu,
  Modal,
  Select,
  Input,
  Row,
  Col,
} from "antd";
import "@ant-design/v5-patch-for-react-19";
import {
  LeftOutlined,
  MoreOutlined,
  BarChartOutlined,
  FilePdfOutlined,
  DeleteOutlined,
  SaveOutlined,
  TeamOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  delExam,
  getExam,
  loadGrade,
  loadSubject,
  updateExamData,
} from "../../services/api";
import { saveAs } from "file-saver";
import { toast } from "react-toastify";
import { BlockMath } from "react-katex";
import "katex/dist/katex.min.css";

const { Text, Title } = Typography;
const { Option } = Select;

const ExamDetail = () => {
  const [searchParams] = useSearchParams();
  const examid = searchParams.get("id");
  const [gradeOptions, setGradeOptions] = useState([]);
  const [subjectOptions, setSubjectOptions] = useState([]);
  const navigate = useNavigate();

  const [initialPayload, setInitialPayload] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

  const [addModalVisible, setAddModalVisible] = useState(false);
  const defaultNewQ = { Content: "", Type: "Multiple Choice", Answers: Array(4).fill({ Content: "", IsCorrect: false }) };
  const [newQuestion, setNewQuestion] = useState(defaultNewQ);

  const [examInfo, setExamInfo] = useState({
    examName: "",
    grade: "",
    subject: "",
    createdAt: "",
    creator: "",
    attempts: 0,
  });
  const [questions, setQuestions] = useState([]);

  const [examCode, setExamCode] = useState("");

  // States for editing exam name
  const [newExamName, setNewExamName] = useState("");
  const handleEditName = () => {
    setNewExamName(examInfo.examName);
    Modal.confirm({
      title: "Chỉnh sửa tên đề thi",
      content: (
        <Input
          value={newExamName}
          onChange={(e) => setNewExamName(e.target.value)}
        />
      ),
      onOk: () => {
        setExamInfo((prev) => ({ ...prev, examName: newExamName }));
        toast.success("Đã cập nhật tên đề thi");
      },
    });
  };

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const { data } = await getExam(examid);
        const parsed = JSON.parse(data.examdata);

        // 1. Set examInfo với đúng JSON từ parsed.exam
        setExamInfo({
          examName: parsed.exam.ExamName || "",
          grade: parsed.exam.Grade || "",
          subject: parsed.exam.Subject || "",
          createdAt: new Date(data.createdate).toLocaleString(),
          creator: data.accId || "",
          attempts: data.attempts || 0,
        });

        // 2. Set riêng examCode nếu có
        setExamCode(parsed.exam.ExamCode || "");

        // 3. Load questions
        setQuestions(parsed.examdata.Questions || []);

        // 4. Khởi tạo initialPayload để so sánh dirty
        setInitialPayload({
          exam: {
            ExamName: parsed.exam.ExamName,
            Grade: parsed.exam.Grade,
            Subject: parsed.exam.Subject,
          },
          examdata: { Questions: parsed.examdata.Questions },
        });
      } catch (err) {
        console.error(err);
      }
    };
    fetchExam();
  }, [examid]);

  useEffect(() => {
    if (!initialPayload) return;
    const current = {
      exam: {
        ExamName: examInfo.examName,
        Grade: examInfo.grade,
        Subject: examInfo.subject,
      },
      examdata: { Questions: questions },
    };
    setIsDirty(JSON.stringify(current) !== JSON.stringify(initialPayload));
  }, [examInfo, questions, initialPayload]);

  useEffect(() => {
    async function fetchOptions() {
      try {
        const [gRes, sRes] = await Promise.all([loadGrade(), loadSubject()]);
        setGradeOptions(Array.isArray(gRes.data) ? gRes.data : []);
        setSubjectOptions(Array.isArray(sRes.data) ? sRes.data : []);
      } catch (error) {
        console.error("Could not load grade/subject options", error);
      }
    }
    fetchOptions();
  }, []);

  const renderContent = (content) =>
    content.split("\n").map((line, idx) => {
      const m = line.match(/\[MATH:([^\]]+)\]/);
      if (m) return <BlockMath key={idx}>{m[1]}</BlockMath>;
      return <p key={idx} dangerouslySetInnerHTML={{ __html: line }} />;
    });

  const getCorrectAnswerLetter = (question) => {
    if (!question?.Answers?.length) return "Chưa chọn";
    const i = question.Answers.findIndex(
      (a) => a.AnswerId === question.CorrectAnswerId
    );
    return i >= 0 ? String.fromCharCode(65 + i) : "Chưa chọn";
  };

  // Handlers
  const handleSave = async () => {
    const gradeText =
      gradeOptions.find((g) => g.gradeId === examInfo.grade)?.gradeLevel || "";
    const subjectText =
      subjectOptions.find((s) => s.subjectId === examInfo.subject)
        ?.subjectName || "";

    // 2) build payload với giá trị chữ
    const payload = {
      Exam: {
        ExamName: examInfo.examName,
        Grade: gradeText, // giờ là string, không phải id
        Subject: subjectText,
      },
      Examdata: {
        Questions: questions,
      },
    };

    try {
      // 3) call the correct URL
      await updateExamData(examid, payload);
      toast.success("Đã lưu thay đổi!");
      setInitialPayload(payload);
      setIsDirty(false);
    } catch (err) {
      console.error("Save failed:", err.response || err);
      toast.error("Lưu thất bại!");
    }
  };

  const handlePermissions = () => {
    Modal.info({
      title: "Phân quyền",
      content: "Chức năng phân quyền sẽ được triển khai sau.",
    });
  };

  const handleGradeChange = (value) =>
    setExamInfo((prev) => ({ ...prev, grade: value }));
  const handleSubjectChange = (value) =>
    setExamInfo((prev) => ({ ...prev, subject: value }));

  const handleBack = () => navigate(-1);
  const handlePrint = () => navigate(`/exam/print/${examid}`);
  const handleStats = () => navigate(`/exam/analysis/${examid}`);

  const handleDownloadTemplate = () => {
    const url =
      "https://drive.google.com/uc?export=download&id=19Gx-0qpRYEqIdOdQhAX5QamWIE30cF0O";
    saveAs(url, "template.pdf");
    toast.success("Đã tải template thành công!");
  };

  const handleDeleteExam = () => {
    Modal.confirm({
      title: "Xác nhận",
      content: "Bạn có chắc chắn muốn xóa đề thi này?",
      onOk: async () => {
        try {
          await delExam(examid);
          toast.success("Đã xóa đề thi thành công!");
          navigate("/exam");
        } catch {
          toast.error("Xóa đề thi thất bại!");
        }
      },
    });
  };

  const handleAddQuestion = async () => {
    const filteredAnswers = newQuestion.Answers.filter((a) => a.Content.trim());
    const newQ = {
      QuestionId: Date.now(), // temp ID
      Content: newQuestion.Content,
      Type: newQuestion.Type,
      Answers: filteredAnswers,
    };
    const updatedQuestions = [...questions, newQ];
    const payload = { Exam: { ExamName: examInfo.examName, Grade: examInfo.grade, Subject: examInfo.subject }, Examdata: { Questions: updatedQuestions } };
    try {
      await updateExamData(examid, payload);
      setQuestions(updatedQuestions);
      toast.success("Đã thêm câu hỏi!");
      setInitialPayload(payload);
      setIsDirty(false);
      setAddModalVisible(false);
    } catch (err) {
      console.error("Add question failed:", err.response?.data);
      toast.error("Không thể thêm câu hỏi");
    }
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    setQuestions((prev) => {
      const newQs = [...prev];
      [newQs[index - 1], newQs[index]] = [newQs[index], newQs[index - 1]];
      return newQs;
    });
  };

  const handleMoveDown = (index) => {
    if (index === questions.length - 1) return;
    setQuestions((prev) => {
      const newQs = [...prev];
      [newQs[index + 1], newQs[index]] = [newQs[index], newQs[index + 1]];
      return newQs;
    });
  };

  const renderQuestionMenu = (index) => (
    <Menu>
      <Menu.Item
        onClick={() => {
          /* edit question */
        }}
      >
        Chỉnh sửa
      </Menu.Item>
      <Menu.Item
        danger
        onClick={() => {
          /* delete question */
        }}
      >
        Xóa
      </Menu.Item>
      <Menu.Item onClick={() => handleMoveUp(index)} disabled={index === 0}>
        Di chuyển lên
      </Menu.Item>
      <Menu.Item
        onClick={() => handleMoveDown(index)}
        disabled={index === questions.length - 1}
      >
        Di chuyển xuống
      </Menu.Item>
    </Menu>
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f9f9f9",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "#fff",
          borderBottom: "1px solid #ddd",
          padding: "10px 20px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Button
          icon={<LeftOutlined />}
          onClick={handleBack}
          style={{ marginRight: 10 }}
        />
        <Title level={4} style={{ margin: 0 }}>
          {examInfo.examName}
        </Title>
        <Button type="text" icon={<EditOutlined />} onClick={handleEditName} />
      </div>

      <div style={{ flex: 1, display: "flex" }}>
        {/* Sidebar */}
        <div
          style={{
            width: 300,
            background: "#fff",
            borderRight: "1px solid #ddd",
            padding: 20,
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", marginBottom: 12 }}
          >
            <Title level={5} style={{ margin: 0, flex: 1 }}>
              {examInfo.examName}
            </Title>
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={handleEditName}
            />
          </div>

          {/* Grade & Subject */}
          <Card size="small" title="Exam Info" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Typography.Text strong>Grade</Typography.Text>
                <Select
                  value={examInfo.grade}
                  onChange={handleGradeChange}
                  placeholder="Select grade"
                  style={{ width: "100%", marginTop: 4 }}
                  options={gradeOptions.map((g) => ({
                    label: g.gradeLevel,
                    value: g.gradeId,
                  }))}
                />
              </Col>
              <Col span={12}>
                <Typography.Text strong>Subject</Typography.Text>
                <Select
                  value={examInfo.subject}
                  onChange={handleSubjectChange}
                  placeholder="Select subject"
                  style={{ width: "100%", marginTop: 4 }}
                  options={subjectOptions.map((s) => ({
                    label: s.subjectName,
                    value: s.subjectId,
                  }))}
                />
              </Col>
            </Row>

            {/* → Input tách riêng cho Exam Code ← */}
            <Row style={{ marginTop: 16 }}>
              <Col span={24}>
                <Typography.Text strong>Exam Code</Typography.Text>
                <Input
                  value={examCode}
                  onChange={(e) => setExamCode(e.target.value)}
                  placeholder="Enter exam code"
                  style={{ width: "100%", marginTop: 4 }}
                />
              </Col>
            </Row>
          </Card>

          <div style={{ marginBottom: 16, color: "#888" }}>
            Ngày tạo: {examInfo.createdAt}
            <br />
            Người tạo: {examInfo.creator}
            <br />
            Số lượt làm: {examInfo.attempts}
          </div>

          <Space direction="vertical" style={{ width: "100%" }}>
            <Button block icon={<BarChartOutlined />} onClick={handlePrint}>
              In PDF
            </Button>
            <Button
              block
              icon={<SaveOutlined />}
              onClick={handleSave}
              disabled={!isDirty}
            >
              Lưu
            </Button>
            <Button
              block
              icon={<FilePdfOutlined />}
              onClick={handleDownloadTemplate}
            >
              Tải mẫu phiếu trắc nghiệm
            </Button>
            <Button block icon={<BarChartOutlined />} onClick={handleStats}>
              Thống kê
            </Button>
            <Button block icon={<TeamOutlined />} onClick={handlePermissions}>
              Phân quyền
            </Button>
            <Button
              block
              danger
              icon={<DeleteOutlined />}
              onClick={handleDeleteExam}
            >
              Xóa
            </Button>
          </Space>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, padding: 20, overflowY: "auto" }}>
          {questions.length === 0 ? (
            <div style={{ textAlign: "center", marginTop: 100 }}>
              <Title level={3}>Chưa có dữ liệu câu hỏi</Title>
            </div>
          ) : (
            questions.map((q, idx) => (
              <Card
                key={q.QuestionId}
                style={{
                  marginBottom: 20,
                  borderRadius: 8,
                  boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text strong>{`Câu ${idx + 1}`}</Text>
                  <Dropdown
                    overlay={renderQuestionMenu(idx)}
                    trigger={["click"]}
                  >
                    <MoreOutlined style={{ cursor: "pointer", fontSize: 18 }} />
                  </Dropdown>
                </div>

                <Card style={{ border: "1px solid #ddd", margin: "10px 0" }}>
                  {renderContent(q.Content)}
                </Card>

                <Card style={{ border: "1px solid #ddd" }}>
                  <Radio.Group>
                    <Space direction="vertical">
                      {q.Answers.map((ans, i) => (
                        <Radio key={ans.AnswerId} disabled>
                          <Text strong>{`${String.fromCharCode(
                            65 + i
                          )}.`}</Text>
                          <Text
                            style={{
                              marginLeft: 8,
                              fontWeight: ans.IsCorrect ? "bold" : "normal",
                            }}
                          >
                            {ans.Content}
                          </Text>
                        </Radio>
                      ))}
                    </Space>
                  </Radio.Group>
                </Card>

                <Text
                  style={{ color: "green", fontWeight: "bold" }}
                >{`Đáp án: ${getCorrectAnswerLetter(q)}`}</Text>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamDetail;
