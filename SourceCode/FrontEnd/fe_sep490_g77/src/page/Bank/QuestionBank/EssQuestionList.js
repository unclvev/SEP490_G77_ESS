import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { List, Card, Skeleton, Button } from "antd";
import axios from "axios";
import { toast } from "react-toastify";

const EssQuestionList = () => {
  const { sectionId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sectionId) {
      fetchQuestions();
    }
  }, [sectionId]);

  const fetchQuestions = async () => {
    try {
      const response = await axios.get(`https://localhost:7052/api/Bank/default/${sectionId}/questions`);
      
      console.log("✅ API Response:", response.data);
      setQuestions(response.data || []);
      
    } catch (error) {
      console.error("❌ Error fetching questions:", error);
      toast.error("Không thể tải danh sách câu hỏi!");
      setQuestions([]);
    } finally {
      setLoading(false);
    }
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
            renderItem={(question, index) => (
              <List.Item key={question.quesid}>
                <Card title={`#${index + 1} - ${question.quescontent}`} className="shadow">
                  <p><strong>Loại câu hỏi:</strong> {question.typeId}</p>
                  <p><strong>Độ khó:</strong> {question.modeid}</p>

                  {question.solution && (
                    <p><strong>Giải thích:</strong> {question.solution}</p>
                  )}

                  {question.answerContent && (
                    <p><strong>Đáp án:</strong> {question.answerContent}</p>
                  )}

                  {/* Fix: Match the property name from API response and add null check */}
                  {question.correctAnswers && question.correctAnswers.length > 0 && (
                    <p><strong>Đáp án đúng:</strong> {question.correctAnswers.join(", ")}</p>
                  )}
                </Card>
              </List.Item>
            )}
          />
        )}
      </div>

      <div className="flex justify-center mt-6">
        <Button type="default" onClick={() => navigate(-1)}>Quay lại</Button>
      </div>
    </div>
  );
};

export default EssQuestionList;