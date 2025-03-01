import React, { useState, useEffect } from "react";
import { Select, Button, Collapse, message, Spin } from "antd";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "tailwindcss/tailwind.css";

const { Panel } = Collapse;
const { Option } = Select;

const CreateQuestionBank = () => {
  const navigate = useNavigate();
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [grade, setGrade] = useState(null);
  const [subject, setSubject] = useState(null);
  const [bank, setBank] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ Fetch danh sách Grades từ API
  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const response = await axios.get("https://localhost:7052/api/Bank/grades");
        if (response.data && response.data.length > 0) {
          setGrades(response.data);
        } else {
          message.warning("Không có dữ liệu Khối học.");
        }
      } catch (error) {
        message.error("Lỗi khi tải danh sách Khối học.");
        console.error("Lỗi API /grades:", error);
      }
    };
    fetchGrades();
  }, []);

  // ✅ Fetch danh sách Subjects từ API
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await axios.get("https://localhost:7052/api/Bank/subjects");
        if (response.data && response.data.length > 0) {
          setSubjects(response.data);
        } else {
          message.warning("Không có dữ liệu Môn học.");
        }
      } catch (error) {
        message.error("Lỗi khi tải danh sách Môn học.");
        console.error("Lỗi API /subjects:", error);
      }
    };
    fetchSubjects();
  }, []);

  // ✅ Xử lý tạo ngân hàng câu hỏi
  const handleCreateBank = async () => {
    if (!grade || !subject) {
      message.error("Vui lòng chọn đầy đủ Khối học và Môn học.");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post("https://localhost:7052/api/Bank/generate", {
        gradeId: grade,
        subjectId: subject
      });

      if (response.status === 200) {
        message.success("Ngân hàng câu hỏi đã được tạo thành công!");
        setBank(response.data);
        setSections(response.data.Sections || []);
      }
    } catch (error) {
      message.error("Không thể tạo ngân hàng câu hỏi.");
      console.error("Lỗi API /generate:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center">
        TẠO CẤU TRÚC NGÂN HÀNG CÂU HỎI
      </h1>

      {/* Dropdown chọn Grade và Subject */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <Select 
          placeholder="Chọn Khối học" 
          className="w-48" 
          onChange={setGrade} 
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
          className="w-48" 
          onChange={setSubject} 
          value={subject}
          loading={subjects.length === 0}
         
        >
          {subjects.map((s) => (
            <Option key={s.subjectId} value={s.subjectId}>
              {s.subjectName}
            </Option>
          ))}
        </Select>

        <Select defaultValue="chuong-trinh-bo" className="w-48" disabled>
          <Option value="chuong-trinh-bo">Chương trình của bộ</Option>
        </Select>
      </div>

      {/* Button Tạo Ngân Hàng Câu Hỏi */}
      <div className="flex justify-center mb-6">
        <Button 
          type="primary" 
          className="bg-blue-500 hover:bg-blue-600 text-white"
          onClick={handleCreateBank}
          loading={loading}
        >
          {loading ? <Spin /> : "Tạo ngân hàng câu hỏi"}
        </Button>
      </div>

      {/* Hiển thị ngân hàng sau khi tạo */}
      {bank && (
        <div className="bg-white p-4 shadow-md rounded text-center">
          <h2 className="font-bold text-lg">{bank.BankName}</h2>
          <p className="text-gray-600">Số câu hỏi: {bank.Totalquestion || 0}</p>
          <p className="text-gray-500">
            Ngày tạo: {bank.CreateDate ? new Date(bank.CreateDate).toLocaleString("vi-VN") : "N/A"}
          </p>
        </div>
      )}

      {/* Hiển thị danh sách chủ đề */}
      {bank && (
        <div className="mt-6 bg-white p-4 shadow-md rounded">
          <h2 className="text-lg font-semibold mb-4">Danh sách chủ đề</h2>
          {sections.length > 0 ? (
            <Collapse accordion>
              {sections.map((section) => (
                <Panel header={section.Secname} key={section.Secid}>
                  <p className="text-gray-600">Mục này chưa có câu hỏi.</p>
                </Panel>
              ))}
            </Collapse>
          ) : (
            <p className="text-gray-500 text-center">Không có chủ đề.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default CreateQuestionBank;
