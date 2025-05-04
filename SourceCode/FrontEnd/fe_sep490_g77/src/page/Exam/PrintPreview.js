import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getExam } from "../../services/api";
import { Button } from "antd";
import { InlineMath } from "react-katex";
import "katex/dist/katex.min.css";

const PrintPreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);

  // Editable Header Fields
  const [schoolHeader, setSchoolHeader] = useState("BỘ GIÁO DỤC VÀ ĐÀO TẠO");
  const [examTitle, setExamTitle] = useState("ĐỀ THI CHÍNH THỨC");
  const [examNote, setExamNote] = useState("(Đề thi có 05 trang)");
  const [mainTitle, setMainTitle] = useState(
    "KỲ THI TỐT NGHIỆP TRUNG HỌC PHỔ THÔNG"
  );
  const [subjectName, setSubjectName] = useState("");
  const [examDuration, setExamDuration] = useState(
    "Thời gian làm bài: 90 phút, không kể thời gian phát đề"
  );
  const [examCode, setExamCode] = useState("101");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getExam(id);
        const parsed = JSON.parse(data.examdata);
        const questionsFromCode = parsed.ExamCodes?.[0]?.Questions || [];

        // Cập nhật tiêu đề từ dữ liệu exam
        setMainTitle(
          `KỲ THI TỐT NGHIỆP TRUNG HỌC PHỔ THÔNG NĂM ${new Date(
            data.createdate
          ).getFullYear()}`
        );
        setSubjectName(`Bài thi: ${data.subject?.toUpperCase() || "TOÁN"}`);
        setExamCode(parsed.ExamCodes?.[0]?.ExamCode || "101");

        setQuestions(questionsFromCode);
      } catch (err) {
        console.error("Lỗi khi lấy dữ liệu bài thi:", err);
      }
    })();
  }, [id]);

  const alphabetLabels = ["A", "B", "C", "D", "E", "F"];

  const renderInlineContent = (content) => {
    // 1. Remove all tags except [MATH:...] placeholders
    const cleanContent = content.replace(/<\/?[^>]+(>|$)/g, ""); // Remove all HTML tags

    // 2. Split by math placeholders
    const tokens = cleanContent.split(/(\[MATH:[^\]]+\])/);

    // 3. Render
    return tokens.map((tok, i) => {
      const m = tok.match(/^\[MATH:([^\]]+)\]$/);
      if (m) {
        return (
          <InlineMath
            key={i}
            math={m[1]}
            style={{ display: "inline", verticalAlign: "baseline" }}
          />
        );
      }
      return <span key={i}>{tok}</span>;
    });
  };

  const isLongAnswer = (answers) => {
    return answers.some(
      (a) => a.Content.replace(/<\/?[^>]+(>|$)/g, "").length > 40
    );
  };

  return (
    <div className="bg-gray-100 flex justify-center py-8 px-4 print:px-0">
      <div
        className="print-container"
        style={{ fontFamily: "Times New Roman" }}
      >
        <div className="flex justify-between items-center mb-6 print:hidden">
          <Button onClick={() => navigate(-1)}>← Quay lại</Button>
          <Button type="primary" onClick={() => window.print()}>
            In PDF
          </Button>
        </div>

        {/* Header */}
        <div className="flex justify-between mb-4">
          <div className="text-left" style={{ width: "45%" }}>
            <input
              value={schoolHeader}
              onChange={(e) => setSchoolHeader(e.target.value)}
              style={{ fontWeight: "bold", border: "none", width: "100%" }}
            />
            <input
              value={examTitle}
              onChange={(e) => setExamTitle(e.target.value)}
              style={{ fontWeight: "bold", border: "none", width: "100%" }}
            />
            <input
              value={examNote}
              onChange={(e) => setExamNote(e.target.value)}
              style={{ fontStyle: "italic", border: "none", width: "100%" }}
            />
          </div>
          <div className="text-center" style={{ width: "45%" }}>
            <input
              value={mainTitle}
              onChange={(e) => setMainTitle(e.target.value)}
              style={{
                fontWeight: "bold",
                textAlign: "center",
                border: "none",
                width: "100%",
              }}
            />
            <input
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              style={{
                fontWeight: "bold",
                textAlign: "center",
                border: "none",
                width: "100%",
              }}
            />
            <input
              value={examDuration}
              onChange={(e) => setExamDuration(e.target.value)}
              style={{
                fontStyle: "italic",
                textAlign: "center",
                border: "none",
                width: "100%",
              }}
            />
          </div>
        </div>

        {/* Thông tin thí sinh */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <p>
              Họ, tên thí sinh:
              ...............................................................
            </p>
            <p>
              Số báo danh:
              ...............................................................
            </p>
          </div>
          <div className="border border-black px-2 py-1 font-bold">
            Mã đề thi
            <input
              value={examCode}
              onChange={(e) => setExamCode(e.target.value)}
              style={{
                width: 40,
                textAlign: "center",
                border: "none",
                fontWeight: "bold",
              }}
            />
          </div>
        </div>

        {/* Nội dung câu hỏi */}
        <main>
          {questions.map((q, idx) => {
            const isHorizontal = q.Answers.every((a) => a.Content.length <= 40);
            return (
              <section
                key={q.QuestionId}
                className="mb-6"
                style={{ pageBreakInside: "avoid" }}
              >
                <div className="flex flex-wrap items-start mb-2">
                  <span
                    className="font-semibold mr-2"
                    style={{ minWidth: "2rem" }}
                  >
                    Câu {idx + 1}:
                  </span>
                  <div className="flex-1">
                    {renderInlineContent(q.Content)}
                    {q.ImageUrl && (
                      <div className="mt-2">
                        <img
                          src={q.ImageUrl}
                          alt={`Hình câu ${idx + 1}`}
                          style={{ maxWidth: "100%" }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div
                  className={`ml-6 grid ${
                    isLongAnswer(q.Answers) ? "grid-cols-2" : "grid-cols-4"
                  } gap-x-12 gap-y-2`}
                  style={{ maxWidth: "100%" }}
                >
                  {q.Answers.map((ans, i) => (
                    <div
                      key={ans.AnswerId}
                      className="flex items-start"
                      style={{ breakInside: "avoid", minWidth: "160px" }}
                    >
                      <span
                        className="font-semibold mr-1"
                        style={{ minWidth: 20 }}
                      >
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

        <style>{`
  @media screen {
  .print-container {
    width: 1123px; /* Kích thước A3 (portrait) gần đúng: 1123px = 297mm @ 96dpi */
    min-height: 1587px; /* Kích thước A3 height gần đúng = 420mm @ 96dpi */
    padding: 10px;
    margin: 0 auto;
    background: white;
    box-shadow: 0 0 10px rgba(0,0,0,0.15);
    font-size: 13pt;
    box-sizing: border-box;
  }

  body {
    overflow: auto;
    background: #e5e7eb; /* giữ màu nền xám như trước */
  }
}


  @media print {
  @page {
    size: A3 portrait;
    margin: 10mm;
  }

  html, body {
    font-size: 12pt;
    background: white;
  }

  input {
    border: none !important;
    outline: none !important;
  }

  .print\:hidden {
    display: none !important;
  }

  .shadow-md {
    box-shadow: none !important;
  }

  img {
    max-width: 100%;
    max-height: 100%;
    page-break-inside: avoid;
  }

  section {
    page-break-inside: avoid;
  }
}


`}</style>
      </div>
    </div>
  );
};

export default PrintPreview;
