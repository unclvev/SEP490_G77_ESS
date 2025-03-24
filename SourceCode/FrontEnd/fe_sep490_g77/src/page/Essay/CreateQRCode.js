import React, { useState, useEffect } from "react";
import { Radio, Button, message } from "antd";
import { QRCodeCanvas } from "qrcode.react"; 
import { useNavigate, useLocation } from "react-router-dom";
import "tailwindcss/tailwind.css";

const GenQRCode = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const savedData = JSON.parse(sessionStorage.getItem("qrFormData")) || {};
  const [layout, setLayout] = useState(savedData.layout || "A4");
  const [testName, setTestName] = useState(savedData.testName || "");
  const [gradeName, setGradeName] = useState(savedData.gradeName || "");
  const [className, setClassName] = useState(savedData.className || ""); 
  const [subjectName, setSubjectName] = useState(savedData.subjectName || ""); 
  const [printCount, setPrintCount] = useState(savedData.printCount || "1");
  const today = new Date().toISOString().split("T")[0];
  const [examDate, setExamDate] = useState(savedData.examDate || today);
  const [error, setError] = useState("");
  const { title, createdDate, grade, subject, nameClass} = location.state || {};


  // ✅ Chỉ định ảnh mặt trước & mặt sau theo loại giấy
  const paperImages = {
    A4: {
      front: "/templateAnswerEssay/A4/giấy thi A4-front.png",
      back: "/templateAnswerEssay/A4/giấy thi A4-back.png"
    },
    A3: {
      front: "/templateAnswerEssay/A3/A3_front.png",
      back: "/templateAnswerEssay/A3/A3_back.png"
    }
  };

  const qrPositions = {
    A4: { leftQR: { top: "160px", right: "85px" }, rightQR: { top: "60px", right: "85px" } },
    A3: { leftQR: { top: "80px", left: "320px" }, rightQR: { top: "100px", right: "20px" } },
  };

  const [qrPosition, setQrPosition] = useState(qrPositions[layout]);
  const [frontImage, setFrontImage] = useState(paperImages[layout].front);
  const [backImage, setBackImage] = useState(paperImages[layout].back);

  const isFormValid = testName.trim() !== "" && className.trim() !== "" && printCount > 0 && examDate !== "";

  useEffect(() => {
    const savedData = JSON.parse(sessionStorage.getItem("qrFormData")) || {};
    setLayout(savedData.layout || "A4");
    setTestName(savedData.testName || title || "");
    setClassName(savedData.className || nameClass || "");
    setGradeName(savedData.gradeName || grade || "");
    setSubjectName(savedData.subjectName || subject || "");
    setPrintCount(savedData.printCount || "1");
    setExamDate(savedData.examDate || createdDate || today);
  }, []);
  
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
    setFrontImage(paperImages[selectedLayout].front);
    setBackImage(paperImages[selectedLayout].back);
    setQrPosition(qrPositions[selectedLayout]);
  };

  const encodeBase64 = (text) => {
    return btoa(unescape(encodeURIComponent(text))); 
  };

  const generateQRCodes = () => {
    let qrList = [];
    for (let i = 0; i < parseInt(printCount); i++) {
      let qrData = `${testName}_${className}_${gradeName}_${subjectName}_${examDate}_Code_${i+1}`;
      qrList.push({ id: i, qrContent: qrData });
    }
    return qrList;
  };

  const demoQR = encodeBase64(`${testName}_${className}_${gradeName}_${subjectName}_${examDate}_Demo`);

  const handleContinue = () => {
    if (!isFormValid) {
      setError("Vui lòng nhập đầy đủ thông tin!");
      message.error("Bạn cần điền đầy đủ các trường trước khi tiếp tục.");
      return;
    }

    setError("");
    const formData = { testName, className, examDate, printCount, layout };
    sessionStorage.setItem("qrFormData", JSON.stringify(formData));

    const qrList = generateQRCodes();
    navigate("/essay/preview-gen-qr", {
      state: { testName, className, examDate, printCount, qrList, frontImage, backImage, qrPosition },
    });
  };

  const handleCancel = () => {
    sessionStorage.removeItem("qrFormData"); 
    navigate("/"); 
  };

  return (
    <div className="flex min-h-screen bg-gray-200">
      <div className="flex-1 p-6">
        <div className="bg-blue-600 text-white text-center py-4 text-xl font-bold rounded-lg shadow-md w-[calc(100%-17rem)] mx-auto">
          GEN CODE CHO BÀI THI TỰ LUẬN
        </div>

        <div className="mt-6 bg-white p-6 rounded-lg shadow-lg w-[600px] mx-auto">
          <p className="text-lg font-semibold text-red-500">(*) bắt buộc phải điền</p>

          <div className="flex items-center mb-4">
            <p className="text-lg font-semibold w-1/3">Tên bài kiểm tra</p>
            <input
              type="text"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              className="w-2/3 border border-gray-300 rounded-md p-2"
            />
          </div>

          <div className="flex items-center mb-4">
            <p className="text-lg font-semibold w-1/3">Tên Môn học</p>
            <input
              type="text"
              value={subject}
              onChange={(e) => setClassName(e.target.value)}
              className="w-2/3 border border-gray-300 rounded-md p-2"
            />
          </div>

          <div className="flex items-center mb-4">
            <p className="text-lg font-semibold w-1/3">Tên Khối</p>
            <input
              type="text"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className="w-2/3 border border-gray-300 rounded-md p-2"
            />
          </div>

          <div className="flex items-center mb-4">
            <p className="text-lg font-semibold w-1/3">Tên Lớp</p>
            <input
              type="text"
              value={grade}
              onChange={(e) => setClassName(e.target.value)}
              className="w-2/3 border border-gray-300 rounded-md p-2"
            />
          </div>

          <div className="flex items-center mb-4">
            <p className="text-lg font-semibold w-1/3">Ngày kiểm tra(<span className="text-red-500">*</span>)</p>
            <input
              type="date"
              value={examDate}
              min={today}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-2/3 border border-gray-300 rounded-md p-2"
            />
          </div>

          <div className="flex items-center mb-4">
            <p className="text-lg font-semibold w-1/3">Số lượng bản in(<span className="text-red-500">*</span>)</p>
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
            <p className="text-lg font-semibold">Chọn loại giấy</p>
            <Radio.Group onChange={handleLayoutChange} value={layout} className="mt-2">
              <Radio value="A4">A4</Radio>
              <Radio value="A3">A3</Radio>
            </Radio.Group>
          </div>

          {/* ✅ Hiển thị ảnh mặt trước */}
          <div className="mt-6">
            <p className="text-lg font-semibold">Mặt Trước</p>
            <div className="relative">
              <img src={frontImage} alt="Mặt trước" className="w-[500px] h-auto rounded-lg shadow-md" />
              <div className="absolute" style={qrPosition.leftQR}>
                <QRCodeCanvas value={demoQR} size={50} />
              </div>
              <div className="absolute" style={qrPosition.rightQR}>
                <QRCodeCanvas value={demoQR} size={50} />
              </div>
            </div>
          </div>

          {/* ✅ Hiển thị ảnh mặt sau */}
          <div className="mt-6">
            <p className="text-lg font-semibold">Mặt Sau</p>
            <div className="relative">
              <img src={backImage} alt="Mặt sau" className="w-[500px] h-auto rounded-lg shadow-md" />
            </div>
          </div>

          <p className="mt-6 text-lg font-semibold">Bạn có chắc chắn muốn in không?</p>

          <div className="flex justify-between mt-4">
            <Button type="primary" className="w-32" onClick={handleContinue} disabled={!isFormValid}>Tiếp tục</Button>
            <Button type="danger" className="w-32" onClick={handleCancel}>Hủy</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenQRCode;
