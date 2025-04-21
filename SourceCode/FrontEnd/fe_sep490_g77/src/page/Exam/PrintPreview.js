import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { getExam } from "../../services/api";
import { Button } from 'antd';
import { BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

const PrintPreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [examInfo, setExamInfo] = useState(null);
  const [questions, setQuestions] = useState([]);

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

  useEffect(() => {
    if (examInfo) {
      // delay để KaTeX render xong rồi in
      setTimeout(() => window.print(), 500);
    }
  }, [examInfo]);

  // Tách nội dung câu hỏi thành spans/BlockMath, để render inline
  const renderInlineContent = (content) => {
    const tokens = content.split(/(\[MATH:[^\]]+\])/);
    return tokens.map((tok, i) => {
      const m = tok.match(/^\[MATH:([^\]]+)\]$/);
      if (m) return <BlockMath key={i}>{m[1]}</BlockMath>;
      return <span key={i} dangerouslySetInnerHTML={{ __html: tok }} />;
    });
  };

  const alphabetLabels = ["A", "B", "C", "D", "E", "F"];

  return (
    <div
      className="p-8 bg-white"
      style={{ fontFamily: 'Times New Roman', fontSize: '10pt' }}
    >
      {/* Toolbar chỉ hiện trên màn hình, ẩn khi in */}
      <div className="flex justify-between items-center mb-6 print:hidden">
        <Button onClick={() => navigate(-1)}>← Quay lại</Button>
        <Button type="primary" onClick={() => window.print()}>In PDF</Button>
      </div>

      <div className="flex justify-between mb-4">
    <div className="text-left" style={{ width: '45%' }}>
      <p style={{ margin: 0, fontWeight: 'bold' }}>BỘ GIÁO DỤC VÀ ĐÀO TẠO</p>
      <p style={{ margin: 0, fontWeight: 'bold' }}>ĐỀ THI CHÍNH THỨC</p>
      <p style={{ margin: 0 }}><em>(Đề thi có 05 trang)</em></p>
    </div>
    <div className="text-center" style={{ width: '45%' }}>
      <p style={{ margin: 0, fontWeight: 'bold' }}>KỲ THI TỐT NGHIỆP TRUNG HỌC PHỔ THÔNG NĂM 2024</p>
      <p style={{ margin: 0, fontWeight: 'bold' }}>Bài thi: TOÁN</p>
      <p style={{ margin: 0 }}><em>Thời gian làm bài: 90 phút, không kể thời gian phát đề</em></p>
    </div>
  </div>

  {/* Dòng thông tin thí sinh */}
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
      Mã đề thi 101
    </div>
  </div>

      

      {/* Nội dung câu hỏi */}
      <main>
        {questions.map((q, idx) => {
          // Kiểm tra độ dài đáp án để quyết định hướng xếp
          const isHorizontal = q.Answers.every(a => a.Content.length <= 40);

          return (
            <section key={q.QuestionId} className="mb-6">
              {/* Dòng “Câu X: [câu hỏi]” */}
              <div className="flex flex-wrap items-start mb-2">
                <span className="font-semibold mr-2" style={{ minWidth: '2rem' }}>
                  Câu {idx + 1}:
                </span>
                <div className="flex-1">
                  {renderInlineContent(q.Content)}
                </div>
              </div>

              {/* Đáp án */}
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
                    <span dangerouslySetInnerHTML={{ __html: ans.Content }} />
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
};

export default PrintPreview;
