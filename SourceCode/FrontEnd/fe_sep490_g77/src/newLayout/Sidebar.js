// Sidebar.js
import React from 'react';
import { Layout, Menu } from 'antd';
import {
  HomeOutlined,
  FileTextOutlined,
  DatabaseOutlined,
  CheckCircleOutlined,
  QrcodeOutlined
} from '@ant-design/icons';


import 'antd/dist/reset.css';

const { Sider } = Layout;

const Sidebar = () => {
  return (
    <Sider breakpoint="lg" collapsedWidth="80" className="bg-white">
      <div className="h-16 flex items-center justify-center bg-blue-500">
        <h1 className="text-white font-bold text-xl">ESS</h1>
      </div>
      <Menu theme="light" mode="inline" defaultSelectedKeys={['1']}>
        <Menu.Item key="1" icon={<HomeOutlined />}>
          Trang chủ
        </Menu.Item>
        <Menu.Item key="2" icon={<FileTextOutlined />}>
          Đề thi
        </Menu.Item>
        <Menu.Item key="3" icon={<DatabaseOutlined />}>
          Ngân hàng câu hỏi
        </Menu.Item>
        <Menu.Item key="4" icon={<CheckCircleOutlined />}>
          Grading
        </Menu.Item>
        <Menu.Item key="5" icon={<QrcodeOutlined />}>
          Gen QR Code
        </Menu.Item>
      </Menu>
    </Sider>
  );
};

export default Sidebar;
