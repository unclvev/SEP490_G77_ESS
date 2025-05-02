import React, { useEffect, useState } from "react";
import {
  Card,
  Button,
  Space,
  Typography,
  Modal,
  Select,
  Input,
  Row,
  Col,
} from "antd";
import "@ant-design/v5-patch-for-react-19";
import {
  LeftOutlined,
  BarChartOutlined,
  FilePdfOutlined,
  DeleteOutlined,
  SaveOutlined,
  TeamOutlined,
  EditOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  delExam,
  getExam,
  loadGrade,
  loadSubject,
  updateExamData,
  searchUserToInvite,
  inviteUser,
  getMembers,
  removeUser,
} from "../../services/api";
import { saveAs } from "file-saver";
import { toast } from "react-toastify";
import QuestionCardV2 from "../../components/Exam/QuestionCardv2";
import AddQuestionModal from "../../components/Exam/AddQuestionModel";
import ImportStudentModal from "../../components/Exam/ImportStudent";
import InviteUserModal from "../Manager/components/InviteUserModal";
import ListMemberModal from "../Manager/components/ListMemberModal";
import InviteUserForExam from "../Manager/components/InviteUserForExam";

const { Text, Title } = Typography;
const { Option } = Select;

const ExamDetail = () => {
  const [searchParams] = useSearchParams();
  const examid = searchParams.get("id");
  const navigate = useNavigate();

  const [gradeOptions, setGradeOptions] = useState([]);
  const [subjectOptions, setSubjectOptions] = useState([]);

  const [initialPayload, setInitialPayload] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

  const [questions, setQuestions] = useState([]);

  const [examInfo, setExamInfo] = useState({
    examName: "",
    grade: "",
    subject: "",
    createdAt: "",
    creator: "",
    attempts: 0,
  });
  const [examCode, setExamCode] = useState("");

  const [addModalVisible, setAddModalVisible] = useState(false);

  const [editNameModalVisible, setEditNameModalVisible] = useState(false);
  const [newExamName, setNewExamName] = useState("");

  // --- Thêm state cho Import Student ---
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importedStudents, setImportedStudents] = useState([]);

  // Add new state variables for invite functionality
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [listMemberModalVisible, setListMemberModalVisible] = useState(false);

  // --- Fetch exam data ---
  useEffect(() => {
    const fetchExam = async () => {
      try {
        const { data } = await getExam(examid);
        const parsed = JSON.parse(data.examdata);

        setExamInfo({
          examName: parsed.exam.ExamName || "",
          grade: parsed.exam.Grade || "",
          subject: parsed.exam.Subject || "",
          createdAt: new Date(data.createdate).toLocaleString(),
          creator: data.accId || "",
          attempts: data.attempts || 0,
        });
        setExamCode(parsed.exam.ExamCode || "");

        // Load questions
        setQuestions(parsed.examdata.Questions || []);

        // Initialize payload for dirty-check
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

  // --- Dirty check ---
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

  // --- Load grade/subject options ---
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

  // --- Handlers for question-card interactions ---
  const handleQuestionChange = (index, newContent) => {
    setQuestions((prev) => {
      const arr = [...prev];
      arr[index] = { ...arr[index], Content: newContent };
      return arr;
    });
  };

  const handleAnswerChange = (qIndex, answerId, newContent) => {
    setQuestions((prev) => {
      const arr = [...prev];
      arr[qIndex] = {
        ...arr[qIndex],
        Answers: arr[qIndex].Answers.map((a) =>
          a.AnswerId === answerId ? { ...a, Content: newContent } : a
        ),
      };
      return arr;
    });
  };

  const handleCorrectChange = (qIdx, ansId) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        return {
          ...q,
          CorrectAnswerId: ansId,
          Answers: q.Answers.map((a) => ({
            ...a,
            IsCorrect: a.AnswerId === ansId,
          })),
        };
      })
    );
  };

  const handleAnswerDelete = (qIndex, answerId) => {
    setQuestions((prev) => {
      const arr = [...prev];
      arr[qIndex] = {
        ...arr[qIndex],
        Answers: arr[qIndex].Answers.filter((a) => a.AnswerId !== answerId),
      };
      return arr;
    });
  };

  const handleDeleteQuestion = (index) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    setQuestions((prev) => {
      const arr = [...prev];
      [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
      return arr;
    });
  };

  const handleMoveDown = (index) => {
    if (index === questions.length - 1) return;
    setQuestions((prev) => {
      const arr = [...prev];
      [arr[index + 1], arr[index]] = [arr[index], arr[index + 1]];
      return arr;
    });
  };

  // --- Save exam ---
  const handleSave = async () => {
    let gradeText = examInfo.grade;
    let subjectText = examInfo.subject;

    // Nếu vẫn là ID (số hoặc ID dạng string), thì đổi thành chữ
    const foundGrade = gradeOptions.find((g) => g.gradeId === gradeText);
    if (foundGrade) gradeText = foundGrade.gradeLevel;

    const foundSubject = subjectOptions.find(
      (s) => s.subjectId === subjectText
    );
    if (foundSubject) subjectText = foundSubject.subjectName;

    const payload = {
      Exam: {
        ExamName: examInfo.examName,
        Grade: gradeText,
        Subject: subjectText,
      },
      Examdata: {
        Questions: questions,
      },
    };

    console.log("Saving payload", JSON.stringify(payload, null, 2));

    try {
      await updateExamData(examid, payload);
      toast.success("Đã lưu thay đổi!");
      setInitialPayload(payload);
      setIsDirty(false);
    } catch (err) {
      console.error(err);
      toast.error("Lưu thất bại!");
    }
  };

  // --- Other controls ---
  const handleEditName = () => {
    setNewExamName(examInfo.examName);
    setEditNameModalVisible(true);
  };

  const handleBack = () => navigate(-1);
  const handlePrint = () => navigate(`/exam/print/${examid}`);
  const handleStats = () => navigate(`/exam/analysis/${examid}`);
  const handleDownloadTemplate = () => {
    saveAs(
      "https://drive.google.com/uc?export=download&id=19Gx-0qpRYEqIdOdQhAX5QamWIE30cF0O",
      "template.pdf"
    );
    toast.success("Đã tải template thành công!");
  };
  const handlePermissions = () => {
    setInviteModalVisible(true);
  };
  const handleDeleteExam = () => {
    Modal.confirm({
      title: "Xác nhận xóa đề thi",
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

  const handleImportStudent = () => {
    setImportModalVisible(true);
  };

  const handleImportSuccess = (students) => {
    setImportedStudents(students);
    toast.success(`Đã import ${students.length} học sinh!`);
  };

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
          padding: 16,
          display: "flex",
          alignItems: "center",
        }}
      >
        <Button
          icon={<LeftOutlined />}
          onClick={handleBack}
          style={{ marginRight: 12 }}
        />
        <Title level={4} style={{ margin: 0 }}>
          Thông tin đề thi
        </Title>
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
          <Space align="center" style={{ marginBottom: 16 }}>
            <Title level={4} style={{ margin: 0 }}>
              {examInfo.examName}
            </Title>
            <Button icon={<EditOutlined />} onClick={handleEditName} />
          </Space>

          <Card size="small" title="Exam Info" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Text strong>Grade</Text>
                <Select
                  value={examInfo.grade}
                  onChange={(value) =>
                    setExamInfo((prev) => ({ ...prev, grade: value }))
                  }
                  options={gradeOptions.map((g) => ({
                    label: g.gradeLevel,
                    value: g.gradeId,
                  }))}
                  style={{ width: "100%", marginTop: 8 }}
                />
              </Col>
              <Col span={12}>
                <Text strong>Subject</Text>
                <Select
                  value={examInfo.subject}
                  onChange={(value) =>
                    setExamInfo((prev) => ({ ...prev, subject: value }))
                  }
                  options={subjectOptions.map((s) => ({
                    label: s.subjectName,
                    value: s.subjectId,
                  }))}
                  style={{ width: "100%", marginTop: 8 }}
                />
              </Col>
            </Row>
            <div style={{ marginTop: 16 }}>
              <Text strong>Exam Code</Text>
              <Input
                value={examCode}
                onChange={(e) => setExamCode(e.target.value)}
                placeholder="Enter exam code"
                style={{ marginTop: 8 }}
              />
            </div>
          </Card>

          <div style={{ marginBottom: 24, color: "#666" }}>
            Ngày tạo: {examInfo.createdAt}
            <br />
            Người tạo: {examInfo.creator}
            <br />
            <b>Tổng số câu hỏi: {questions.length}</b> {/* 👈 thêm dòng này */}
          </div>

          <Space direction="vertical" style={{ width: "100%" }} size="middle">
            <Button
              block
              icon={<PlusOutlined />}
              onClick={() => setAddModalVisible(true)}
            >
              Thêm câu hỏi
            </Button>

            <Button block icon={<PlusOutlined />} onClick={handleImportStudent}>
              Import danh sách học sinh
            </Button>

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
              Tải mẫu
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
              <QuestionCardV2
                key={q.QuestionId}
                question={q}
                index={idx}
                totalQuestions={questions.length}
                onQuestionChange={handleQuestionChange}
                onAnswerChange={handleAnswerChange}
                onCorrectChange={handleCorrectChange}
                onAnswerDelete={handleAnswerDelete}
                onDelete={handleDeleteQuestion}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
              />
            ))
          )}
        </div>
      </div>
      <AddQuestionModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onAdd={(newQuestion) => {
          setQuestions((prev) => [
            ...prev,
            {
              QuestionId: Date.now(), // ID tạm (có thể đổi random hơn nếu cần)
              Content: newQuestion.Content,
              Type: newQuestion.Type, // Thường là "Multiple Choice"
              Answers: newQuestion.Answers.map((ans, idx) => ({
                AnswerId: Date.now() + idx + 1, // Tạo ID riêng cho mỗi đáp án
                Content: ans.Content,
                IsCorrect: ans.IsCorrect,
              })),
              ImageUrl: newQuestion.ImageUrl || "", // nếu có ảnh
              CorrectAnswerId:
                newQuestion.Answers.find((a) => a.IsCorrect)?.AnswerId || null,
            },
          ]);
          setAddModalVisible(false);
        }}
      />

      <Modal
        title="Chỉnh sửa tên đề thi"
        open={editNameModalVisible}
        onCancel={() => setEditNameModalVisible(false)}
        onOk={() => {
          setExamInfo((prev) => ({ ...prev, examName: newExamName }));
          setEditNameModalVisible(false);
        }}
      >
        <Input
          value={newExamName}
          onChange={(e) => setNewExamName(e.target.value)}
          placeholder="Nhập tên đề thi mới"
        />
      </Modal>

      <ImportStudentModal
        visible={importModalVisible}
        examId={examid}
        onImportSuccess={handleImportSuccess}
        onClose={() => setImportModalVisible(false)}
      />

      <InviteUserForExam
        visible={inviteModalVisible}
        onClose={() => setInviteModalVisible(false)}
        examId={examid}
        resourceType="exam"
      />

      <ListMemberModal
        visible={listMemberModalVisible}
        onClose={() => setListMemberModalVisible(false)}
        bankId={examid}
        resourceType="exam"
      />
    </div>
  );
};

export default ExamDetail;
