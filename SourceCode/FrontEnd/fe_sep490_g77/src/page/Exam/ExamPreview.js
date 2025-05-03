import React, { useEffect, useState } from "react";
import { Button, Input, Select, Space } from "antd";
import { LeftOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { getExam, updateExamData, loadGrade, loadSubject } from "../../services/api";
import 'katex/dist/katex.min.css'; // KaTeX styles
import QuestionCard from "../../components/Exam/QuestionCard";

const { Option } = Select;

const ExamPreview = () => {
  const navigate = useNavigate();
  const { examid } = useParams();

  const [questions, setQuestions] = useState([]);
  const [examName, setExamName] = useState("");
  const [grade, setGrade] = useState("");
  const [subject, setSubject] = useState("");

  const [gradeOptions, setGradeOptions] = useState([]);
  const [subjectOptions, setSubjectOptions] = useState([]);

  // Load grade and subject options on mount
  useEffect(() => {
    loadGrade()
      .then((res) => setGradeOptions(res.data || []))
      .catch((err) => console.error("Error loading grades:", err));

    loadSubject()
      .then((res) => setSubjectOptions(res.data || []))
      .catch((err) => console.error("Error loading subjects:", err));
  }, []);

  // Fetch exam data
  useEffect(() => {
    if (!examid) return;
    (async () => {
      try {
        const response = await getExam(examid);
        if (response?.data) {
          const parsed = JSON.parse(response.data.examdata);
          console.log(parsed);
          const examCodes = parsed.ExamCodes || [];
  
          // Hiện tại chỉ lấy ExamCode đầu tiên (có thể mở rộng sau)
          const firstExam = examCodes[0] || { Questions: [] };
          const { Questions = [] } = firstExam;
  
          const meta = parsed.exam || {};
  
          setQuestions(Questions);
          setExamName(meta.ExamName || "");
          setGrade(meta.Grade || "");
          setSubject(meta.Subject || "");
        }
      } catch (error) {
        console.error("Error fetching exam:", error);
      }
    })();
  }, [examid]);

  const handleSaveExam = async () => {
    const examCodeGroup = {
      examCode: "", // bạn đang để rỗng
      questions: questions.map(q => ({
        questionId: q.QuestionId,
        content: q.Content,
        type: q.Type || "",
        imageUrl: q.ImageUrl || "",
        answers: q.Answers.map(a => ({
          answerId: a.AnswerId,
          content: a.Content,
          isCorrect: !!a.IsCorrect // giữ nguyên nếu đã có, hoặc bạn có thể tính lại bên dưới
        }))
      }))
    };
  
    const payload = {
      exam: {
        examName,
        grade,
        subject
      },
      examCodes: [examCodeGroup]
    };
  
    try {
      const res = await updateExamData(examid, payload);
      navigate(`/exam/content?id=${res.data.examId}`);
    } catch (error) {
      console.error("Error saving exam:", error);
    }
  };
  
  
  
  const handleCancelExam = async () => {
    
  };
  

  const handleDeleteAnswer = (qIndex, ansId) => {
    setQuestions(prev =>
      prev.map((q, i) =>
        i === qIndex
          ? { ...q, Answers: q.Answers.filter(a => a.AnswerId !== ansId) }
          : q
      )
    );
  };
  
  // Thay câu hỏi bằng 1 câu random từ API
  const handleReplaceQuestion = async (qIndex) => {
    // try {
    //   //const res = await getRandomQuestion();              
    //   const newQ = res.data;
    //   setQuestions(prev => {
    //     const arr = [...prev];
    //     arr[qIndex] = {
    //       QuestionId: newQ.id,
    //       Content: newQ.content,
    //       Answers: newQ.answers,
    //       CorrectAnswerId: newQ.correctAnswerId
    //     };
    //     return arr;
    //   });
    // } catch (err) {
    //   console.error("Lỗi khi thay câu hỏi:", err);
    // }
  };

  return (
    <div style={{ padding: 20, background: "#fff", height: "100vh" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
        <Button icon={<LeftOutlined />} onClick={() => navigate(-1)} />
        <h2 style={{ marginLeft: 10 }}>TẠO ĐỀ THI</h2>
      </div>

      <div style={{ display: "flex", height: "calc(100vh - 80px)" }}>
        <div style={{ flex: 3, padding: 10, border: "2px solid #2196F3", borderRadius: 5, background: "#fff" }}>
          <h3 style={{ textAlign: "center" }}>PHẦN XEM TRƯỚC</h3>
          <div style={{ maxHeight: "90%", overflowY: "auto", padding: 10 }}>
            {questions.length ? (
              questions.map((q, idx) => (
                <QuestionCard
                  key={q.QuestionId}
                  question={q}
                  index={idx}
                  onQuestionChange={(i, c) => {
                    const arr = [...questions]; arr[i].Content = c; setQuestions(arr);
                  }}
                  onAnswerChange={(i, ansId, txt) => {
                    const arr = [...questions];
                    arr[i].Answers = arr[i].Answers.map((ans) => ans.AnswerId === ansId ? { ...ans, Content: txt } : ans);
                    setQuestions(arr);
                  }}
                  onCorrectChange={(i, ansId) => {
                    const arr = [...questions]; arr[i].CorrectAnswerId = ansId; setQuestions(arr);
                  }}
                  onDelete={(i) => setQuestions(questions.filter((_, j) => j !== i))}
                  onMoveUp={(i) => {
                    if (i === 0) return; const arr = [...questions]; [arr[i-1], arr[i]] = [arr[i], arr[i-1]]; setQuestions(arr);
                  }}
                  onMoveDown={(i) => {
                    if (i === questions.length - 1) return; const arr = [...questions]; [arr[i], arr[i+1]] = [arr[i+1], arr[i]]; setQuestions(arr);
                  }}
                  totalQuestions={questions.length}

                  onDeleteAnswer={handleDeleteAnswer}
                  onReplaceQuestion={handleReplaceQuestion}
                />
              ))
            ) : (<p>Đang tải dữ liệu...</p>)}
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, paddingLeft: 10 }}>
          <div style={{ flex: 2, background: "#f4f6f7", padding: 10, borderRadius: 5 }}>
            <h3>THÔNG TIN ĐỀ</h3>
            <Input placeholder="Tên đề thi" value={examName} onChange={(e) => setExamName(e.target.value)} />

            <Select placeholder="Chọn khối" value={grade} onChange={setGrade} style={{ width: "100%", marginTop: 10 }}>
              {gradeOptions.map((g) => (
                <Option key={g.gradeId} value={g.gradeLevel}>
                  {g.gradeLevel}
                </Option>
              ))}
            </Select>

            <Select placeholder="Chọn môn học" value={subject} onChange={setSubject} style={{ width: "100%", marginTop: 10 }}>
              {subjectOptions.map((s) => (
                <Option key={s.subjectId} value={s.subjectName}>
                  {s.subjectName}
                </Option>
              ))}
            </Select>
          </div>

          <div style={{ flex: 1, background: "#f4f6f7", padding: 10, borderRadius: 5, display: "flex", justifyContent: "center", alignItems: "center" }}>
            <Space>
              <Button type="primary" onClick={handleCancelExam}>Hủy</Button>
            
              <Button type="primary" onClick={handleSaveExam}>Lưu đề</Button>
            </Space>
                      
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamPreview;
