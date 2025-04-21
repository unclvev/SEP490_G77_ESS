import React, { useState, useRef } from "react";
import { Button, Input, Table, Modal, message, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import axios from "axios";
import * as XLSX from "xlsx";
import { v4 as uuidv4 } from "uuid";

const ExamSetting = () => {
  // State lưu thông tin đề thi
  const [examData, setExamData] = useState({
    ExamId: 1,
    ExamName: "Đề thi thử nghiệm câu hỏi",
    Grade: "10",
    Subject: "Math",
    Classname: "10A",
    ExamType: "Multiple Choice",
    Examdata: {
      Questions: [
        {
          QuestionId: 40009,
          Content: "Thương của 36 chia cho 6 là bao nhiêu?",
          Type: "Multiple Choice",
          Answers: [
            { AnswerId: 30009, Content: "6", IsCorrect: true },
            { AnswerId: 30010, Content: "7", IsCorrect: false },
            { AnswerId: 30011, Content: "8", IsCorrect: false },
            { AnswerId: 30012, Content: "9", IsCorrect: false }
          ]
        },
        {
          QuestionId: 40018,
          Content: "Tổng của 9 và 10 là 19.",
          Type: "Short Answer",
          Answers: [
            { AnswerId: 30018, Content: "True", IsCorrect: true },
            { AnswerId: 30019, Content: "False", IsCorrect: false }
          ]
        }
      ]
    }
  });

  // State lưu danh sách đề thi đã tạo
  const [createdExams, setCreatedExams] = useState([]);
  // State lưu danh sách người thi sau khi import từ API
  const [studentList, setStudentList] = useState([]);
  // State và ref cho file upload
  const [file, setFile] = useState(null);
  const uploadRef = useRef();

  // Tạo mã đề ngẫu nhiên
  const generateExamCode = () => Math.floor(10000 + Math.random() * 90000);

  // Xáo trộn câu hỏi
  const shuffleQuestions = (questions) => questions.sort(() => Math.random() - 0.5);

  // Tạo đề thi giả lập
  const handleCreateExams = () => {
    const newExams = [];
    for (let i = 0; i < 5; i++) {
      newExams.push({
        ExamId: examData.ExamId,
        ExamCode: generateExamCode(),
        ExamName: examData.ExamName,
        Grade: examData.Grade,
        Subject: examData.Subject,
        Classname: examData.Classname,
        ExamType: examData.ExamType,
        Examdata: { Questions: shuffleQuestions([...examData.Examdata.Questions]) }
      });
    }
    setCreatedExams(newExams);
    message.success("Đã tạo xong các đề thi!");
  };

  // Xử lý chọn file
  const handleFileChange = (file) => {
    const isExcel = file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || file.type === "application/vnd.ms-excel";
    if (!isExcel) {
      message.error("Chỉ chấp nhận file Excel (.xlsx, .xls)");
      return false;
    }
    setFile(file);
    message.success(`Đã chọn file: ${file.name}`);
    return false; // Ngăn Upload tự động gửi
  };

  // Upload file lên API
  const handleUpload = async () => {
    if (!file) {
      message.warning("Vui lòng chọn file trước khi lưu danh sách học sinh");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("examId", examData.ExamId);

      const response = await axios.post("/api/ExamData/ImportStudentResults", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      message.success("Tải lên thành công!");
      setStudentList(response.data || []);
      setFile(null);
      if (uploadRef.current) uploadRef.current.state.fileList = [];
    } catch (error) {
      console.error(error);
      const msg = error.response?.data || "Tải lên thất bại!";
      message.error(msg);
    }
  };

  // Cấu hình cột bảng câu hỏi
  const columns = [
    { title: "Số Thứ Tự", dataIndex: "Order", key: "Order", render: (_, __, idx) => idx + 1 },
    { title: "Câu Hỏi", dataIndex: "Content", key: "Content" },
    { title: "Đáp Án Đúng", dataIndex: "Answers", key: "CorrectAnswer", render: (answers) => answers.filter(a => a.IsCorrect).map((ans,i) => {
        if (ans.Content === "True"|| ans.Content === "False") return i===0?1:0;
        return ["A","B","C","D"][i];
      }).join(", ")
    },
    { title: "Đáp Án", dataIndex: "Answers", key: "Answer", render: (answers) => answers.filter(a => a.IsCorrect).map(a => a.Content).join(", ") }
  ];

  // Dữ liệu bảng câu hỏi
  const questionData = examData.Examdata.Questions.map((q, idx) => ({ Order: idx + 1, Content: q.Content, Answers: q.Answers }));

  return (
    <div style={{ padding: 20 }}>
      <h2>Thông tin Đề Thi</h2>
      <Input
        value={examData.ExamName}
        onChange={e => setExamData({ ...examData, ExamName: e.target.value })}
        placeholder="Tên đề thi"
        style={{ marginBottom: 10 }}
      />
      <Input
        value={examData.Grade}
        onChange={e => setExamData({ ...examData, Grade: e.target.value })}
        placeholder="Lớp"
        style={{ marginBottom: 10 }}
      />
      <Input
        value={examData.Subject}
        onChange={e => setExamData({ ...examData, Subject: e.target.value })}
        placeholder="Môn học"
        style={{ marginBottom: 10 }}
      />

      <h3>Danh sách Câu Hỏi và Đáp Án</h3>
      <Table dataSource={questionData} columns={columns} rowKey="Order" pagination={false} />

      <Button type="primary" onClick={handleCreateExams} style={{ marginTop: 20 }}>
        Hoàn tất và Tạo Đề Thi
      </Button>

      {/* Modal Danh sách đề thi */}
      <Modal title="Danh Sách Đề Thi Được Tạo" visible={createdExams.length > 0} onCancel={() => setCreatedExams([])} footer={null}>
        <pre>{JSON.stringify(createdExams, null, 2)}</pre>
      </Modal>

      {/* Import Danh Sách Người Thi */}
      <div style={{ marginTop: 20 }}>
        <h3>Import Danh Sách Người Thi Từ Excel</h3>
        <Upload
          accept=".xlsx, .xls"
          showUploadList={false}
          beforeUpload={handleFileChange}
          ref={uploadRef}
        >
          <Button icon={<UploadOutlined />}>Chọn File Excel</Button>
        </Upload>
        <Button type="primary" onClick={handleUpload} style={{ marginLeft: 10 }}>
          Tải Lên và Import
        </Button>
      </div>

      {/* Bảng hiển thị dữ liệu import */}
      {studentList.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h4>Dữ liệu đã import từ API:</h4>
          <Table
            dataSource={studentList}
            columns={[
              { title: "STT", render: (_, __, idx) => idx + 1, key: "stt" },
              { title: "Số Báo Danh", dataIndex: "examCode", key: "examCode" },
              { title: "Họ và Tên", dataIndex: "studentName", key: "studentName" },
              { title: "Giới Tính", dataIndex: "gender", key: "gender", render: v => v === true ? "Nam" : v === false ? "Nữ" : "" },
              { title: "Ngày Sinh", dataIndex: "studentDob", key: "studentDob", render: d => d ? new Date(d).toLocaleDateString("vi-VN") : "" },
              { title: "Điểm", dataIndex: "score", key: "score" }
            ]}
            rowKey={(rec, idx) => idx}
          />
        </div>
      )}
    </div>
  );
};

export default ExamSetting;
