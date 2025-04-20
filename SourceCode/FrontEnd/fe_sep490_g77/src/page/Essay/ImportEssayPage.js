import { Button, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import axios from "axios";
import { useState, useRef } from "react";
import { useSearchParams,useParams } from "react-router-dom";
import { saveStudentList } from '../../services/api';

const ImportEssayPage = () => {
  const [searchParams] = useSearchParams();
  const { examid } = useParams(); 
  const [file, setFile] = useState(null);
  const inputRef = useRef();
  const [importResult, setImportResult] = useState("");
  const [importedStudents, setImportedStudents] = useState([]);
  const hasScore = importedStudents.some((s) => s.score !== undefined && s.score !== null);
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const isExcel = selectedFile.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    if (!isExcel) {
      message.error("Chỉ chấp nhận file Excel (.xlsx)");
      return;
    }

    setFile(selectedFile);
    message.success(`Đã chọn file: ${selectedFile.name}`);
  };

  const handleUpload = async () => {
    if (!file || !examid) {
      message.warning("Vui lòng chọn file và đảm bảo có ExamId.");
      return;
    }
  
    const formData = new FormData();
    formData.append("file", file);
    formData.append("examId", examid);
  
    try {
      const response = await saveStudentList(formData);
  
      message.success("Tải lên thành công!");
      setImportResult("Đã import " + response.data.length + " học sinh.");
      setImportedStudents(response.data); // ✅ cập nhật danh sách
      setFile(null);
      inputRef.current.value = "";
    } catch (error) {
      console.error("❌ Chi tiết lỗi:", error);
      const msg = error.response?.data;
      message.error(typeof msg === "string" ? msg : msg?.message || "Tải lên thất bại!");
    }
  };

  return (
    <div className="p-6 w-full px-8 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Import danh sách học sinh</h1>

      <p className="text-sm text-gray-600 mb-4">
        📥 Nếu chưa có file, bạn có thể tải
        <a
          href="/templateAnswerEssay/TemplateImportStudentList/EssTemplate.xlsx"
          download
          className="text-blue-500 underline ml-1"
        >
          mẫu Excel tại đây
        </a>
      </p>

      <input
        type="file"
        accept=".xlsx"
        onChange={handleFileChange}
        ref={inputRef}
        className="mb-4"
      />

      <div>
        <Button
          type="primary"
          icon={<UploadOutlined />}
          onClick={handleUpload}
          disabled={!file}
        >
          Lưu danh sách
        </Button>
      </div>
      {Array.isArray(importedStudents) && importedStudents.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-bold mb-2">Danh sách học sinh:</h2>
          <table className="w-full table-auto border border-collapse border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-2 py-1 text-left">STT</th>
                <th className="border px-2 py-1 text-left">Họ và Tên</th>
                <th className="border px-2 py-1 text-left">Giới tính</th>
                <th className="border px-2 py-1 text-left">Ngày sinh</th>
                <th className="border px-2 py-1 text-left">Điểm</th>
              </tr>
            </thead>
            <tbody>
              {importedStudents.map((student, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="border px-2 py-1">{index + 1}</td>
                  <td className="border px-2 py-1">{student.studentName}</td>
                  <td className="border px-2 py-1">{student.gender ? "Nam" : "Nữ"}</td>
                  <td className="border px-2 py-1">
                    {student.studentDob
                      ? new Date(student.studentDob).toLocaleDateString("vi-VN")
                      : ""}
                  </td>
                  {hasScore && (
                    <td className="border px-2 py-1">
                      {student.score !== undefined && student.score !== null ? student.score : ""}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {importResult && (
        <p className="text-green-600 mt-4 font-semibold">
          ✅ {importResult}
        </p>
      )}
    </div>
  );
};

export default ImportEssayPage;
