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
  Tabs,
  message,
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
  GroupOutlined,
} from "@ant-design/icons";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  delExam,
  getExam,
  loadGrade,
  loadSubject,
  updateExamData,
  isModifyExam,
  isAnalysis,
  isExamOwner,
  isDeleteExam,
} from "../../services/api";
import { saveAs } from "file-saver";
import { toast } from "react-toastify";
import QuestionCardV2 from "../../components/Exam/QuestionCardv2";
import AddQuestionModal from "../../components/Exam/AddQuestionModel";
import ImportStudentModal from "../../components/Exam/ImportStudent";
import ListMemberModal from "../Manager/components/ListMemberModal";
import useExamCodeManager from "../../components/Exam/ExamCodeManager";
import InviteUserForExam from "../Manager/components/InviteUserForExam";
import ListMemberForExam from "../Manager/components/ListMemberExam";

const { Text, Title } = Typography;
const { TabPane } = Tabs;

const ExamDetail = () => {
  const [searchParams] = useSearchParams();
  const examid = searchParams.get("id");
  const navigate = useNavigate();

  const [gradeOptions, setGradeOptions] = useState([]);
  const [subjectOptions, setSubjectOptions] = useState([]);

  const [initialPayload, setInitialPayload] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isowner, setIsOwner] = useState(true);

  const [questions, setQuestions] = useState([]);

  const {
    examCodes,
    activeIndex,
    currentExamCode,
    handleChangeTab,
    handleAddExamCode,
    handleDeleteExamCode,
    updateCurrentQuestions,
    setExamCodes,
    setActiveIndex,
  } = useExamCodeManager([]);

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
  const [listMemberForExamModalVisible, setListMemberForExamModalVisible] =
    useState(false);

  // --- Fetch exam data ---
  useEffect(() => {
    const fetchExam = async () => {
      try {
        const { data } = await getExam(examid);
        const parsed = JSON.parse(data.examdata);
        const codes = parsed.ExamCodes || [];

        setExamInfo({
          examName: data.examname || "",
          grade: data.grade || "",
          subject: data.subject || "",
          createdAt: new Date(data.createdate).toLocaleString(),
          creator: data.accId || "",
          attempts: data.attempts || 0,
        });

        setExamCodes(codes);
        setActiveIndex(0);
        setExamCode(codes[0]?.ExamCode || "");

        setInitialPayload({
          Exam: {
            ExamName: data.examname,
            Grade: data.grade,
            Subject: data.subject,
          },
          ExamCodes: codes,
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
      Exam: {
        ExamName: examInfo.examName,
        Grade: examInfo.grade,
        Subject: examInfo.subject,
      },
      ExamCodes: [
        {
          ExamCode: examCode,
          Questions: questions,
        },
      ],
    };
    setIsDirty(JSON.stringify(current) !== JSON.stringify(initialPayload));
  }, [examInfo, questions, examCode, initialPayload]);

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

  useEffect(() => {
    async function checkIsOwner() {
      try {
        // Gọi API
        const response = await isExamOwner(examid);
        // Giả sử API trả về { data: true/false }
        setIsOwner(response.data);
      } catch (error) {
        console.error("Error checking exam ownership:", error);
        // Mặc định không phải owner nếu gọi API thất bại
        setIsOwner(false);
      }
    }
    checkIsOwner();
  });

  // --- Save exam ---
  const handleSave = async () => {
    let gradeText = examInfo.grade;
    let subjectText = examInfo.subject;

    const foundGrade = gradeOptions.find((g) => g.gradeId === gradeText);
    if (foundGrade) gradeText = foundGrade.gradeLevel;

    const foundSubject = subjectOptions.find(
      (s) => s.subjectId === subjectText
    );
    if (foundSubject) subjectText = foundSubject.subjectName;

    const payload = {
      exam: {
        examName: examInfo.examName,
        grade: gradeText,
        subject: subjectText,
      },
      examCodes: examCodes.map((code, idx) => ({
        examCode: idx === activeIndex ? examCode : code.ExamCode || "",
        questions: (code.Questions || []).map((q) => ({
          questionId: q.QuestionId,
          content: q.Content,
          type: q.Type || "",
          imageUrl: q.ImageUrl || "",
          answers: (q.Answers || []).map((a) => ({
            answerId: a.AnswerId,
            content: a.Content,
            isCorrect: !!a.IsCorrect,
          })),
        })),
      })),
    };

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

  const handleDeleteExam = async () => {
    try {
      await isDeleteExam(examid);
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
    } catch (err) {
      message.error("Bạn không có quyền xóa bài kiếm tra");
    }
  };

  const handleListMembers = () => {
    setListMemberForExamModalVisible(true);
  };

  const getMaxAnswerId = () => {
    let max = 0;
    examCodes.forEach((code) => {
      (code.Questions || []).forEach((q) => {
        (q.Answers || []).forEach((a) => {
          if (a.AnswerId > max) max = a.AnswerId;
        });
      });
    });
    return max;
  };

  const getMaxQuestionId = (examCodes) => {
    let maxId = 0;
    for (const code of examCodes) {
      for (const q of code.Questions || []) {
        if (q.QuestionId > maxId) {
          maxId = q.QuestionId;
        }
      }
    }
    return maxId;
  };

  const handleImportStudent = () => {
    setImportModalVisible(true);
  };

  const handleImportSuccess = (students) => {
    setImportedStudents(students);
    toast.success(`Đã import ${students.length} học sinh!`);
  };

  const handleAnalysisClick = async () => {
    try {
      await isAnalysis(examid);
      handleStats();
    } catch (err) {
      message.error("Bạn không có quyền xem thống kê của bài thi này");
    }
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
            <Button
              icon={<EditOutlined />}
              onClick={handleEditName}
              disabled={!isowner}
            />
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
                  disabled
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
                  disabled
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
                disabled={!isowner}
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
              onClick={async () => {
                try {
                  // gọi API kiểm tra quyền Modify trên exam hiện tại
                  await isModifyExam(Number(examid));
                  // nếu OK mới mở modal
                  setAddModalVisible(true);
                } catch {
                  // 403 → thông báo
                  message.error("Bạn không có quyền thêm câu hỏi");
                }
              }}
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
            <Button
              block
              icon={<BarChartOutlined />}
              onClick={handleAnalysisClick}
            >
              Thống kê
            </Button>
            <Button
              block
              icon={<TeamOutlined />}
              onClick={handlePermissions}
              disabled={!isowner}
            >
              Phân quyền
            </Button>
            <Button block icon={<GroupOutlined />} onClick={handleListMembers}>
              Thành viên
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
        {/* Main content */}
        <div style={{ flex: 1, padding: 20, overflowY: "auto" }}>
          <Tabs
            activeKey={activeIndex.toString()}
            onChange={handleChangeTab}
            type="editable-card"
            onEdit={(targetKey, action) => {
              if (action === "add") handleAddExamCode();
              else if (action === "remove") {
                const ok = handleDeleteExamCode(Number(targetKey));
                if (!ok) message.warning("Phải có ít nhất một mã đề.");
              }
            }}
            hideAdd={false}
          >
            {examCodes.map((code, index) => (
              <TabPane
                tab={code.ExamCode || `Mã đề ${index + 1}`}
                key={index.toString()}
                closable={examCodes.length > 1}
              >
                {(code.Questions || []).length === 0 ? (
                  <Title level={4} style={{ textAlign: "center" }}>
                    Chưa có câu hỏi
                  </Title>
                ) : (
                  code.Questions.map((q, idx) => (
                    <QuestionCardV2
                      examId={Number(examid)}
                      key={q.QuestionId}
                      question={q}
                      index={idx}
                      totalQuestions={code.Questions.length}
                      onQuestionChange={(i, newContent) => {
                        const newQs = [...code.Questions];
                        newQs[i] = { ...newQs[i], Content: newContent };
                        updateCurrentQuestions(newQs);
                      }}
                      onAnswerChange={(i, ansId, txt) => {
                        const newQs = [...code.Questions];
                        newQs[i].Answers = newQs[i].Answers.map((a) =>
                          a.AnswerId === ansId ? { ...a, Content: txt } : a
                        );
                        updateCurrentQuestions(newQs);
                      }}
                      onCorrectChange={(i, ansId) => {
                        const newQs = [...code.Questions];
                        newQs[i].CorrectAnswerId = ansId;
                        newQs[i].Answers = newQs[i].Answers.map((a) => ({
                          ...a,
                          IsCorrect: a.AnswerId === ansId,
                        }));
                        updateCurrentQuestions(newQs);
                      }}
                      onDelete={(i) => {
                        const newQs = [...code.Questions];
                        newQs.splice(i, 1);
                        updateCurrentQuestions(newQs);
                      }}
                      onMoveUp={(i) => {
                        if (i === 0) return;
                        const newQs = [...code.Questions];
                        [newQs[i - 1], newQs[i]] = [newQs[i], newQs[i - 1]];
                        updateCurrentQuestions(newQs);
                      }}
                      onMoveDown={(i) => {
                        if (i === code.Questions.length - 1) return;
                        const newQs = [...code.Questions];
                        [newQs[i + 1], newQs[i]] = [newQs[i], newQs[i + 1]];
                        updateCurrentQuestions(newQs);
                      }}
                      onAnswerDelete={(i, ansId) => {
                        const newQs = [...code.Questions];
                        newQs[i].Answers = newQs[i].Answers.filter(
                          (a) => a.AnswerId !== ansId
                        );
                        updateCurrentQuestions(newQs);
                      }}
                      onFullUpdate={(i, updatedQ) => {
                        const updated = [...examCodes];
                        updated[activeIndex].Questions[i] = { ...updatedQ };
                        setExamCodes(updated);
                      }}
                    />
                  ))
                )}
              </TabPane>
            ))}
          </Tabs>
        </div>
      </div>
      <AddQuestionModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onAdd={(newQuestion) => {
          const maxQid = getMaxQuestionId(examCodes);
          const maxAid = getMaxAnswerId(examCodes);

          const newQid = maxQid + 1;

          const newQuestionObj = {
            QuestionId: newQid,
            Content: newQuestion.Content,
            Type: newQuestion.Type,
            Answers: newQuestion.Answers.map((ans, idx) => ({
              AnswerId: maxAid + idx + 1,
              Content: ans.Content,
              IsCorrect: ans.IsCorrect,
            })),
            ImageUrl: newQuestion.ImageUrl || "",
            CorrectAnswerId: newQuestion.Answers.find((a) => a.IsCorrect)
              ? maxAid + newQuestion.Answers.findIndex((a) => a.IsCorrect) + 1
              : null,
          };

          // Gán vào examCodes[activeIndex]
          const updated = [...examCodes];
          updated[activeIndex].Questions.push(newQuestionObj);
          setExamCodes(updated);
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
        resourceType="Exam"
      />

      <ListMemberModal
        visible={listMemberModalVisible}
        onClose={() => setListMemberModalVisible(false)}
        bankId={examid}
        resourceType="exam"
      />

      <ListMemberForExam
        visible={listMemberForExamModalVisible}
        onClose={() => setListMemberForExamModalVisible(false)}
        examId={examid}
      />
    </div>
  );
};

export default ExamDetail;
