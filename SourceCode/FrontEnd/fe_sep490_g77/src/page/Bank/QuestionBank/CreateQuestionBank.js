import React, { useState, useEffect } from "react";
import { Select, Button, message, Spin } from "antd";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { jwtDecode } from "jwt-decode";
import {
  getBankGrades,
  getBankSubjects,
  getBankCurriculums,
  generateBank,
} from "../../../services/api";

const { Option } = Select;

const CreateQuestionBank = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useSelector((state) => state.token);

  let accid = searchParams.get("accid") || localStorage.getItem("accid");
  if (token) {
    try {
      const decoded = jwtDecode(token.token);
      accid = decoded.AccId || accid;
    } catch {}
  }

  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [curriculums, setCurriculums] = useState([]);
  const [grade, setGrade] = useState(null);
  const [subject, setSubject] = useState(null);
  const [curriculum, setCurriculum] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load grades & subjects once
    getBankGrades()
      .then((r) => setGrades(r.data))
      .catch(() => toast.error("Lỗi tải khối!"));
    getBankSubjects()
      .then((r) => setSubjects(r.data))
      .catch(() => toast.error("Lỗi tải môn!"));
  }, []);

  useEffect(() => {
    // mỗi lần grade/subject thay đổi → reset curriculum & curriculums
    setCurriculum(null);
    setCurriculums([]);
  
    // nếu chưa đủ điều kiện thì thôi
    if (!grade || !subject) return;
  
    // hàm async để gọi API
    const fetchCurriculums = async () => {
      try {
        const response = await getBankCurriculums(grade, subject);
        console.log("Curriculums data:", response.data);
        setCurriculums(response.data);
      } catch (error) {
        console.error("Lỗi tải chương trình học:", error);
        if (error.response) {
          toast.error(`Lỗi ${error.response.status}: ${error.response.data?.message || "Không tải được"}.`);
        } else if (error.request) {
          toast.error("Không nhận được phản hồi từ server.");
        } else {
          toast.error(`Lỗi: ${error.message}`);
        }
        setCurriculums([]);
      }
    };
  
    fetchCurriculums();
  }, [grade, subject]);
  

  const handleCreateBank = async () => {
    if (!grade || !subject || !curriculum) {
      return toast.error("⚠️ Vui lòng chọn đủ Khối – Môn – Chương trình.");
    }
    try {
      setLoading(true);
      const requestData = {
        gradeId: grade,
        subjectId: subject,
        curriculumId: curriculum === "custom" ? null : curriculum,
      };
      const res = await generateBank(accid, requestData);
      toast.success(`Ngân hàng "${res.data.bankName}" tạo thành công!`);
      navigate(`/question-bank-detail/${res.data.bankId}`);
    } catch {
      toast.error("❌ Tạo ngân hàng thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-6">TẠO NGÂN HÀNG CÂU HỎI</h1>
      <div className="flex gap-4">
        {/* 1) Khối học */}
        <Select
          placeholder="Chọn Khối học"
          className="w-52"
          value={grade}
          onChange={(value) => {
            setGrade(value);
            setSubject(null);
          }}
          loading={!grades.length}
        >
          {grades.map((g) => (
            <Option key={g.gradeId} value={g.gradeId}>
              {g.gradeLevel}
            </Option>
          ))}
        </Select>

        {/* 2) Môn học (disable nếu chưa chọn khối) */}
        <Select
          placeholder={grade ? "Chọn Môn học" : "Chọn Khối trước"}
          className="w-52"
          value={subject}
          onChange={(value) => setSubject(value)}
          disabled={!grade}
          loading={!subjects.length}
        >
          {subjects.map((s) => (
            <Option key={s.subjectId} value={s.subjectId}>
              {s.subjectName}
            </Option>
          ))}
        </Select>

        {/* 3) Chương trình (disable nếu chưa chọn môn; lúc enable sẽ gọi API) */}
        <Select
          placeholder={subject ? "Chọn Chương trình" : "Chọn Môn trước"}
          className="w-52"
          value={curriculum}
          onChange={(value) => setCurriculum(value)}
          disabled={!subject}
          loading={!curriculums.length && subject}
        >
          {/* Luôn luôn có trước Custom */}
          <Option key="custom" value="custom">
            Custom
          </Option>
          {curriculums.map((c) => (
            <Option key={c.curriculumId} value={c.curriculumId}>
              {c.curriculumName}
            </Option>
          ))}
        </Select>

        <Button
          type="primary"
          onClick={handleCreateBank}
          loading={loading}
          disabled={!curriculum}
        >
          {loading ? <Spin /> : "Tạo ngân hàng"}
        </Button>
      </div>
    </div>
  );
};

export default CreateQuestionBank;
