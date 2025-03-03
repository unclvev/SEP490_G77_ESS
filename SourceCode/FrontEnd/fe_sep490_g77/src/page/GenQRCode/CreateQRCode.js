import React, { useState, useEffect } from "react";
import { Radio, Button } from "antd";
import { QRCodeCanvas } from "qrcode.react"; 
import { useNavigate } from "react-router-dom";
import "tailwindcss/tailwind.css";

const GenQRCode = () => {
  const navigate = useNavigate();

  // ✅ Khôi phục dữ liệu từ localStorage nếu có
  const savedData = JSON.parse(localStorage.getItem("qrFormData")) || {};

  const [layout, setLayout] = useState(savedData.layout || "A4");
  const [testName, setTestName] = useState(savedData.testName || "");
  const [className, setClassName] = useState(savedData.className || ""); 
  const [printCount, setPrintCount] = useState(savedData.printCount || "1");
  const today = new Date().toISOString().split("T")[0];
  const [examDate, setExamDate] = useState(savedData.examDate || today);

  const paperImages = {
    A4: "https://imgv2-1-f.scribdassets.com/img/document/552606077/original/b125e87c90/1730151345?v=1",
    A3: "https://cdn.thuvienphapluat.vn/uploads/phapluat/2022-2/NTTY/mau-giay-thi-tu-luan-thi-thpt.jpg",
  };

  const qrPositions = {
    A4: { leftQR: { top: "140px", left: "15px" }, rightQR: { top: "80px", right: "15px" } },
    A3: { leftQR: { top: "80px", left: "320px" }, rightQR: { top: "100px", right: "20px" } },
  };

  const [paperImage, setPaperImage] = useState(paperImages[layout]);
  const [qrPosition, setQrPosition] = useState(qrPositions[layout]);

  // ✅ Lưu dữ liệu vào localStorage mỗi khi có thay đổi
  useEffect(() => {
    const formData = { testName, className, examDate, printCount, layout };
    localStorage.setItem("qrFormData", JSON.stringify(formData));
  }, [testName, className, examDate, printCount, layout]);

  const handlePrintCountChange = (e) => {
    const value = e.target.value;
    if (value === "" || (/^\d+$/.test(value) && parseInt(value) >= 1)) {
      setPrintCount(value);
    }
  };

  const handlePrintCountBlur = () => {
    if (printCount === "") {
      setPrintCount("1");
    }
  };

  const handleLayoutChange = (e) => {
    const selectedLayout = e.target.value;
    setLayout(selectedLayout);
    setPaperImage(paperImages[selectedLayout]);
    setQrPosition(qrPositions[selectedLayout]);
  };

  const encodeBase64 = (text) => {
    return btoa(unescape(encodeURIComponent(text))); 
  };

  const generateQRCodes = () => {
    let qrList = [];
    for (let i = 0; i < parseInt(printCount); i++) {
      // let qrData = encodeBase64(`${testName}_${className}_${examDate}_Code_${i}`);
      let qrData = `${testName}_${className}_${examDate}_Code_${i+1}`;
      qrList.push({ id: i, qrContent: qrData });
    }
    return qrList;
  };

  const demoQR = encodeBase64(`${testName}_${className}_${examDate}_Demo`);

  const handleContinue = () => {
    const qrList = generateQRCodes();
    navigate("/preview-gen-qr", {
      state: { testName, className, examDate, printCount, qrList, paperImage, qrPosition },
    });
  };

  return (
    <div className="flex min-h-screen bg-gray-200">
      <div className="flex-1 p-6">
        <div className="bg-blue-600 text-white text-center py-4 text-xl font-bold rounded-lg shadow-md w-[calc(100%-17rem)] mx-auto">
          GEN CODE CHO BÀI THI TỰ LUẬN
        </div>

        <div className="mt-6 bg-white p-6 rounded-lg shadow-lg w-[600px] mx-auto">
          <div className="flex items-center mb-4">
            <p className="text-lg font-semibold w-1/3">Tên bài kiểm tra:</p>
            <input
              type="text"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              className="w-2/3 border border-gray-300 rounded-md p-2"
            />
          </div>

          <div className="flex items-center mb-4">
            <p className="text-lg font-semibold w-1/3">Tên Lớp:</p>
            <input
              type="text"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className="w-2/3 border border-gray-300 rounded-md p-2"
            />
          </div>

          <div className="flex items-center mb-4">
            <p className="text-lg font-semibold w-1/3">Ngày kiểm tra:</p>
            <input
              type="date"
              value={examDate}
              min={today}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-2/3 border border-gray-300 rounded-md p-2"
            />
          </div>

          <div className="flex items-center mb-4">
            <p className="text-lg font-semibold w-1/3">Số lượng bản in:</p>
            <input
              type="number"
              min={1}
              value={printCount}
              onChange={handlePrintCountChange}
              onBlur={handlePrintCountBlur}
              className="w-2/3 border border-gray-300 rounded-md p-2"
            />
          </div>

          <div className="mt-4">
            <p className="text-lg font-semibold">Chọn loại giấy cho bài kiểm tra</p>
            <Radio.Group onChange={handleLayoutChange} value={layout} className="mt-2">
              <Radio value="A4">A4</Radio>
              <Radio value="A3">A3</Radio>
            </Radio.Group>
          </div>

          <div className="relative mt-6">
            <img src={paperImage} alt="Mẫu giấy thi" className="w-full border rounded-md shadow" />

            <div className="absolute" style={qrPosition.leftQR}>
              <QRCodeCanvas value={demoQR} size={50} />
            </div>

            <div className="absolute" style={qrPosition.rightQR}>
              <QRCodeCanvas value={demoQR} size={50} />
            </div>
          </div>

          <p className="mt-6 text-lg font-semibold">Bạn có chắc chắn muốn in không?</p>

          <div className="flex justify-between mt-4">
            <Button type="primary" className="w-32" onClick={handleContinue}>Tiếp tục</Button>
            <Button type="danger" className="w-32">Hủy</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenQRCode;
