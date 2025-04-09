import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { List, Card, Skeleton, Button } from "antd";
import axios from "axios";
import { toast } from "react-toastify";
import parse from "html-react-parser";
import { InlineMath } from "react-katex";
import "katex/dist/katex.min.css";

const EssQuestionList = () => {
  const { sectionId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [questionTypes, setQuestionTypes] = useState([]);
  const [levels, setLevels] = useState([]);

  useEffect(() => {
    if (sectionId) {
      fetchQuestions();
      fetchQuestionTypes();
      fetchLevels();
    }
  }, [sectionId]);

  const fetchQuestions = async () => {
    try {
      const response = await axios.get(
        `https://localhost:7052/api/Bank/default/${sectionId}/questions`
      );
      setQuestions(response.data || []);
    } catch (error) {
      toast.error("Không thể tải danh sách câu hỏi!");
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestionTypes = async () => {
    try {
      const res = await axios.get("https://localhost:7052/api/Question/types");
      setQuestionTypes(res.data || []);
    } catch {
      toast.error("Không thể tải loại câu hỏi!");
    }
  };

  const fetchLevels = async () => {
    try {
      const res = await axios.get("https://localhost:7052/api/Question/levels");
      setLevels(res.data || []);
    } catch {
      toast.error("Không thể tải độ khó!");
    }
  };

  const renderMathText = (text) => {
    return parse(
      text.replace(/\[MATH:(.+?)\]/g, (_, formula) => {
        return `<span class="katex-math" data-formula="${formula}">$$${formula}$$</span>`;
      }),
      {
        replace: (domNode) => {
          if (domNode.attribs && domNode.attribs.class === "katex-math") {
            const formula = domNode.attribs["data-formula"];
            return <InlineMath math={formula} />;
          }
        },
      }
    );
  };

  const renderMathList = (items) => {
    return items.map((item, idx) => (
      <div key={idx}>{renderMathText(item)}</div>
    ));
  };

  const getTypeName = (typeId) => {
    return (
      questionTypes.find((t) => t.typeId === typeId)?.typeName || `Type ${typeId}`
    );
  };

  const getLevelName = (modeid) => {
    return (
      levels.find((l) => l.levelId === modeid)?.levelName || `Level ${modeid}`
    );
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="bg-white p-6 shadow-md rounded-lg mb-6 w-3/4 mx-auto">
        <h1 className="text-2xl font-bold mb-4">Danh Sách Câu Hỏi</h1>

        {loading ? (
          <Skeleton active />
        ) : questions.length === 0 ? (
          <p className="text-gray-500">Không có câu hỏi nào trong section này.</p>
        ) : (
          <List
            grid={{ gutter: 16, column: 1 }}
            dataSource={questions}
            renderItem={(question, index) => {
              let answers = [];
              try {
                answers = JSON.parse(question.answerContent || "[]");
              } catch {
                answers = [question.answerContent];
              }
              return (
                <List.Item key={question.quesid}>
                  <Card
                    title={
                      <div>
                        <strong className="block mb-2">#{index + 1}</strong>
                        {renderMathText(question.quescontent)}
                        {question.imageUrl && (
                          <div className="mt-3 border rounded p-2 bg-gray-50">
                            <img
                              src={question.imageUrl.startsWith("http")
                                ? question.imageUrl
                                : `https://localhost:7052${question.imageUrl}`}
                              alt="Question"
                              className="max-w-full max-h-64 object-contain"
                            />
                          </div>
                        )}
                      </div>
                    }
                    className="shadow"
                  >
                    <p>
                      <strong>Loại câu hỏi:</strong> {getTypeName(question.typeId)}
                    </p>
                    <p>
                      <strong>Độ khó:</strong> {getLevelName(question.modeid)}
                    </p>

                    {answers && answers.length > 0 && (
                      <p>
                        <strong>Đáp án:</strong> {renderMathList(answers)}
                      </p>
                    )}

{question.correctAnswers && question.correctAnswers.length > 0 && (
  <>
    {question.typeId === 2 ? (
      <div>
        {["a", "b", "c", "d"].map((label, idx) => (
          <p key={idx}>
            <strong>ý {label}:</strong> {question.correctAnswers[idx]}
          </p>
        ))}
      </div>
    ) : (
      <p>
        <strong>Đáp án đúng:</strong> {renderMathList(question.correctAnswers)}
      </p>
    )}
  </>
)}

                    {question.solution && (
                      <p>
                        <strong>Giải thích:</strong> {question.solution}
                      </p>
                    )}
                  </Card>
                </List.Item>
              );
            }}
          />
        )}
      </div>

      <div className="flex justify-center mt-6">
        <Button type="default" onClick={() => navigate(-1)}>
          Quay lại
        </Button>
      </div>
    </div>
  );
};

export default EssQuestionList;
