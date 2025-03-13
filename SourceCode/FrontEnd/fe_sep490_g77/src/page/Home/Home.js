import React from "react";
import { Card } from "antd";
import { useNavigate } from "react-router-dom";
import MainLayout from "../../Layout/MainLayout";
import "tailwindcss/tailwind.css";

// Danh sách tính năng trong Home
const features = [
  {
    title: "Đề thi",
    description: "Tạo, quản lý và xem danh sách đề thi.",
    img: "https://img.icons8.com/color/96/clipboard.png",
    path: "/exam",
  },
  {
    title: "Ngân hàng câu hỏi",
    description: "Quản lý bộ câu hỏi trắc nghiệm & tự luận.",
    img: "https://img.icons8.com/color/96/book.png",
    path: "/question-bank",
  },
  {
    title: "Chấm điểm",
    description: "Chấm điểm, xem kết quả & thống kê.",
    img: "https://img.icons8.com/color/96/checkmark.png",
    path: "/grading",
  },
  {
    title: "Gen QR code cho bài thi tự luận",
    description: "Tạo mã QR để quản lý & quét bài thi.",
    img: "https://img.icons8.com/color/96/qr-code.png",
    path: "/genqr",
  },
];

const Home = () => {
  const navigate = useNavigate();

  return (
    <MainLayout>
      {/* Nội dung chính */}
      <div className="p-8">
        {/* Tiêu đề */}
        <h1 className="text-3xl font-bold text-blue-700 text-center mb-6">
          ESS - Hệ Thống Hỗ Trợ Thi Cử
        </h1>

        {/* Grid hiển thị 4 card tính năng */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mx-auto max-w-6xl">
          {features.map((item, index) => (
            <Card
              key={index}
              hoverable
              className="shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer p-6 flex flex-col items-center text-center"
              onClick={() => navigate(item.path)}
            >
              <img src={item.img} alt={item.title} className="mb-3 w-20 h-20" />
              <h2 className="text-lg font-bold mb-2">{item.title}</h2>
              <p className="text-gray-600">{item.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  );
};

export default Home;
