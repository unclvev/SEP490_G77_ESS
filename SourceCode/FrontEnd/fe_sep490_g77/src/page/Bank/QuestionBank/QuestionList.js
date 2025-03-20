import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button, List, Card, Select, Input, Radio, message, Popconfirm, Upload } from "antd";
import { DeleteOutlined, DownloadOutlined, UploadOutlined } from "@ant-design/icons";
import axios from "axios";
import { toast } from "react-toastify";

const { TextArea } = Input;
const { Option } = Select;

const QuestionList = () => {
  const { sectionId } = useParams();
  const [questions, setQuestions] = useState([]);
  const [questionTypes, setQuestionTypes] = useState([]);
  const [levels, setLevels] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);

  const [newQuestion, setNewQuestion] = useState({
    quescontent: "",
    typeId: null,
    modeid: null,
    secid: sectionId,
    solution: "",
    answers: [],
    correctAnswers: [""],
  });

  useEffect(() => {
    fetchQuestions();
    fetchQuestionTypes();
    fetchLevels();
  }, [sectionId]);

  useEffect(() => {
    // Khi typeId thay đổi, cập nhật form theo loại câu hỏi
    if (newQuestion.typeId === 1) {
      // Trắc nghiệm: 4 đáp án
      setNewQuestion(prev => ({
        ...prev,
        answers: [...(prev.answers.length ? prev.answers : []), "", "", "", ""].slice(0, 4),
        correctAnswers: prev.correctAnswers.length ? [prev.correctAnswers[0]] : [""]
      }));
    } else if (newQuestion.typeId === 2) {
      // True/False: mặc định là True,False
      setNewQuestion(prev => ({
        ...prev,
        answers: ["True", "False"],
        correctAnswers: prev.correctAnswers.length ? [prev.correctAnswers[0]] : ["True"]
      }));
    } else if (newQuestion.typeId === 3) {
      // Điền kết quả: không cần answers, chỉ cần correctAnswers
      setNewQuestion(prev => ({
        ...prev,
        answers: [],
        correctAnswers: prev.correctAnswers.length ? [prev.correctAnswers[0]] : [""]
      }));
    }
  }, [newQuestion.typeId]);

  const fetchQuestions = async () => {
    try {
      const response = await axios.get(`https://localhost:7052/api/Question/questions?sectionId=${sectionId}`);
      setQuestions(response.data);
    } catch (error) {
      toast.error("Lỗi khi tải danh sách câu hỏi!");
    }
  };

  const fetchQuestionTypes = async () => {
    try {
      const response = await axios.get(`https://localhost:7052/api/Question/types`);
      setQuestionTypes(response.data);
    } catch (error) {
      toast.error("Lỗi khi tải danh sách loại câu hỏi!");
    }
  };

  const fetchLevels = async () => {
    try {
      const response = await axios.get(`https://localhost:7052/api/Question/levels`);
      setLevels(response.data);
    } catch (error) {
      toast.error("Lỗi khi tải danh sách độ khó!");
    }
  };

  const handleEdit = (question = null) => {
    setIsEditing(true);
    if (question) {
      setCurrentQuestion(question);

      let updatedAnswers = [];
      let correctAnswer = question.correctAnswers.length > 0 ? question.correctAnswers[0] : "";

      if (question.typeId === 1) {
        // Trắc nghiệm: đảm bảo có 4 đáp án
        updatedAnswers = [...(question.answers || []), "", "", "", ""].slice(0, 4);
      } else if (question.typeId === 2) {
        // True/False: luôn là ["True", "False"]
        updatedAnswers = ["True", "False"];
      }

      setNewQuestion({
        quescontent: question.quescontent || "",
        typeId: question.typeId || null,
        modeid: question.modeid || null,
        secid: sectionId,
        solution: question.solution || "",
        answers: updatedAnswers,
        correctAnswers: [correctAnswer],
      });
    } else {
      setCurrentQuestion(null);
      setNewQuestion({
        quescontent: "",
        typeId: null,
        modeid: null,
        secid: sectionId,
        solution: "",
        answers: [],
        correctAnswers: [""],
      });
    }
  };

  const handleSave = async () => {
    if (!newQuestion.quescontent.trim() || !newQuestion.typeId || !newQuestion.modeid) {
      toast.warning("⚠️ Vui lòng nhập đầy đủ thông tin câu hỏi!");
      return;
    }

    // Kiểm tra thêm cho từng loại câu hỏi
    if (newQuestion.typeId === 1) {
      // Trắc nghiệm
      if (!newQuestion.correctAnswers[0]) {
        toast.warning("⚠️ Vui lòng chọn đáp án đúng!");
        return;
      }
      // Kiểm tra xem có ít nhất 2 đáp án khác nhau không trống
      const nonEmptyAnswers = newQuestion.answers.filter(a => a.trim() !== "");
      if (nonEmptyAnswers.length < 2) {
        toast.warning("⚠️ Câu hỏi trắc nghiệm cần ít nhất 2 đáp án!");
        return;
      }
    } else if (newQuestion.typeId === 3) {
      // Điền kết quả
      if (!newQuestion.correctAnswers[0] || newQuestion.correctAnswers[0].length !== 4) {
        toast.warning("⚠️ Đáp án điền kết quả phải có đúng 4 ký tự!");
        return;
      }
    }

    try {
      const requestData = {
        quescontent: newQuestion.quescontent,
        typeId: newQuestion.typeId,
        modeid: newQuestion.modeid,
        secid: parseInt(sectionId),
        solution: newQuestion.solution,
        answers: newQuestion.typeId === 1 ? newQuestion.answers : [],
        correctAnswers: [newQuestion.correctAnswers[0]],
      };

      let response;
      if (currentQuestion) {
        response = await axios.put(`https://localhost:7052/api/Question/questions/${currentQuestion.quesid}`, requestData);
      } else {
        response = await axios.post(`https://localhost:7052/api/Question/questions`, requestData);
      }

      toast.success("✅ Lưu câu hỏi thành công!");
      setIsEditing(false);
      setNewQuestion({
        quescontent: "",
        typeId: null,
        modeid: null,
        secid: sectionId,
        solution: "",
        answers: [],
        correctAnswers: [""],
      });

      fetchQuestions();
    } catch (error) {
      toast.error(error.response?.data?.message || "❌ Lỗi khi lưu câu hỏi!");
    }
  };

  const handleDelete = async (quesid) => {
    try {
      await axios.delete(`https://localhost:7052/api/Question/questions/${quesid}`);
      toast.success("Xóa câu hỏi thành công!");
      fetchQuestions();
    } catch (error) {
      toast.error("Lỗi khi xóa câu hỏi!");
    }
  };

  const handleExportExcel = () => {
    window.location.href = `https://localhost:7052/api/Question/${sectionId}/export-excel`;
  };

  const handleImportExcel = async ({ file }) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(`https://localhost:7052/api/Question/${sectionId}/import-excel`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.status === 200) {
        toast.success("✅ Import Excel thành công!");
        await fetchQuestions();
      } else {
        toast.error("❌ Import không thành công, vui lòng thử lại!");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "❌ Lỗi khi import Excel!");
    }
  };

  // Render các trường dữ liệu tùy theo loại câu hỏi
  const renderQuestionFields = () => {
    switch (newQuestion.typeId) {
      case 1: // Trắc nghiệm
        return (
          <div className="mb-4">
            <label className="font-semibold block mb-2">Đáp án</label>
            <Radio.Group 
              value={newQuestion.correctAnswers[0]}
              onChange={(e) => setNewQuestion({ ...newQuestion, correctAnswers: [e.target.value] })}
              className="w-full"
            >
              {newQuestion.answers.map((answer, index) => (
                <div key={index} className="flex items-center mb-2">
                  <Input
                    className="mr-2 flex-grow"
                    placeholder={`Đáp án ${index + 1}`}
                    value={answer}
                    onChange={(e) => {
                      const updatedAnswers = [...newQuestion.answers];
                      updatedAnswers[index] = e.target.value;
                      
                      // Nếu đáp án đang được chọn bị thay đổi, cập nhật giá trị trong correctAnswers
                      if (newQuestion.correctAnswers[0] === newQuestion.answers[index]) {
                        setNewQuestion({ 
                          ...newQuestion, 
                          answers: updatedAnswers, 
                          correctAnswers: [e.target.value] 
                        });
                      } else {
                        setNewQuestion({ ...newQuestion, answers: updatedAnswers });
                      }
                    }}
                  />
                  <Radio value={answer}>Đúng</Radio>
                </div>
              ))}
            </Radio.Group>
          </div>
        );
      
      case 2: // True/False
        return (
          <div className="mb-4">
            <label className="font-semibold block mb-2">Đáp án đúng</label>
            <Radio.Group 
              options={[
                { label: 'True', value: 'True' },
                { label: 'False', value: 'False' }
              ]}
              value={newQuestion.correctAnswers[0]}
              onChange={(e) => setNewQuestion({ ...newQuestion, correctAnswers: [e.target.value] })}
              optionType="button"
              buttonStyle="solid"
              className="w-full"
            />
          </div>
        );
      
      case 3: // Điền kết quả
        return (
          <div className="mb-4">
            <label className="font-semibold block mb-2">Đáp án đúng (4 ký tự)</label>
            <Input
              placeholder="Nhập đáp án (ví dụ: 1234, -123, 0.12, ...)"
              value={newQuestion.correctAnswers[0]}
              onChange={(e) => {
                // Giới hạn độ dài là 4 ký tự
                const value = e.target.value.slice(0, 4);
                setNewQuestion({ ...newQuestion, correctAnswers: [value] });
              }}
              maxLength={4}
              className="w-full"
            />
            <div className="text-xs text-gray-500 mt-1">
              Đáp án phải có đúng 4 ký tự (bao gồm cả dấu, số).
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  // 🟢 Hiển thị thông tin câu hỏi trong danh sách
const renderQuestionContent = (question) => {
  switch (question.typeId) {
    case 1: // Trắc nghiệm
      return (
        <>
          <p><strong>Loại câu hỏi:</strong> Trắc nghiệm</p>
          <p><strong>Đáp án:</strong></p>
          {question.answers && question.answers.length > 0 ? (
            question.answers.map((answer, index) => (
              <p key={index}>
                {answer} {question.correctAnswers.includes(answer) && " ✅"}
              </p>
            ))
          ) : (
            <p className="text-red-500">⚠️ Lỗi: Câu hỏi trắc nghiệm phải có ít nhất một đáp án!</p>
          )}
          {question.solution && (
            <p><strong>Giải thích:</strong> {question.solution}</p>
          )}
        </>
      );

    case 2: // True/False
      return (
        <>
          <p><strong>Loại câu hỏi:</strong> True/False</p>
          {question.correctAnswers && question.correctAnswers.length === 1 ? (
            <p><strong>Đáp án đúng:</strong> {question.correctAnswers[0]}</p>
          ) : (
            <p className="text-red-500">⚠️ Lỗi: Phải có một đáp án đúng là "True" hoặc "False"!</p>
          )}
          {question.solution && (
            <p><strong>Giải thích:</strong> {question.solution}</p>
          )}
        </>
      );

    case 3: // Điền kết quả
      return (
        <>
          <p><strong>Loại câu hỏi:</strong> Điền kết quả</p>
          {question.correctAnswers && question.correctAnswers[0] && question.correctAnswers[0].length === 4 ? (
            <p><strong>Đáp án đúng:</strong> {question.correctAnswers[0]}</p>
          ) : (
            <p className="text-red-500">⚠️ Lỗi: Đáp án đúng phải có đúng 4 ký tự!</p>
          )}
          {question.solution && (
            <p><strong>Giải thích:</strong> {question.solution}</p>
          )}
        </>
      );

    default:
      return <p className="text-red-500">⚠️ Lỗi: Loại câu hỏi không xác định!</p>;
  }
};
;

  return (
    <div className="p-6 bg-gray-100 min-h-screen grid grid-cols-2 gap-6">
      {/* DANH SÁCH CÂU HỎI */}
      <div className="bg-white p-6 shadow-md rounded">
        <h1 className="text-2xl font-bold mb-4">Danh Sách Câu Hỏi</h1>
        <Button type="primary" className="mb-4" onClick={() => handleEdit()}>
          Thêm Câu Hỏi
        </Button>

        {/* Nút Export và Import */}
        <div className="flex justify-between mb-4">
          <Button type="default" icon={<DownloadOutlined />} onClick={handleExportExcel}>
            Export Excel
          </Button>
          <Upload customRequest={handleImportExcel} showUploadList={false}>
            <Button type="primary" icon={<UploadOutlined />}>Import Excel</Button>
          </Upload>
        </div>
        <List
          itemLayout="vertical"
          dataSource={questions}
          renderItem={(question, index) => (
            <List.Item key={question.quesid}>
              <Card
                title={`#${index + 1} - ${question.quescontent}`}
                className="mb-2"
                extra={
                  <>
                    <Button onClick={() => handleEdit(question)}>Sửa</Button>
                    <Popconfirm 
                      title="Bạn có chắc muốn xóa?" 
                      onConfirm={() => handleDelete(question.quesid)}
                      okText="Xóa"
                      cancelText="Hủy"
                    >
                      <Button danger className="ml-2"><DeleteOutlined /></Button>
                    </Popconfirm>
                  </>
                }
              >
                <p><strong>Độ khó:</strong> {levels.find(l => l.levelId === question.modeid)?.levelName || question.modeid}</p>
                {renderQuestionContent(question)}
              </Card>
            </List.Item>
          )}
        />
      </div>

      {/* FORM THÊM/SỬA CÂU HỎI */}
      {isEditing && (
        <div className="bg-white p-6 shadow-md rounded">
          <h2 className="text-2xl font-bold mb-4">{currentQuestion ? "Chỉnh Sửa Câu Hỏi" : "Thêm Câu Hỏi"}</h2>

          <label className="font-semibold">Loại câu hỏi</label>
          <Select
            className="w-full mb-4"
            placeholder="Chọn loại câu hỏi"
            value={newQuestion.typeId ?? undefined}
            onChange={(value) => setNewQuestion({ 
              ...newQuestion, 
              typeId: value,
              // Reset other fields when changing question type
              answers: [],
              correctAnswers: [""]
            })}
          >
            {questionTypes.map((type) => (
              <Option key={type.typeId} value={type.typeId}>
                {type.typeName}
              </Option>
            ))}
          </Select>

          <label className="font-semibold">Độ khó</label>
          <Select
            className="w-full mb-4"
            placeholder="Chọn độ khó"
            value={newQuestion.modeid || undefined}
            onChange={(value) => setNewQuestion({ ...newQuestion, modeid: value })}
          >
            {levels.map((level) => (
              <Option key={level.levelId} value={level.levelId}>
                {level.levelName}
              </Option>
            ))}
          </Select>

          <label className="font-semibold">Nội dung câu hỏi</label>
          <TextArea 
            rows={4} 
            className="mb-4" 
            placeholder="Nhập nội dung câu hỏi"
            value={newQuestion.quescontent} 
            onChange={(e) => setNewQuestion({ ...newQuestion, quescontent: e.target.value })}
          />

          {/* Fields specific to question type */}
          {renderQuestionFields()}

          {/* Solution field for all question types */}
          <label className="font-semibold">Giải thích (Solution)</label>
          <TextArea 
            rows={3} 
            className="mb-4" 
            placeholder="Nhập giải thích cho câu hỏi (không bắt buộc)"
            value={newQuestion.solution} 
            onChange={(e) => setNewQuestion({ ...newQuestion, solution: e.target.value })}
          />

          <div className="flex gap-2">
            <Button type="primary" className="flex-grow" onClick={handleSave}>Lưu Câu Hỏi</Button>
            <Button onClick={() => setIsEditing(false)}>Hủy</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionList;