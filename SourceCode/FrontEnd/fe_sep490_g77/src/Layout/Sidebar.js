import React from "react";
import { Link } from "react-router-dom";
import { Tooltip } from "antd";
import {
  FileTextOutlined,
  BookOutlined,
  CheckOutlined,
  UnorderedListOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HomeOutlined,
} from "@ant-design/icons";

const Sidebar = ({ collapsed, setCollapsed }) => {
  return (
    <div
      className={`h-screen fixed left-0 top-0 bg-blue-700 text-white transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      } p-4`}
    >
      <div className="flex justify-end mb-4">
        <button onClick={() => setCollapsed(!collapsed)} className="text-xl">
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </button>
      </div>

      {!collapsed && (
        <div className="mb-6 text-center">
          <img src="/logo.png" alt="Logo" className="mx-auto w-16" />
        </div>
      )}

      <ul className="space-y-4">
        <li>
          <Tooltip title={collapsed ? "Trang chủ" : ""} placement="right">
            <a
              href="/"
              className="flex items-center space-x-3 text-lg hover:text-gray-200"
            >
              <HomeOutlined className="text-2xl text-white" />
              {!collapsed && <span>Trang chủ</span>}
            </a>
          </Tooltip>
        </li>

        <li>
          <Tooltip title={collapsed ? "Đề thi" : ""} placement="right">
            <a
              href="/exam"
              className="flex items-center space-x-3 text-lg hover:text-gray-200"
            >
              <FileTextOutlined className="text-2xl text-yellow-300" />
              {!collapsed && <span>Đề thi</span>}
            </a>
          </Tooltip>
        </li>

        <li>
          <Tooltip title={collapsed ? "Ngân hàng câu hỏi" : ""} placement="right">
            <a
              href="/question-bank"
              className="flex items-center space-x-3 text-lg hover:text-gray-200"
            >
              <BookOutlined className="text-2xl text-green-300" />
              {!collapsed && <span>Ngân hàng câu hỏi</span>}
            </a>
          </Tooltip>
        </li>

        <li>
          <Tooltip title={collapsed ? "Chấm điểm" : ""} placement="right">
            <a
              href="/grading"
              className="flex items-center space-x-3 text-lg hover:text-gray-200"
            >
              <CheckOutlined className="text-2xl text-red-300" />
              {!collapsed && <span>Chấm điểm</span>}
            </a>
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
