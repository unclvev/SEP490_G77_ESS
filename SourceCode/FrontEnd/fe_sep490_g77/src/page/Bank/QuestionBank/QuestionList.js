import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button, List, Card, Select, Input, Checkbox, message, Popconfirm, Upload } from "antd";
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
    answers: ["", "", "", ""], 
    correctAnswers: [],
  });

  useEffect(() => {
    fetchQuestions();
    fetchQuestionTypes();
    fetchLevels();
  }, [sectionId]);
  useEffect(() => {
    // Khi typeId thay đổi thành 1 (trắc nghiệm), đảm bảo có 4 ô đáp án
    if (newQuestion.typeId === 1) {
      setNewQuestion(prev => ({
        ...prev,
        answers: [...(prev.answers.length ? prev.answers : []), "", "", "", ""].slice(0, 4),
        correctAnswers: prev.correctAnswers || []
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

      // Nếu là trắc nghiệm (type 1) mà không có đủ 4 đáp án, tạo đủ 4 ô
      let updatedAnswers = question.typeId === 1
        ? [...(question.answers || []), "", "", "", ""].slice(0, 4) // Đảm bảo luôn có đúng 4 ô
        : [];

      setNewQuestion({
        quescontent: question.quescontent || "",
        typeId: question.typeId || null,
        modeid: question.modeid || null,  
        secid: sectionId,
        solution: question.solution || "",
        answers: updatedAnswers, // Cập nhật danh sách đáp án
        correctAnswers: question.correctAnswers || [], // Đáp án đúng (nếu có)
      });
    } else {
      setCurrentQuestion(null);
      setNewQuestion({
        quescontent: "",
        typeId: null,
        modeid: null,
        secid: sectionId,
        solution: "",
        answers: ["", "", "", ""], // Mặc định 4 ô trống
        correctAnswers: [],
      });
    }
};



  
  

  const handleSave = async () => {
    if (!newQuestion.quescontent.trim() || !newQuestion.typeId || !newQuestion.modeid) {
      toast.warning("⚠️ Vui lòng nhập đầy đủ thông tin câu hỏi!");
      return;
    }
  
    try {
      const requestData = {
        quescontent: newQuestion.quescontent,
        typeId: newQuestion.typeId,
        modeid: newQuestion.modeid,
        secid: newQuestion.secid,
        solution: newQuestion.typeId === 1 ? "" : newQuestion.solution,
        answers: newQuestion.typeId === 1 ? newQuestion.answers : [], // Đảm bảo gửi đủ 4 đáp án
        correctAnswers: newQuestion.typeId === 1 ? newQuestion.correctAnswers : [], // Đáp án đúng
      };
  
      let response;
      if (currentQuestion) {
        response = await axios.put(`https://localhost:7052/api/Question/questions/${currentQuestion.quesid}`, requestData);
      } else {
        response = await axios.post(`https://localhost:7052/api/Question/questions`, requestData);
      }
  
      toast.success("✅ Lưu câu hỏi thành công!", 2);
      setIsEditing(false);
      setNewQuestion({
        quescontent: "",
        typeId: null,
        modeid: null,
        secid: sectionId,
        solution: "",
        answers: ["", "", "", ""], // Đặt lại 4 ô trống
        correctAnswers: [],
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
      fetchQuestions(); // 🔹 Làm mới danh sách sau khi xóa
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
        await fetchQuestions(); // 🟢 **Tải lại danh sách ngay lập tức**
      } else {
        toast.error("❌ Import không thành công, vui lòng thử lại!");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "❌ Lỗi khi import Excel!");
    }
  };
  

  return (
    <div className="p-6 bg-gray-100 min-h-screen grid grid-cols-2 gap-6">
      {/* 🔹 DANH SÁCH CÂU HỎI */}
      <div className="bg-white p-6 shadow-md rounded">
        <h1 className="text-2xl font-bold mb-4">Danh Sách Câu Hỏi</h1>
        <Button type="primary" className="mb-4" onClick={() => handleEdit()}>
          Thêm Câu Hỏi
        </Button>

        {/* 🟢 Nút Export và Import */}
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
                title={`#${index + 1} - ${question.quescontent} (ID: ${question.quesid})`}
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
                <p><strong>Độ khó:</strong> {question.modeid}</p>
                
                {question.typeId !== 1 && question.solution && question.solution.trim() !== "" && (
                  <p><strong>Giải thích (Solution):</strong> {question.solution}</p>
                )}

                {question.typeId === 1 && (
                  <>
                    <p><strong>Đáp án:</strong> {question.answers.join(", ")}</p>
                    <p><strong>Đáp án đúng:</strong> {question.correctAnswers.join(", ")}</p>
                  </>
                )}
              </Card>
            </List.Item>
          )}
        />
      </div>

      {/* 🔹 FORM THÊM/SỬA CÂU HỎI */}
      <div className="bg-white p-6 shadow-md rounded">
        <h2 className="text-2xl font-bold mb-4">{currentQuestion ? "Chỉnh Sửa Câu Hỏi" : "Thêm Câu Hỏi"}</h2>

        <label className="font-semibold">Loại câu hỏi</label>
        <Select
          className="w-full mb-4"
          value={newQuestion.typeId ?? undefined}
          onChange={(value) => setNewQuestion({ ...newQuestion, typeId: value })}
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
        <TextArea rows={4} className="mb-4" value={newQuestion.quescontent } onChange={(e) => setNewQuestion({ ...newQuestion, quescontent: e.target.value })}/>

        {newQuestion.typeId === 1 ? (
  <div className="mb-4">
    {newQuestion.answers.map((answer, index) => (
      <div key={index} className="flex items-center mb-2">
        <Input 
          className="mr-2" 
          placeholder={`Đáp án ${index + 1}`} 
          value={answer} 
          onChange={(e) => {
            const updatedAnswers = [...newQuestion.answers];
            updatedAnswers[index] = e.target.value;
            setNewQuestion({ ...newQuestion, answers: updatedAnswers });
          }}
        />
        <Checkbox 
          checked={newQuestion.correctAnswers.includes(answer)} 
          onChange={(e) => {
            let updatedCorrectAnswers = [...newQuestion.correctAnswers];
            if (e.target.checked) {
              updatedCorrectAnswers.push(answer);
            } else {
              updatedCorrectAnswers = updatedCorrectAnswers.filter(ans => ans !== answer);
            }
            setNewQuestion({ ...newQuestion, correctAnswers: updatedCorrectAnswers });
          }}
        >
          Đúng
        </Checkbox>
      </div>
    ))}
  </div>
) : (
  <>
    <label className="font-semibold">Giải thích (Solution)</label>
    <TextArea rows={2} className="mb-4" 
      value={newQuestion.solution} 
      onChange={(e) => setNewQuestion({ ...newQuestion, solution: e.target.value })}
    />
  </>
)}


        <Button type="primary" className="w-full mb-2" onClick={handleSave}>Lưu Câu Hỏi</Button>
      </div>
    </div>
  );
};

export default QuestionList;
