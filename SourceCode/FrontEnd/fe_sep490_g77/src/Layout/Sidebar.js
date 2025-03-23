import React from "react";
import { Link } from "react-router-dom";
import { Tooltip } from "antd";
import {
  FileTextOutlined,
  BookOutlined,
  CheckCircleOutlined,
  UnorderedListOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";

const Sidebar = ({ collapsed, setCollapsed }) => {
  return (
    <div
      className={`h-screen fixed left-0 top-0 bg-blue-700 text-white transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      } p-4 flex flex-col`}
    >
      {/* Nút Toggle Sidebar */}
      <div className="flex justify-end">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-white text-xl focus:outline-none"
        >
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
      <ul className="flex-1 space-y-6 mt-4">
        <li>
          <Tooltip title={collapsed ? "Đề thi" : ""} placement="right">
            <Link
              to="/exam"
              className="flex items-center space-x-4 text-lg hover:text-gray-300"
            >
              <FileTextOutlined className="text-2xl text-yellow-300" />
              {!collapsed && <span className="font-semibold">Đề thi</span>}
            </Link>
          </Tooltip>
        </li>
        <li>
          <Tooltip title={collapsed ? "Ngân hàng câu hỏi" : ""} placement="right">
            <Link
              to="/question-bank"
              className="flex items-center space-x-4 text-lg hover:text-gray-300"
            >
              <BookOutlined className="text-2xl text-green-300" />
              {!collapsed && <span className="font-semibold">Ngân hàng câu hỏi</span>}
            </Link>
          </Tooltip>
        </li>
        <li>
          <Tooltip title={collapsed ? "Chấm điểm" : ""} placement="right">
            <Link
              to="/grading"
              className="flex items-center space-x-4 text-lg hover:text-gray-300"
            >
              <CheckCircleOutlined className="text-2xl text-red-300" />
              {!collapsed && <span className="font-semibold">Chấm điểm</span>}
            </Link>
          </Tooltip>
        </li>
        <li>
          <Tooltip title={collapsed ? "Gen QR Code" : ""} placement="right">
            <Link
              to="/essay"
              className="flex items-center space-x-4 text-lg hover:text-gray-300"
            >
              <UnorderedListOutlined className="text-2xl text-purple-300" />
              {!collapsed && <span className="font-semibold">Tự Luận</span>}
            </Link>
          </Tooltip>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
