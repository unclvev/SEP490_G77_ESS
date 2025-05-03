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
      className={`h-screen fixed left-0 top-0 bg-white border-r border-blue-500 text-black transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      } flex flex-col p-4`}
    >

      {/* Toggle button */}
      <div className="mb-6 flex justify-center">
        <button onClick={() => setCollapsed(!collapsed)} className="text-xl">
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </button>
      </div>

      <ul className="flex-1 space-y-4">
        {[
          { path: '/', icon: <HomeOutlined className="text-2xl" />, label: 'Trang chủ' },
          { path: '/question-bank', icon: <BookOutlined className="text-2xl text-green-300" />, label: 'Ngân hàng câu hỏi' },
          { path: '/exam', icon: <FileTextOutlined className="text-2xl text-yellow-300" />, label: 'Đề thi' },
          { path: '/grading', icon: <CheckOutlined className="text-2xl text-red-300" />, label: 'Chấm điểm' },
          { path: '/essay', icon: <UnorderedListOutlined className="text-2xl text-purple-300" />, label: 'Tự luận', link: true },
        ].map(({ path, icon, label, link }, idx) => (
          <li key={idx}>
            <Tooltip title={collapsed ? label : ''} placement="right">
              {link ? (
                <Link
                  to={path}
                  className={`flex items-center ${
                    collapsed ? 'justify-center' : 'justify-start space-x-3'
                  } text-lg font-semibold hover:text-gray-700`}
                >
                  {icon}
                  {!collapsed && <span>{label}</span>}
                </Link>
              ) : (
                <a
                  href={path}
                  className={`flex items-center ${
                    collapsed ? 'justify-center' : 'justify-start space-x-3'
                  } text-lg font-semibold hover:text-gray-700`}
                >
                  {icon}
                  {!collapsed && <span>{label}</span>}
                </a>
              )}
            </Tooltip>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;