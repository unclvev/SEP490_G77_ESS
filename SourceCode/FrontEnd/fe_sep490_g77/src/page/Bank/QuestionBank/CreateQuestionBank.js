import React, { useState, useEffect } from "react";
import { Select, Button, message, Spin } from "antd";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "tailwindcss/tailwind.css";

const { Option } = Select;

const CreateQuestionBank = () => {
  const navigate = useNavigate();
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [grade, setGrade] = useState(null);
  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState({ grade: false, subject: false });

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const response = await axios.get("https://localhost:7052/api/Bank/grades");
        setGrades(response.data || []);
      } catch (error) {
        message.error("Lỗi khi tải danh sách Khối học.");
      }
    };
    fetchGrades();
  }, []);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await axios.get("https://localhost:7052/api/Bank/subjects");
        setSubjects(response.data || []);
      } catch (error) {
        message.error("Lỗi khi tải danh sách Môn học.");
      }
    };
    fetchSubjects();
  }, []);

  const handleCreateBank = async () => {
    if (!grade || !subject) {
      setError({ grade: !grade, subject: !subject }); // ✅ Đánh dấu lỗi
      message.error("⚠️ Vui lòng chọn đầy đủ Khối học và Môn học!");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post("https://localhost:7052/api/Bank/generate", {
        gradeId: grade,
        subjectId: subject
      });

      if (response.status === 200) {
        message.success(`✅ Ngân hàng câu hỏi "${response.data.bankName}" đã được tạo thành công!`);
        navigate(`/question-bank-detail/${response.data.bankId}`);
      }
    } catch (error) {
      message.error("❌ Không thể tạo ngân hàng câu hỏi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen flex flex-col items-center">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center">
        TẠO CẤU TRÚC NGÂN HÀNG CÂU HỎI
      </h1>

      <div className="flex flex-col md:flex-row gap-3 items-center mb-6">
        <Select 
          placeholder="Chọn Khối học" 
          className={`w-52 ${error.grade ? "border-red-500" : ""}`} // ✅ Bôi đỏ nếu lỗi
          onChange={(value) => { setGrade(value); setError({ ...error, grade: false }); }} // ✅ Reset lỗi khi chọn
          value={grade}
          loading={grades.length === 0}
        >
          {grades.map((g) => (
            <Option key={g.gradeId} value={g.gradeId}>
              {g.gradeLevel.replace("Grade ", "")}
            </Option>
          ))}
        </Select>

        <Select 
          placeholder="Chọn Môn học" 
          className={`w-52 ${error.subject ? "border-red-500" : ""}`} // ✅ Bôi đỏ nếu lỗi
          onChange={(value) => { setSubject(value); setError({ ...error, subject: false }); }} // ✅ Reset lỗi khi chọn
          value={subject}
          loading={subjects.length === 0}
        >
          {subjects.map((s) => (
            <Option key={s.subjectId} value={s.subjectId}>
              {s.subjectName}
            </Option>
          ))}
        </Select>

        <Button 
          type="primary" 
          className="bg-blue-500 hover:bg-blue-600 text-white px-6"
          onClick={handleCreateBank}
          loading={loading}
        >
          {loading ? <Spin /> : "Tạo ngân hàng"}
        </Button>
      </div>
    </div>
  );
};

export default CreateQuestionBank;
