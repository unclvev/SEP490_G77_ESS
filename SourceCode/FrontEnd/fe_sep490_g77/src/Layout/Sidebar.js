import React from "react";
import { Link } from "react-router-dom";
import { FileTextOutlined, BookOutlined, CheckCircleOutlined, QrcodeOutlined } from "@ant-design/icons";

const Sidebar = () => {
  return (
    <div className="w-72 bg-blue-700 h-screen fixed left-0 top-0 text-white p-6 flex flex-col items-center">
      {/* Logo thêm vào Sidebar */}
      <div className="mb-6">
        <img src="/logo.png" alt="Exam Support System" className="w-36 mx-auto" />
      </div>

      {/* Danh sách menu */}
      <ul className="w-full space-y-6">
        <li>
          <Link to="/exam" className="flex items-center space-x-4 text-lg hover:text-gray-300">
            <FileTextOutlined className="text-2xl text-yellow-300" />
            <span className="font-semibold">Đề thi</span>
          </Link>
        </li>
        <li>
          <Link to="/question-bank" className="flex items-center space-x-4 text-lg hover:text-gray-300">
            <BookOutlined className="text-2xl text-green-300" />
            <span className="font-semibold">Ngân hàng câu hỏi</span>
          </Link>
        </li>
        <li>
          <Link to="/grading" className="flex items-center space-x-4 text-lg hover:text-gray-300">
            <CheckCircleOutlined className="text-2xl text-red-300" />
            <span className="font-semibold">Grading</span>
          </Link>
        </li>
        <li>
          <Link to="/qr" className="flex items-center space-x-4 text-lg hover:text-gray-300">
            <QrcodeOutlined className="text-2xl text-purple-300" />
            <span className="font-semibold">Gen QR code</span>
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
