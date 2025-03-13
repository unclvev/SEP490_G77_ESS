import React, { useState, useEffect } from "react";
import { Select, Button, message, Spin } from "antd";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
const { Option } = Select;

const CreateQuestionBank = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // ✅ Lấy params từ URL
  const accid = searchParams.get("accid") || localStorage.getItem("accid"); // ✅ Ưu tiên lấy từ URL trước

  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [curriculums, setCurriculums] = useState([]);
  const [grade, setGrade] = useState(null);
  const [subject, setSubject] = useState(null);
  const [curriculum, setCurriculum] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!accid) {
      toast .error("❌ Không tìm thấy thông tin tài khoản!");
      return;
    }

    const fetchGrades = async () => {
      try {
        const response = await axios.get("https://localhost:7052/api/Bank/grades");
        setGrades(response.data || []);
      } catch (error) {
        toast.error("Lỗi khi tải danh sách Khối học.");
      }
    };

    const fetchSubjects = async () => {
      try {
        const response = await axios.get("https://localhost:7052/api/Bank/subjects");
        setSubjects(response.data || []);
      } catch (error) {
        toast.error("Lỗi khi tải danh sách Môn học.");
      }
    };

    const fetchCurriculums = async () => {
      try {
        const response = await axios.get("https://localhost:7052/api/Bank/curriculums");
        setCurriculums(response.data || []);
      } catch (error) {
        toast.error("Lỗi khi tải danh sách Chương trình học.");
      }
    };

    fetchGrades();
    fetchSubjects();
    fetchCurriculums();
  }, [accid]);

  const handleCreateBank = async () => {
    if (!grade || !subject || !curriculum) {
      toast.error("⚠️ Vui lòng chọn đầy đủ Khối học, Môn học và Chương trình!");
      return;
    }

    if (!accid) {
      toast.error("❌ Không tìm thấy thông tin tài khoản!");
      return;
    }

    try {
      setLoading(true);
      const requestData = {
        gradeId: grade,
        subjectId: subject,
        curriculumId: curriculum === "custom" ? null : curriculum,
      };

      // ✅ Gửi accid vào API
      const response = await axios.post(`https://localhost:7052/api/Bank/generate/${accid}`, requestData);

      if (response.status === 200) {
        toast.success(`✅ Ngân hàng câu hỏi "${response.data.bankName}" đã được tạo thành công!`);
        navigate(`/question-bank-detail/${response.data.bankId}`);
      }
    } catch (error) {
      toast.error("❌ Không thể tạo ngân hàng câu hỏi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen flex flex-col items-center">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center">
        TẠO NGÂN HÀNG CÂU HỎI
      </h1>

      <div className="flex flex-col md:flex-row gap-3 items-center">
        {/* 🔹 Chọn Khối học */}
        <Select
          placeholder="Chọn Khối học"
          className="w-52"
          onChange={(value) => setGrade(value)}
          value={grade}
          loading={grades.length === 0}
        >
          {grades.map((g) => (
            <Option key={g.gradeId} value={g.gradeId}>
              {g.gradeLevel}
            </Option>
          ))}
        </Select>

        {/* 🔹 Chọn Môn học */}
        <Select
          placeholder="Chọn Môn học"
          className="w-52"
          onChange={(value) => setSubject(value)}
          value={subject}
          loading={subjects.length === 0}
        >
          {subjects.map((s) => (
            <Option key={s.subjectId} value={s.subjectId}>
              {s.subjectName}
            </Option>
          ))}
        </Select>

        {/* 🔹 Chọn Chương trình học */}
        <Select
          placeholder="Chọn Chương trình học"
          className="w-52"
          onChange={(value) => setCurriculum(value)}
          value={curriculum}
          loading={curriculums.length === 0}
        >
          {/* ✅ Thêm lựa chọn "Custom" */}
          <Option key="custom" value="custom">
            Custom
          </Option>

          {curriculums.map((c) => (
            <Option key={c.curriculumId} value={c.curriculumId}>
              {c.curriculumName}
            </Option>
          ))}
        </Select>

        {/* 🔹 Nút tạo ngân hàng */}
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
