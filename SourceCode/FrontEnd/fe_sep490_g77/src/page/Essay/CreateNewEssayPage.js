import React, { useEffect, useState } from "react";
import { Input, Select, Button, Form, message } from "antd";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { useSelector } from 'react-redux';
import { jwtDecode } from "jwt-decode"

const { Option } = Select;

const CreateNewEssayPage = () => {
  const [form] = Form.useForm();
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [searchParams] = useSearchParams();
  let accId = -1;
  const token = useSelector((state) => state.token);

    accId = searchParams.get("accid") || localStorage.getItem("accid"); // Mặc định cũ

    // Nếu token tồn tại, giải mã để lấy AccId
    if (token) {
        try {
            const decoded = jwtDecode(token.token);
            accId = decoded.AccId || accId; // Ưu tiên lấy từ token nếu có
        } catch (error) {
            console.error("Invalid token", error);
        }
    }
  //const accId = searchParams.get("accid");
  const navigate = useNavigate();

  const fetchGradesSubjects = async () => {
    const [gradeRes, subjectRes] = await Promise.all([
      axios.get("http://localhost:7052/api/essay/grades"),
      axios.get("http://localhost:7052/api/essay/subjects"),
    ]);
    setGrades(gradeRes.data);
    setSubjects(subjectRes.data);
  };

  const handleSubmit = async (values) => {
    try {
      if (!/^[0-9]{2}[A-Z][0-9]?$/.test(values.classname)) {
        message.warning("Lớp phải đúng định dạng (VD: 10A3)");
        return;
      }

      await axios.post(`http://localhost:7052/api/essay/create/${accId}`, values);
      toast.success("Tạo đề thành công!");
      navigate(`/essay?accid=${accId}`);
    } catch {
      message.error("Lỗi khi tạo đề");
    }
  };

  useEffect(() => {
    fetchGradesSubjects();
  }, []);

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Tạo đề tự luận mới</h2>
      <Form layout="vertical" onFinish={handleSubmit} form={form}>
        <Form.Item name="examname" label="Tên đề" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="grade" label="Khối" rules={[{ required: true }]}>
          <Select>
            {grades.map((g) => (
              <Option key={g} value={g}>{g}</Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="subject" label="Môn học" rules={[{ required: true }]}>
          <Select>
            {subjects.map((s) => (
              <Option key={s} value={s}>{s}</Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
  name="classname"
  label="Lớp"
  rules={[{ required: true }]}
>
  <Input />
</Form.Item>

        <Button type="primary" htmlType="submit">Tạo đề</Button>
        <Button className="ml-3" onClick={() => navigate(-1)}>Quay lại</Button>
      </Form>
    </div>
  );
};

export default CreateNewEssayPage;
