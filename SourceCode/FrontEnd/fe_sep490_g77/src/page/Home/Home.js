import React from 'react';
import { Card } from 'antd';
import { useNavigate } from 'react-router-dom';
import 'tailwindcss/tailwind.css';

function Home() {
  const navigate = useNavigate();

  const features = [
    {
      title: 'Đề thi',
      description: 'Tạo, quản lý và xem danh sách đề thi.',
      img: 'https://img.icons8.com/color/48/test-passed.png',
      path: '/exam' // ví dụ placeholder
    },
    {
      title: 'Ngân hàng câu hỏi',
      description: 'Quản lý bộ câu hỏi trắc nghiệm & tự luận.',
      img: 'https://img.icons8.com/color/48/books.png',
      path: '/question-bank' // <-- chuyển hướng đến QuestionBank
    },
    {
      title: 'Grading',
      description: 'Chấm điểm, xem kết quả & thống kê.',
      img: 'https://img.icons8.com/color/48/checkmark.png',
      path: '/grading' // ví dụ placeholder
    },
    {
      title: 'Gen QR code cho bài thi lý luận',
      description: 'Tạo mã QR để quản lý & quét bài thi.',
      img: 'https://img.icons8.com/color/48/qr-code.png',
      path: '/qr' // ví dụ placeholder
    }
  ];

  const handleCardClick = (path) => {
    if (path) {
      navigate(path);
    }
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-blue-700 text-center">
        ESS - Hệ thống hỗ trợ thi cử
      </h1>

      {/* Grid hiển thị 4 card */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {features.map((item, index) => (
          <Card
            key={index}
            hoverable
            className="shadow hover:shadow-lg transition-shadow duration-300 cursor-pointer"
            onClick={() => handleCardClick(item.path)}
          >
            <div className="flex flex-col items-center">
              <img src={item.img} alt={item.title} className="mb-3" />
              <h2 className="text-lg font-bold mb-2">{item.title}</h2>
              <p className="text-gray-600 text-center">{item.description}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default Home;