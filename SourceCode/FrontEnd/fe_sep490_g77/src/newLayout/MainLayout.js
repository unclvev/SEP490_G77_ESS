// MainLayout.js
import React from 'react';
import { Layout } from 'antd';
import Sidebar from './Sidebar';
import AppHeader from './Header';
import AppFooter from './Footer';

const { Content } = Layout;

const MainLayout = ({ children }) => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sidebar />
      
      {/* Layout bên phải chứa Header, Content và Footer */}
      <Layout>
        <AppHeader />
        <Content className="p-6 bg-gray-100">
          {children}
        </Content>
        <AppFooter />
      </Layout>
    </Layout>
  );
};

export default MainLayout;
