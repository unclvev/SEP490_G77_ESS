import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { getExam } from "../../services/api";
import { Button } from 'antd';
import { BlockMath, InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';

const PrintPreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [examInfo, setExamInfo] = useState(null);
  const [questions, setQuestions] = useState([]);

  // Các dòng tiêu đề editable
  const [schoolHeader, setSchoolHeader] = useState("BỘ GIÁO DỤC VÀ ĐÀO TẠO");
  const [examTitle, setExamTitle] = useState("ĐỀ THI CHÍNH THỨC");
  const [examNote, setExamNote] = useState("(Đề thi có 05 trang)");
  const [mainTitle, setMainTitle] = useState("KỲ THI TỐT NGHIỆP TRUNG HỌC PHỔ THÔNG NĂM 2024");
  const [subjectName, setSubjectName] = useState("Bài thi: TOÁN");
  const [examDuration, setExamDuration] = useState("Thời gian làm bài: 90 phút, không kể thời gian phát đề");
  const [examCode, setExamCode] = useState("101");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getExam(id);
        const parsed = JSON.parse(data.examdata);
        setExamInfo({
          name: parsed.exam.ExamName,
          grade: parsed.exam.Grade,
          subject: parsed.exam.Subject,
          date: new Date(data.createdate).toLocaleDateString(),
        });
        setQuestions(parsed.examdata.Questions || []);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [id]);

  const alphabetLabels = ["A", "B", "C", "D", "E", "F"];

  const renderInlineContent = (content) => {
    const tokens = content.split(/(\[MATH:[^\]]+\])/);
    return tokens.map((tok, i) => {
      const m = tok.match(/^\[MATH:([^\]]+)\]$/);
      if (m) return <InlineMath key={i}>{m[1]}</InlineMath>;
      return <span key={i} dangerouslySetInnerHTML={{ __html: tok }} />;
    });
  };

  return (
    <div
      className="p-8 bg-white"
      style={{ fontFamily: 'Times New Roman', fontSize: '10pt' }}
    >
      {/* Toolbar chỉ hiện khi xem, ẩn khi in */}
      <div className="flex justify-between items-center mb-6 print:hidden">
        <Button onClick={() => navigate(-1)}>← Quay lại</Button>
        <Button type="primary" onClick={() => window.print()}>In PDF</Button>
      </div>

      {/* Thông tin phần đầu */}
      <div className="flex justify-between mb-4">
        <div className="text-left" style={{ width: '45%' }}>
          <input
            value={schoolHeader}
            onChange={(e) => setSchoolHeader(e.target.value)}
            style={{ margin: 0, fontWeight: 'bold', border: 'none', width: '100%' }}
          />
          <input
            value={examTitle}
            onChange={(e) => setExamTitle(e.target.value)}
            style={{ margin: 0, fontWeight: 'bold', border: 'none', width: '100%' }}
          />
          <input
            value={examNote}
            onChange={(e) => setExamNote(e.target.value)}
            style={{ margin: 0, fontStyle: 'italic', border: 'none', width: '100%' }}
          />
        </div>
        <div className="text-center" style={{ width: '45%' }}>
          <input
            value={mainTitle}
            onChange={(e) => setMainTitle(e.target.value)}
            style={{ margin: 0, fontWeight: 'bold', textAlign: 'center', border: 'none', width: '100%' }}
          />
          <input
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
            style={{ margin: 0, fontWeight: 'bold', textAlign: 'center', border: 'none', width: '100%' }}
          />
          <input
            value={examDuration}
            onChange={(e) => setExamDuration(e.target.value)}
            style={{ margin: 0, fontStyle: 'italic', textAlign: 'center', border: 'none', width: '100%' }}
          />
        </div>
      </div>

      {/* Thông tin thí sinh */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <p style={{ marginBottom: '4px' }}>
            Họ, tên thí sinh: ...............................................................
          </p>
          <p style={{ marginBottom: '4px' }}>
            Số báo danh: ...............................................................
          </p>
        </div>
        <div className="border border-black px-2 py-1" style={{ fontWeight: 'bold' }}>
          Mã đề thi
          <input
            value={examCode}
            onChange={(e) => setExamCode(e.target.value)}
            style={{ width: 40, textAlign: 'center', border: 'none', fontWeight: 'bold' }}
          />
        </div>
      </div>

      {/* Nội dung câu hỏi */}
      <main>
        {questions.map((q, idx) => {
          const isHorizontal = q.Answers.every(a => a.Content.length <= 40);

          return (
            <section key={q.QuestionId} className="mb-6">
              <div className="flex flex-wrap items-start mb-2">
                <span className="font-semibold mr-2" style={{ minWidth: '2rem' }}>
                  Câu {idx + 1}:
                </span>
                <div className="flex-1">
                  {renderInlineContent(q.Content)}
                </div>
              </div>

              <div
                className={`ml-6 ${
                  isHorizontal
                    ? 'flex flex-wrap space-x-6'
                    : 'flex flex-col space-y-2'
                }`}
              >
                {q.Answers.map((ans, i) => (
                  <div key={ans.AnswerId} className="flex items-start">
                    <span className="font-semibold mr-1">
                      {alphabetLabels[i]}.
                    </span>
                    <div>{renderInlineContent(ans.Content)}</div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </main>

      {/* CSS để in đẹp */}
      <style>{`
        @media print {
          input {
            border: none !important;
            outline: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PrintPreview;
