import { Button, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import axios from "axios";
import { useState, useRef } from "react";

const ImportEssayPage = () => {
  const [file, setFile] = useState(null);
  const inputRef = useRef();
  const [importResult, setImportResult] = useState("");

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const isExcel = selectedFile.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    if (!isExcel) {
      message.error("❌ Chỉ chấp nhận file Excel (.xlsx)");
      return;
    }

    setFile(selectedFile);
    message.success(`📄 Đã chọn file: ${selectedFile.name}`);
  };

  const handleUpload = async () => {
    if (!file) {
      message.warning("⚠️ Vui lòng chọn file trước khi lưu danh sách học sinh");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post("https://localhost:7052/essay/savestudentlist", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      message.success("✅ Tải lên thành công!");
      setImportResult(response.data); // Có thể là "Import thành công!" hoặc kèm tổng số
      setFile(null);
      inputRef.current.value = "";
    } catch (error) {
      console.error(error);
      const msg = error.response?.data || "Tải lên thất bại!";
      message.error(`❌ ${msg}`);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-white rounded shadow">
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

      {importResult && (
        <p className="text-green-600 mt-4 font-semibold">
          ✅ {importResult}
        </p>
      )}
    </div>
  );
};

export default ImportEssayPage;
