import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  List,
  Card,
  Skeleton,
  Button,
  Tag,
  Space,
  Typography,
} from "antd";
import { UpOutlined, DownOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";
import parse from "html-react-parser";
import { InlineMath } from "react-katex";
import "katex/dist/katex.min.css";
import {
  getDefaultQuestions,
  getQuestionTypes,
  getLevels,
} from "../../../services/api";

const { Title, Paragraph } = Typography;

export default function EssQuestionList() {
  const { sectionId } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [questionTypes, setQuestionTypes] = useState([]);
  const [levels, setLevels] = useState([]);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (!sectionId) return;
    Promise.all([
      getDefaultQuestions(sectionId),
      getQuestionTypes(),
      getLevels(),
    ])
      .then(([qRes, tRes, lRes]) => {
        const qs = (qRes.data || []).map((q) => {
          const answers =
            q.typeId === 1 && typeof q.answer_content === "string"
              ? q.answer_content.split(";").map((s) => s.trim())
              : q.answers || [];

          let correctAnswers = [];
          if (typeof q.correct_answer === "string") {
            correctAnswers = q.correct_answer.split(";").map((s) => s.trim());
          } else if (q.ans_id != null && answers.length) {
            const idx = parseInt(q.ans_id, 10) - 1;
            if (idx >= 0 && idx < answers.length) correctAnswers = [answers[idx]];
          } else if (Array.isArray(q.correctAnswers)) {
            correctAnswers = q.correctAnswers;
          }

          return { ...q, answers, correctAnswers };
        });

        setQuestions(qs);
        setQuestionTypes(tRes.data || []);
        setLevels(lRes.data || []);
      })
      .catch(() => {
        toast.error("Lỗi tải dữ liệu!");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [sectionId]);

  const renderQuestionWithMath = (htmlContent) => (
    <div>
      {parse(htmlContent, {
        replace: (domNode) => {
          if (domNode.attribs?.class === "katex-math") {
            return <InlineMath math={domNode.attribs["data-formula"]} />;
          }
        },
      })}
    </div>
  );

  const renderQuestionContent = (question) => {
    switch (question.typeId) {
      case 1: // Trắc nghiệm
        return (
          <>
            {question.answers && question.answers.length > 0 ? (
              <ul className="list-disc ml-6">
                {question.answers.map((answer, index) => (
                  <li key={index} className="py-1">
                    {answer.includes("[MATH:") ? (
                      <>
                        {renderQuestionWithMath(
                          answer.replace(
                            /\[MATH:(.*?)\]/g,
                            '<span class="katex-math" data-formula="$1">$$1</span>'
                          )
                        )}
                      </>
                    ) : (
                      answer
                    )}
                    {question.correctAnswers.includes(answer) && (
                      <span className="text-green-600 font-semibold"> ✓</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-red-500 font-semibold">
                ⚠️ Cần có ít nhất 1 đáp án!
              </p>
            )}
          </>
        );

      case 2: // True/False
        return (
          <>
            {question.correctAnswers && question.correctAnswers.length === 4 ? (
              <ul className="list-none ml-2">
                {question.correctAnswers.map((ans, index) => (
                  <li key={index} className="py-1">
                    <strong className="mr-1">
                      {String.fromCharCode(65 + index)}.
                    </strong>
                    <span
                      className={`px-2 py-0.5 rounded text-white text-sm font-medium ${
                        ans.toLowerCase() === "true"
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    >
                      {ans}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-red-500 font-semibold">
                ⚠️ Cần đúng 4 đáp án True/False!
              </p>
            )}
          </>
        );

      case 3: // Điền kết quả
        return (
          <>
            {question.correctAnswers &&
            question.correctAnswers[0]?.length === 4 ? (
              <p className="font-semibold">
                Đáp án đúng:{" "}
                <span className="bg-blue-100 px-3 py-1 rounded ml-2">
                  {question.correctAnswers[0]}
                </span>
              </p>
            ) : (
              <p className="text-red-500 font-semibold">
                ⚠️ Đáp án đúng phải đủ 4 ký tự!
              </p>
            )}
          </>
        );

      default:
        return (
          <p className="text-red-500 font-semibold">
            ⚠️ Loại câu hỏi không xác định!
          </p>
        );
    }
  };

  const getType = (id) =>
    questionTypes.find((t) => t.typeId === id)?.typeName || "N/A";
  const getLevel = (id) =>
    levels.find((l) => l.levelId === id)?.levelName || "N/A";

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="bg-white p-6 rounded shadow mb-6 w-3/4 mx-auto">
        <Title level={2}>Danh Sách Câu Hỏi</Title>

        {loading ? (
          <Skeleton active />
        ) : questions.length === 0 ? (
          <p>Không có câu hỏi.</p>
        ) : (
          <List
            itemLayout="vertical"
            dataSource={questions}
            renderItem={(q, idx) => {
              const isOpen = expanded === q.quesid;
              return (
                <List.Item key={q.quesid}>
                  <Card style={{ marginBottom: 16, borderRadius: 8 }} bodyStyle={{ padding: 16 }}>
                    <Space align="center" justify="space-between" style={{ width: "100%" }}>
                      <Title level={5} style={{ margin: 0 }}>
                        Câu {idx + 1}
                      </Title>
                      <Space>
                        <Tag color="blue">{getType(q.typeId)}</Tag>
                        <Tag color="green">{getLevel(q.modeid)}</Tag>
                      </Space>
                    </Space>

                    <Paragraph style={{ margin: "16px 0" }}>
                      {renderQuestionWithMath(q.quescontent)}
                    </Paragraph>

                    {q.imageUrl && (
                      <div className="my-4 p-2 border rounded bg-gray-50">
                        <img
                          src={
                            q.imageUrl.startsWith("http")
                              ? q.imageUrl
                              : `http://localhost:7052${q.imageUrl}`
                          }
                          alt="Question"
                          className="max-w-full max-h-64 object-contain"
                        />
                      </div>
                    )}

                    {renderQuestionContent(q)}

                    {q.solution && (
                      <div style={{ marginTop: 12 }}>
                        <Button
                          type="link"
                          icon={isOpen ? <UpOutlined /> : <DownOutlined />}
                          onClick={() => setExpanded(isOpen ? null : q.quesid)}
                        >
                          {isOpen ? "Ẩn giải thích" : "Xem giải thích"}
                        </Button>
                        {isOpen && (
                          <Paragraph
                            type="secondary"
                            style={{ marginTop: 8, paddingLeft: 16, borderLeft: "2px solid #f0f0f0" }}
                          >
                            {q.solution}
                          </Paragraph>
                        )}
                      </div>
                    )}
                  </Card>
                </List.Item>
              );
            }}
          />
        )}
      </div>

      <div className="text-center">
        <Button onClick={() => navigate(-1)}>Quay lại</Button>
      </div>
    </div>
  );
}
