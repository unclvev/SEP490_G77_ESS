import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FileTextOutlined, BookOutlined, CheckCircleOutlined, QrcodeOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";

const Sidebar = () => {
  // Đặt sidebar mặc định đóng (collapsed = true)
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className={`h-screen fixed left-0 top-0 bg-blue-700 text-white transition-all duration-300 ${collapsed ? "w-20" : "w-72"} p-4 flex flex-col`}>
      {/* Nút Toggle Mở/Đóng Sidebar */}
      <div className="flex justify-end">
        <button onClick={() => setCollapsed(!collapsed)} className="text-white text-xl focus:outline-none">
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </button>
      </div>

      {/* Logo (ẩn nếu thu nhỏ) */}
      {!collapsed && (
        <div className="mb-6 text-center">
          <img src="/logo.png" alt="Exam Support System" className="w-36 mx-auto" />
        </div>
      )}

      {/* Danh sách menu */}
      <ul className="flex-1 space-y-6">
        <li>
          <Link to="/exam" className="flex items-center space-x-4 text-lg hover:text-gray-300">
            <FileTextOutlined className="text-2xl text-yellow-300" />
            {!collapsed && <span className="font-semibold">Đề thi</span>}
          </Link>
        </li>
        <li>
          <Link to="/question-bank" className="flex items-center space-x-4 text-lg hover:text-gray-300">
            <BookOutlined className="text-2xl text-green-300" />
            {!collapsed && <span className="font-semibold">Ngân hàng câu hỏi</span>}
          </Link>
        </li>
        <li>
          <Link to="/grading" className="flex items-center space-x-4 text-lg hover:text-gray-300">
            <CheckCircleOutlined className="text-2xl text-red-300" />
            {!collapsed && <span className="font-semibold">Grading</span>}
          </Link>
        </li>
        <li>
          <Link to="/genqr" className="flex items-center space-x-4 text-lg hover:text-gray-300">
            <QrcodeOutlined className="text-2xl text-purple-300" />
            {!collapsed && <span className="font-semibold">Gen QR code</span>}
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
